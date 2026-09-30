<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\OrderItem;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrderMilestoneVerificationTest extends TestCase
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

        // Customer Setup
        $this->customer = User::create([
            'name' => 'Pelanggan Test KREZOEMA',
            'email' => 'customer_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0, // Customer role
        ]);
        $this->customerToken = $this->customer->createToken('customer-token')->plainTextToken;

        // Admin Setup
        $this->adminUser = User::create([
            'name' => 'Admin Test KREZOEMA',
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 2,
        ]);
        $this->adminToken = $this->adminUser->createToken('admin-token')->plainTextToken;

        // Shipping Address Setup
        $this->address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'recipient_name' => 'Pelanggan Test',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Kerajinan No. 12',
            'district' => 'Klojen',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65111',
            'is_default' => true,
        ]);

        // Category
        $this->category = Category::create([
            'name' => 'Manik Kaca Test',
            'slug' => 'manik-kaca-test-' . uniqid(),
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    /**
     * TEST A:
     * Product: Manik Kaca Aurora
     * Variant Merah Rp70.000 × 2
     * Variant Biru Rp75.000 × 1
     * Expected: Subtotal Rp215.000
     */
    public function test_a_variant_price_and_subtotal_calculation(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Manik Kaca Aurora',
            'slug' => 'manik-kaca-aurora-' . uniqid(),
            'base_price' => 50000,
            'is_active' => true,
        ]);

        $variantMerah = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Merah',
            'sku' => 'AURORA-RED',
            'price' => 70000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $variantBiru = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Biru',
            'sku' => 'AURORA-BLU',
            'price' => 75000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'notes' => 'Test order calculation',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variantMerah->id,
                        'quantity' => 2,
                    ],
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variantBiru->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $orderData = $response->json('data');

        $this->assertEquals(215000.00, $orderData['subtotal']);
        $this->assertEquals(215000.00, $orderData['total']);
        $this->assertCount(2, $orderData['items']);

        // Verify Merah: 2 x 70000 = 140000
        $itemMerah = collect($orderData['items'])->firstWhere('variant_id', $variantMerah->id);
        $this->assertNotNull($itemMerah);
        $this->assertEquals(70000.00, $itemMerah['unit_price']);
        $this->assertEquals(2, $itemMerah['quantity']);
        $this->assertEquals(140000.00, $itemMerah['subtotal']);

        // Verify Biru: 1 x 75000 = 75000
        $itemBiru = collect($orderData['items'])->firstWhere('variant_id', $variantBiru->id);
        $this->assertNotNull($itemBiru);
        $this->assertEquals(75000.00, $itemBiru['unit_price']);
        $this->assertEquals(1, $itemBiru['quantity']);
        $this->assertEquals(75000.00, $itemBiru['subtotal']);
    }

    /**
     * TEST B:
     * Stock = 2
     * Request quantity = 3
     * Expected: Rejected (422), stock remains 2
     */
    public function test_b_stock_overflow_rejected(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Gelang Batu Alam',
            'slug' => 'gelang-batu-alam-' . uniqid(),
            'base_price' => 45000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Hitam',
            'sku' => 'GBA-HTM',
            'price' => 45000,
            'stock' => 2,
            'is_active' => true,
        ]);

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

        $response->assertStatus(422);

        // Verify stock remains untouched
        $this->assertEquals(2, $variant->fresh()->stock);
    }

    /**
     * TEST C:
     * Stock = 2
     * Request quantity = 2
     * Expected: Success (201), stock becomes 0
     */
    public function test_c_stock_exact_deduction_to_zero(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Kalung Mutiara',
            'slug' => 'kalung-mutiara-' . uniqid(),
            'base_price' => 60000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Putih',
            'sku' => 'KLG-PTH',
            'price' => 60000,
            'stock' => 2,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        // Verify stock reduced to 0
        $this->assertEquals(0, $variant->fresh()->stock);
    }

    /**
     * TEST D:
     * Simulate failure in one item:
     * Item 1 valid (stock 5, requested 1)
     * Item 2 exceeds stock (stock 1, requested 2)
     * Expected: Full rollback, no order created, Item 1 stock unchanged
     */
    public function test_d_transaction_rollback_on_failure(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Set Manik Kristal',
            'slug' => 'set-manik-kristal-' . uniqid(),
            'base_price' => 40000,
            'is_active' => true,
        ]);

        $variant1 = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Hijau',
            'sku' => 'SMK-HJU',
            'price' => 40000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $variant2 = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Kuning',
            'sku' => 'SMK-KNG',
            'price' => 40000,
            'stock' => 1,
            'is_active' => true,
        ]);

        $initialOrderCount = Order::count();
        $initialItemCount = OrderItem::count();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant1->id,
                        'quantity' => 1,
                    ],
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant2->id,
                        'quantity' => 2, // Exceeds stock (1 available)
                    ],
                ],
            ]);

        $response->assertStatus(422);

        // Verify rollback: no new orders or order items
        $this->assertEquals($initialOrderCount, Order::count());
        $this->assertEquals($initialItemCount, OrderItem::count());

        // Verify Item 1 stock was not decremented
        $this->assertEquals(5, $variant1->fresh()->stock);
        $this->assertEquals(1, $variant2->fresh()->stock);
    }

    /**
     * TEST E:
     * Product without variant
     * Expected:
     * variant_id = null
     * variant_name = null
     * price uses product.base_price
     * order created successfully
     */
    public function test_e_product_without_variant_checkout(): void
    {
        $productNoVariant = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Benang Nilon Transparan',
            'slug' => 'benang-nilon-transparan-' . uniqid(),
            'base_price' => 15000,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $productNoVariant->id,
                        'variant_id' => null,
                        'quantity' => 3,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $orderData = $response->json('data');

        $this->assertEquals(45000.00, $orderData['subtotal']);
        $this->assertCount(1, $orderData['items']);

        $item = $orderData['items'][0];
        $this->assertEquals($productNoVariant->id, $item['product_id']);
        $this->assertNull($item['variant_id']);
        $this->assertNull($item['variant_name']);
        $this->assertEquals(15000.00, $item['unit_price']);
        $this->assertEquals(3, $item['quantity']);
        $this->assertEquals(45000.00, $item['subtotal']);
    }

    /**
     * TEST F:
     * Product with variant
     * Expected: variant_id saved, variant snapshot saved, price from variant
     */
    public function test_f_product_with_variant_snapshot_saved(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Cincin Kaca Vintage',
            'slug' => 'cincin-kaca-vintage-' . uniqid(),
            'base_price' => 25000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Emerald Green',
            'sku' => 'CKV-EMR',
            'price' => 32000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jne',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $orderData = $response->json('data');

        $item = $orderData['items'][0];
        $this->assertEquals($variant->id, $item['variant_id']);
        $this->assertEquals('Emerald Green', $item['variant_name']);
        $this->assertEquals('CKV-EMR', $item['sku']);
        $this->assertEquals(32000.00, $item['unit_price']);
        $this->assertEquals(64000.00, $item['subtotal']);
    }

    /**
     * TEST G:
     * Order Number format validation
     * Expected format: KREZOEMA-YYYYMMDD-XXXX
     */
    public function test_g_order_number_format_and_uniqueness(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Bros Bunga Kaca',
            'slug' => 'bros-bunga-kaca-' . uniqid(),
            'base_price' => 50000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Standar',
            'sku' => 'BBK-STD',
            'price' => 50000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
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

        $response->assertStatus(201);
        $orderNumber = $response->json('data.order_number');

        // Pattern regex: KREZOEMA-\d{8}-[A-Z0-9]{4}
        $this->assertMatchesRegularExpression('/^KREZOEMA-\d{8}-[A-Z0-9]{4}$/', $orderNumber);
    }

    /**
     * TEST H:
     * Admin Order API:
     * - List orders: GET /api/ecommerce/admin/orders
     * - Show order: GET /api/ecommerce/admin/orders/{id}
     * - Update status: PUT /api/ecommerce/admin/orders/{id}
     * - Stock restoration on cancellation
     */
    public function test_h_admin_order_management_api(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Gelang Etnik',
            'slug' => 'gelang-etnik-' . uniqid(),
            'base_price' => 50000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Cokelat Kayu',
            'sku' => 'GE-CKL',
            'price' => 50000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // Customer creates order (stock decreases 10 -> 8)
        $orderResponse = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $orderResponse->assertStatus(201);
        $orderId = $orderResponse->json('data.id');
        $this->assertEquals(8, $variant->fresh()->stock);

        // Admin lists orders
        $this->app['auth']->forgetGuards();
        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/ecommerce/admin/orders');

        $listResponse->assertStatus(200);
        $listData = $listResponse->json('data');
        $this->assertNotEmpty($listData);

        // Admin views order detail
        $showResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/ecommerce/admin/orders/{$orderId}");

        $showResponse->assertStatus(200);
        $this->assertEquals($orderId, $showResponse->json('data.id'));
        $this->assertEquals('pending', $showResponse->json('data.status'));

        // Admin updates status to 'processing'
        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$orderId}", [
                'status' => 'processing',
                'notes' => 'Sedang dipersiapkan',
            ]);

        $updateResponse->assertStatus(200);
        $this->assertEquals('processing', $updateResponse->json('data.status'));

        // Admin cancels order -> Stock must be restored from 8 back to 10
        $cancelResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$orderId}", [
                'status' => 'cancelled',
            ]);

        $cancelResponse->assertStatus(200);
        $this->assertEquals('cancelled', $cancelResponse->json('data.status'));
        $this->assertEquals(10, $variant->fresh()->stock);
    }

    /**
     * TEST I:
     * Full E2E Lifecycle:
     * Product -> Variant -> Cart -> Checkout -> POST Order API ->
     * DB Order & Items -> Stock Deduction -> Admin List -> Admin Detail -> Update Status (Confirmed -> Shipped -> Completed)
     */
    public function test_i_complete_e2e_lifecycle(): void
    {
        // 1. Product & Variant setup
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Gantungan Kunci Manik Daisy',
            'slug' => 'gantungan-kunci-manik-daisy-' . uniqid(),
            'base_price' => 20000,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Daisy Kuning',
            'sku' => 'GKMD-KNG',
            'price' => 22000,
            'stock' => 15,
            'is_active' => true,
        ]);

        // 2. Customer executes checkout
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'notes' => 'Tolong bungkus rapi untuk kado',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'quantity' => 3,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $createdOrder = $response->json('data');
        $orderId = $createdOrder['id'];
        $orderNumber = $createdOrder['order_number'];

        // 3. Verify Database snapshot and stock
        $this->assertDatabaseHas('ecommerce_orders', [
            'id' => $orderId,
            'order_number' => $orderNumber,
            'status' => 'pending',
            'subtotal' => 66000.00,
            'total' => 66000.00,
        ]);

        $this->assertDatabaseHas('ecommerce_order_items', [
            'order_id' => $orderId,
            'product_name' => 'Gantungan Kunci Manik Daisy',
            'variant_name' => 'Daisy Kuning',
            'sku' => 'GKMD-KNG',
            'unit_price' => 22000.00,
            'quantity' => 3,
            'subtotal' => 66000.00,
        ]);

        $this->assertEquals(12, $variant->fresh()->stock); // 15 - 3 = 12

        // 4. Admin reads order in list
        $this->app['auth']->forgetGuards();
        $adminList = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/ecommerce/admin/orders?search=' . urlencode($orderNumber));
        $adminList->assertStatus(200);
        $this->assertEquals($orderNumber, $adminList->json('data.0.order_number'));

        // 5. Admin updates status to 'confirmed'
        $confirmRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$orderId}", [
                'status' => 'confirmed',
            ]);
        $confirmRes->assertStatus(200);
        $this->assertEquals('confirmed', $confirmRes->json('data.status'));

        // 6. Admin updates status to 'shipped'
        $shippedRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$orderId}", [
                'status' => 'shipped',
            ]);
        $shippedRes->assertStatus(200);
        $this->assertEquals('shipped', $shippedRes->json('data.status'));

        // 7. Admin updates status to 'completed'
        $completedRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$orderId}", [
                'status' => 'completed',
            ]);
        $completedRes->assertStatus(200);
        $this->assertEquals('completed', $completedRes->json('data.status'));

        // 8. Customer checks order status in history
        $this->app['auth']->forgetGuards();
        $custHistory = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson("/api/ecommerce/orders/{$orderId}");
        $custHistory->assertStatus(200);
        $this->assertEquals('completed', $custHistory->json('data.status'));
    }
}
