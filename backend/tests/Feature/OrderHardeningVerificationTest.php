<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\OrderItem;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\User;
use App\Services\Ecommerce\OrderNumberGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrderHardeningVerificationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected string $customerToken;
    protected User $adminUser;
    protected string $adminToken;
    protected CustomerAddress $address;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Customer Setup: status = 0
        $this->customer = User::create([
            'name' => 'Customer Hardening Test',
            'email' => 'customer_harden_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0,
        ]);
        $this->customerToken = $this->customer->createToken('customer-token')->plainTextToken;

        // Admin Setup: status = 2 (or 1)
        $this->adminUser = User::create([
            'name' => 'Admin Hardening Test',
            'email' => 'admin_harden_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 2,
        ]);
        $this->adminToken = $this->adminUser->createToken('admin-token')->plainTextToken;

        // Shipping Address Setup
        $this->address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'recipient_name' => 'Penerima Hardening',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Uji Keamanan No. 99',
            'district' => 'Klojen',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65111',
            'is_default' => true,
        ]);

        // Category
        $this->category = Category::create([
            'name' => 'Kategori Hardening',
            'slug' => 'kategori-hardening-' . uniqid(),
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    /**
     * TEST A: Customer cannot access Admin Order endpoints (Expected: 403 Forbidden).
     */
    public function test_a_customer_cannot_access_admin_orders(): void
    {
        // Create an existing order
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-20260929-TEST',
            'status' => 'pending',
            'shipping_method' => 'jnt',
            'shipping_name' => $this->address->recipient_name,
            'shipping_whatsapp' => $this->address->whatsapp,
            'shipping_address' => $this->address->address,
            'shipping_kecamatan' => $this->address->district,
            'shipping_city' => $this->address->city,
            'shipping_province' => $this->address->province,
            'shipping_postal_code' => $this->address->postal_code,
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
        ]);

        // 1. GET /api/ecommerce/admin/orders -> 403
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(403);

        // 2. GET /api/ecommerce/admin/orders/{id} -> 403
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson("/api/ecommerce/admin/orders/{$order->id}");
        $showRes->assertStatus(403);

        // 3. PUT /api/ecommerce/admin/orders/{id} -> 403
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'status' => 'confirmed',
            ]);
        $updateRes->assertStatus(403);
    }

    /**
     * TEST B: Admin / Operator can access Admin Order endpoints (Expected: 200 OK).
     */
    public function test_b_admin_can_access_admin_orders(): void
    {
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-20260929-ADMN',
            'status' => 'pending',
            'shipping_method' => 'jnt',
            'shipping_name' => $this->address->recipient_name,
            'shipping_whatsapp' => $this->address->whatsapp,
            'shipping_address' => $this->address->address,
            'shipping_kecamatan' => $this->address->district,
            'shipping_city' => $this->address->city,
            'shipping_province' => $this->address->province,
            'shipping_postal_code' => $this->address->postal_code,
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
        ]);

        // 1. List
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(200);

        // 2. Show
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/ecommerce/admin/orders/{$order->id}");
        $showRes->assertStatus(200);

        // 3. Update
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'status' => 'confirmed',
            ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('confirmed', $updateRes->json('data.status'));
    }

    /**
     * TEST C: Sequential Order Number Generation.
     */
    public function test_c_sequential_order_numbers(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Seq Test',
            'slug' => 'produk-seq-test-' . uniqid(),
            'base_price' => 20000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Standar',
            'sku' => 'SEQ-' . uniqid(),
            'price' => 20000,
            'stock' => 100,
            'is_active' => true,
        ]);

        $orderNumbers = [];
        for ($i = 0; $i < 3; $i++) {
            $res = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
                ->postJson('/api/ecommerce/orders', [
                    'address_id' => $this->address->id,
                    'shipping_method' => 'jnt',
                    'items' => [
                        [
                            'product_id' => $product->id,
                            'variant_id' => $variant->id,
                            'quantity' => 1,
                        ],
                    ],
                ]);

            $res->assertStatus(201);
            $orderNumbers[] = $res->json('data.order_number');
        }

        // Validate format: KREZOEMA-YYYYMMDD-XXXX
        $todayStr = date('Ymd');
        foreach ($orderNumbers as $on) {
            $this->assertMatchesRegularExpression("/^KREZOEMA-{$todayStr}-\\d{4}$/", $on);
        }

        // Validate strictly sequential
        $seq1 = (int) substr($orderNumbers[0], -4);
        $seq2 = (int) substr($orderNumbers[1], -4);
        $seq3 = (int) substr($orderNumbers[2], -4);

        $this->assertEquals($seq1 + 1, $seq2);
        $this->assertEquals($seq2 + 1, $seq3);
    }

    /**
     * TEST D: Order Number Collision-Safe / Concurrency Simulation.
     */
    public function test_d_concurrent_order_number_simulation(): void
    {
        $generated = [];
        for ($i = 0; $i < 10; $i++) {
            $num = OrderNumberGenerator::generate();
            $generated[] = $num;
        }

        // All 10 must be unique
        $this->assertCount(10, array_unique($generated));

        // Format validation
        $todayStr = date('Ymd');
        foreach ($generated as $num) {
            $this->assertMatchesRegularExpression("/^KREZOEMA-{$todayStr}-\\d{4}$/", $num);
        }
    }

    /**
     * TEST E: Cancelled -> Active (confirmed/processing/shipped) with sufficient stock.
     * Spec: stock 10, order qty 3 -> sukses, stock 7
     */
    public function test_e_cancelled_to_active_with_sufficient_stock(): void
    {
        foreach (['confirmed', 'processing', 'shipped'] as $targetStatus) {
            $product = Product::create([
                'category_id' => $this->category->id,
                'name' => "Produk Safe Stock {$targetStatus}",
                'slug' => 'produk-safe-stock-' . $targetStatus . '-' . uniqid(),
                'base_price' => 30000,
                'is_active' => true,
            ]);

            // Current stock = 10
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'name' => 'Varian Cukup',
                'sku' => 'STK-CUKUP-' . uniqid(),
                'price' => 30000,
                'stock' => 10,
                'is_active' => true,
            ]);

            // Create cancelled order with quantity = 3
            $order = Order::create([
                'customer_id' => $this->customer->id,
                'order_number' => 'KREZOEMA-20260929-' . strtoupper($targetStatus) . '-' . uniqid(),
                'status' => 'cancelled',
                'shipping_method' => 'jnt',
                'shipping_name' => $this->address->recipient_name,
                'shipping_whatsapp' => $this->address->whatsapp,
                'shipping_address' => $this->address->address,
                'shipping_kecamatan' => $this->address->district,
                'shipping_city' => $this->address->city,
                'shipping_province' => $this->address->province,
                'shipping_postal_code' => $this->address->postal_code,
                'subtotal' => 90000,
                'shipping_cost' => 0,
                'total' => 90000,
            ]);

            $order->items()->create([
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'product_name' => $product->name,
                'variant_name' => $variant->name,
                'sku' => $variant->sku,
                'unit_price' => 30000,
                'quantity' => 3,
                'subtotal' => 90000,
            ]);

            $this->app['auth']->forgetGuards();

            // Operator changes status: cancelled -> confirmed/processing/shipped
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                    'status' => $targetStatus,
                ]);

            $response->assertStatus(200);
            $this->assertEquals($targetStatus, $response->json('data.status'));

            // Stock must be decremented: 10 - 3 = 7
            $this->assertEquals(7, $variant->fresh()->stock);
        }
    }

    /**
     * TEST F: Cancelled -> Active (confirmed/processing/shipped) with insufficient stock (Expected: 422 + rollback).
     * Spec: stock 2, order qty 5 -> gagal 422, stock tetap 2, status tetap cancelled
     */
    public function test_f_cancelled_to_active_with_insufficient_stock(): void
    {
        foreach (['confirmed', 'processing', 'shipped'] as $targetStatus) {
            $product = Product::create([
                'category_id' => $this->category->id,
                'name' => "Produk Kurang Stock {$targetStatus}",
                'slug' => 'produk-kurang-stock-' . $targetStatus . '-' . uniqid(),
                'base_price' => 30000,
                'is_active' => true,
            ]);

            // Current stock = 2
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'name' => 'Varian Kurang',
                'sku' => 'STK-KURANG-' . uniqid(),
                'price' => 30000,
                'stock' => 2,
                'is_active' => true,
            ]);

            // Cancelled order requesting quantity = 5
            $order = Order::create([
                'customer_id' => $this->customer->id,
                'order_number' => 'KREZOEMA-20260929-FAIL-' . strtoupper($targetStatus) . '-' . uniqid(),
                'status' => 'cancelled',
                'shipping_method' => 'jnt',
                'shipping_name' => $this->address->recipient_name,
                'shipping_whatsapp' => $this->address->whatsapp,
                'shipping_address' => $this->address->address,
                'shipping_kecamatan' => $this->address->district,
                'shipping_city' => $this->address->city,
                'shipping_province' => $this->address->province,
                'shipping_postal_code' => $this->address->postal_code,
                'subtotal' => 150000,
                'shipping_cost' => 0,
                'total' => 150000,
            ]);

            $order->items()->create([
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'product_name' => $product->name,
                'variant_name' => $variant->name,
                'sku' => $variant->sku,
                'unit_price' => 30000,
                'quantity' => 5,
                'subtotal' => 150000,
            ]);

            $this->app['auth']->forgetGuards();

            // Operator attempts: cancelled -> confirmed/processing/shipped
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                    'status' => $targetStatus,
                ]);

            // Must fail with 422
            $response->assertStatus(422);

            // Status must remain 'cancelled'
            $this->assertEquals('cancelled', $order->fresh()->status);

            // Stock must remain unchanged at 2 (NOT negative -3)
            $this->assertEquals(2, $variant->fresh()->stock);
        }
    }

    /**
     * TEST G: Regression Order Creation: Variant product.
     */
    public function test_g_regression_variant_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Kalung Kaca Kristal',
            'slug' => 'kalung-kaca-kristal-' . uniqid(),
            'base_price' => 60000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Ruby Merah Delima',
            'sku' => 'KKK-RUBY-' . uniqid(),
            'price' => 85000,
            'stock' => 15,
            'is_active' => true,
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jne',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'quantity' => 3,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $orderData = $response->json('data');
        $item = $orderData['items'][0];

        $this->assertEquals($variant->id, $item['variant_id']);
        $this->assertEquals('Ruby Merah Delima', $item['variant_name']);
        $this->assertEquals($variant->sku, $item['sku']);
        $this->assertEquals(85000.00, $item['unit_price']);
        $this->assertEquals(255000.00, $item['subtotal']);

        // Stock decremented: 15 - 3 = 12
        $this->assertEquals(12, $variant->fresh()->stock);
    }

    /**
     * TEST G: Regression Order Creation: Non-variant product.
     */
    public function test_g_regression_non_variant_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Benang Nilon Polos',
            'slug' => 'benang-nilon-polos-' . uniqid(),
            'base_price' => 15000,
            'is_active' => true,
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 4,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $orderData = $response->json('data');
        $item = $orderData['items'][0];

        $this->assertNull($item['variant_id']);
        $this->assertNull($item['variant_name']);
        $this->assertNull($item['sku']);
        $this->assertEquals(15000.00, $item['unit_price']);
        $this->assertEquals(60000.00, $item['subtotal']);
        $this->assertEquals(60000.00, $orderData['total']);
    }
}
