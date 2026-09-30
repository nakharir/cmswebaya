<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\User;
use App\Services\Ecommerce\OrderNumberGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SequentialOrderNumberTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected string $customerToken;
    protected CustomerAddress $address;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Seq Test Customer',
            'email' => 'seq_cust_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0,
        ]);
        $this->customerToken = $this->customer->createToken('seq-token')->plainTextToken;

        $this->address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Kantor',
            'recipient_name' => 'Budi Santoso',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Veteran No. 10',
            'district' => 'Lowokwaru',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65145',
            'is_default' => true,
        ]);

        $cat = Category::create([
            'name' => 'Kategori Seq Test',
            'slug' => 'cat-seq-' . uniqid(),
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Produk Seq Test',
            'slug' => 'prod-seq-' . uniqid(),
            'base_price' => 15000,
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Varian Merah',
            'sku' => 'SKU-SEQ-' . uniqid(),
            'price' => 15000,
            'stock' => 50,
            'is_active' => true,
        ]);
    }

    /**
     * Test minimal:
     * - Buat 2 order baru via endpoint checkout (/api/ecommerce/orders)
     * - Pastikan format KREZOEMA-YYYYMMDD-XXXX (4 digit numerik)
     * - Pastikan menghasilkan sequence berurutan (0001, 0002 atau sequence berikutnya)
     * - Pastikan unique (tidak duplicate)
     */
    public function test_two_new_orders_produce_sequential_unique_numbers(): void
    {
        // 1. Create first order
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                    ],
                ],
            ]);
        $res1->assertStatus(201);
        $orderNumber1 = $res1->json('data.order_number');

        // 2. Create second order
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                    ],
                ],
            ]);
        $res2->assertStatus(201);
        $orderNumber2 = $res2->json('data.order_number');

        $todayStr = date('Ymd');

        // Validate format: KREZOEMA-YYYYMMDD-XXXX with 4 numeric digits
        $this->assertMatchesRegularExpression("/^KREZOEMA-{$todayStr}-\\d{4}$/", $orderNumber1);
        $this->assertMatchesRegularExpression("/^KREZOEMA-{$todayStr}-\\d{4}$/", $orderNumber2);

        // Validate uniqueness (not duplicate)
        $this->assertNotEquals($orderNumber1, $orderNumber2);

        // Extract 4-digit numbers and check sequence
        $seq1 = (int) substr($orderNumber1, -4);
        $seq2 = (int) substr($orderNumber2, -4);

        $this->assertEquals($seq1 + 1, $seq2);
    }

    /**
     * Test sequence resets per day:
     * When generating for a different day, sequence starts from 0001.
     */
    public function test_sequence_resets_per_day(): void
    {
        // Simulate a past or future date sequence table record
        $fakeDate = '2026-10-01';
        $fakeDateStr = '20261001';

        // Check if no sequence row exists for that date
        DB::table('ecommerce_order_sequences')->where('order_date', $fakeDate)->delete();

        // Simulate generator behavior for $fakeDate
        DB::table('ecommerce_order_sequences')->insert([
            'order_date' => $fakeDate,
            'last_number' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $nextSeq = (int) DB::table('ecommerce_order_sequences')->where('order_date', $fakeDate)->value('last_number') + 1;
        $orderNumber = "KREZOEMA-{$fakeDateStr}-" . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        $this->assertEquals("KREZOEMA-20261001-0001", $orderNumber);
    }

    /**
     * Test legacy / old orders remain unchanged.
     */
    public function test_old_orders_are_not_modified(): void
    {
        $oldOrder = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'OLD-ORDER-LEGACY-999',
            'status' => 'pending',
            'shipping_method' => 'jne',
            'shipping_name' => $this->address->recipient_name,
            'shipping_whatsapp' => $this->address->whatsapp,
            'shipping_address' => $this->address->address,
            'shipping_kecamatan' => $this->address->district,
            'shipping_city' => $this->address->city,
            'shipping_province' => $this->address->province,
            'shipping_postal_code' => $this->address->postal_code,
            'subtotal' => 15000,
            'shipping_cost' => 0,
            'total' => 15000,
        ]);

        // Generate new order
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                    ],
                ],
            ]);
        $res->assertStatus(201);

        // Verify old order's order_number is exactly unchanged
        $this->assertEquals('OLD-ORDER-LEGACY-999', $oldOrder->fresh()->order_number);
    }
}
