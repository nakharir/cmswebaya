<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EcommerceOrderTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected string $customerToken;
    protected CustomerAddress $customerAddress;
    protected Category $category;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup authenticated customer with an address
        $this->customer = User::factory()->create();
        $this->customerToken = $this->customer->createToken('test-token')->plainTextToken;

        $this->customerAddress = CustomerAddress::factory()->create([
            'user_id' => $this->customer->id,
            'recipient_name' => 'Budi Santoso',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Merdeka No. 45',
            'district' => 'Klojen',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65119',
            'is_default' => true,
        ]);

        // Setup active category, product, and variant
        $this->category = Category::factory()->create([
            'is_active' => true,
        ]);

        $this->product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Gelang Manik Kaca',
            'base_price' => 30000,
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'name' => 'Warna Biru Laut',
            'sku' => 'GLG-BLU-01',
            'price' => 35000,
            'stock' => 20,
            'is_active' => true,
        ]);
    }

    /**
     * 1. Authentication Tests
     */
    public function test_guest_cannot_create_order(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(401);
    }

    public function test_authenticated_customer_can_create_order(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'notes' => 'Tolong bubble wrap tebal',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'shipping_method',
                    'shipping_name',
                    'shipping_whatsapp',
                    'shipping_address',
                    'shipping_kecamatan',
                    'shipping_city',
                    'shipping_province',
                    'shipping_postal_code',
                    'shipping_address_snapshot',
                    'notes',
                    'subtotal',
                    'shipping_cost',
                    'total',
                    'items' => [
                        '*' => [
                            'id',
                            'order_id',
                            'product_id',
                            'variant_id',
                            'product_name',
                            'variant_name',
                            'sku',
                            'unit_price',
                            'quantity',
                            'subtotal',
                        ],
                    ],
                    'created_at',
                ],
            ]);

        $this->assertDatabaseHas('ecommerce_orders', [
            'customer_id' => $this->customer->id,
            'shipping_method' => 'jnt',
            'status' => 'pending',
            'subtotal' => 70000,
            'shipping_cost' => 0,
            'total' => 70000,
        ]);

        $this->assertDatabaseHas('ecommerce_order_items', [
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'product_name' => 'Gelang Manik Kaca',
            'variant_name' => 'Warna Biru Laut',
            'unit_price' => 35000,
            'quantity' => 2,
            'subtotal' => 70000,
        ]);
    }

    /**
     * 2. Address Tests
     */
    public function test_customer_cannot_use_another_customers_address(): void
    {
        $otherCustomer = User::factory()->create();
        $otherAddress = CustomerAddress::factory()->create([
            'user_id' => $otherCustomer->id,
        ]);

        $payload = [
            'address_id' => $otherAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(403);
    }

    public function test_order_rejected_when_address_not_found(): void
    {
        $payload = [
            'address_id' => 999999,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(404);
    }

    /**
     * 3. Product Tests
     */
    public function test_order_rejected_when_product_not_found(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => 888888,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(404);
    }

    public function test_order_rejected_when_product_is_inactive(): void
    {
        $this->product->update(['is_active' => false]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422);
    }

    /**
     * 4. Variant Tests
     */
    public function test_order_rejected_when_variant_not_found(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => 777777,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(404);
    }

    public function test_order_rejected_when_variant_is_inactive(): void
    {
        $this->variant->update(['is_active' => false]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422);
    }

    public function test_order_rejected_when_variant_belongs_to_another_product(): void
    {
        $otherProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'is_active' => true,
        ]);
        $otherVariant = ProductVariant::factory()->create([
            'product_id' => $otherProduct->id,
            'is_active' => true,
        ]);

        // Attempt to order this->product with otherVariant
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $otherVariant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422);
    }

    /**
     * 5. Quantity Tests
     */
    public function test_quantity_one_succeeds(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jne',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);
    }

    public function test_order_rejected_when_quantity_is_zero(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 0,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    public function test_order_rejected_when_quantity_is_negative(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => -5,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    public function test_order_rejected_when_quantity_is_not_integer(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 'two',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    /**
     * 6. Stock Tests
     */
    public function test_stock_is_decremented_on_successful_order(): void
    {
        $initialStock = $this->variant->stock;

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 4,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);

        $this->variant->refresh();
        $this->assertEquals($initialStock - 4, $this->variant->stock);
    }

    public function test_order_rejected_when_stock_is_insufficient(): void
    {
        $this->variant->update(['stock' => 3]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 5,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422);

        // Stock must not change
        $this->variant->refresh();
        $this->assertEquals(3, $this->variant->stock);
    }

    /**
     * 7. Price Integrity (Backend is Source of Truth)
     */
    public function test_frontend_cannot_manipulate_price_or_subtotal(): void
    {
        $this->variant->update(['price' => 35000, 'stock' => 10]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 2,
                    'price' => 1, // Tampered price
                    'subtotal' => 2, // Tampered subtotal
                ],
            ],
            'subtotal' => 2,
            'total' => 2,
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);

        $orderData = $response->json('data');
        $this->assertEquals(70000, $orderData['subtotal']);
        $this->assertEquals(70000, $orderData['total']);
        $this->assertEquals(35000, $orderData['items'][0]['unit_price']);
        $this->assertEquals(70000, $orderData['items'][0]['subtotal']);

        $this->assertDatabaseHas('ecommerce_orders', [
            'id' => $orderData['id'],
            'subtotal' => 70000,
            'total' => 70000,
        ]);
    }

    /**
     * 8. Order Calculation & Price Fallback
     */
    public function test_variant_with_null_price_falls_back_to_product_base_price(): void
    {
        $this->product->update(['base_price' => 28000]);
        $this->variant->update(['price' => null, 'stock' => 10]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 3,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);

        $orderData = $response->json('data');
        $this->assertEquals(28000, $orderData['items'][0]['unit_price']);
        $this->assertEquals(84000, $orderData['subtotal']);
        $this->assertEquals(0, $orderData['shipping_cost']);
        $this->assertEquals(84000, $orderData['total']);
    }

    public function test_multiple_items_calculation(): void
    {
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'name' => 'Warna Merah Delima',
            'sku' => 'GLG-RED-02',
            'price' => 40000,
            'stock' => 15,
            'is_active' => true,
        ]);

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jne',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id, // price 35000
                    'quantity' => 2, // subtotal = 70000
                ],
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $variant2->id, // price 40000
                    'quantity' => 3, // subtotal = 120000
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);

        $orderData = $response->json('data');
        $this->assertEquals(190000, $orderData['subtotal']);
        $this->assertEquals(0, $orderData['shipping_cost']);
        $this->assertEquals(190000, $orderData['total']);
        $this->assertCount(2, $orderData['items']);
    }

    /**
     * 9. Historical Snapshot Immutability
     */
    public function test_order_data_is_immutable_against_future_changes(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(201);
        $orderId = $response->json('data.id');

        // Modify product, variant, and address afterwards
        $this->product->update(['name' => 'Nama Produk Berubah Total']);
        $this->variant->update(['name' => 'Varian Berubah', 'price' => 999999]);
        $this->customerAddress->update([
            'recipient_name' => 'Nama Penerima Baru',
            'address' => 'Jl. Pindah Rumah No. 999',
            'city' => 'Jakarta Selatan',
        ]);

        // Verify order snapshot remains untouched
        $showResponse = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson("/api/ecommerce/orders/{$orderId}");

        $showResponse->assertStatus(200)
            ->assertJson([
                'data' => [
                    'shipping_name' => 'Budi Santoso',
                    'shipping_address' => 'Jl. Merdeka No. 45',
                    'shipping_city' => 'Kota Malang',
                    'items' => [
                        [
                            'product_name' => 'Gelang Manik Kaca',
                            'variant_name' => 'Warna Biru Laut',
                            'unit_price' => 35000,
                        ],
                    ],
                ],
            ]);
    }

    /**
     * 10. Customer Isolation Tests
     */
    public function test_customer_cannot_view_another_customers_order(): void
    {
        $otherCustomer = User::factory()->create();
        $otherToken = $otherCustomer->createToken('other-token')->plainTextToken;

        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
        ]);

        // Other customer tries to view Customer A's order
        $viewResponse = $this->withHeader('Authorization', 'Bearer ' . $otherToken)
            ->getJson("/api/ecommerce/orders/{$order->id}");

        $viewResponse->assertStatus(403);
    }

    public function test_customer_order_listing_only_shows_own_orders(): void
    {
        $otherCustomer = User::factory()->create();
        $otherAddress = CustomerAddress::factory()->create(['user_id' => $otherCustomer->id]);

        // Customer A creates 2 orders
        Order::factory()->count(2)->create([
            'customer_id' => $this->customer->id,
        ]);

        // Customer B creates 3 orders
        Order::factory()->count(3)->create([
            'customer_id' => $otherCustomer->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson('/api/ecommerce/orders');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));

        foreach ($response->json('data') as $order) {
            $this->assertEquals($this->customer->id, $order['customer_id']);
        }
    }

    /**
     * 11. Transaction Rollback on Mid-Process Failure
     */
    public function test_transaction_rolls_back_completely_if_any_item_fails(): void
    {
        $initialStock1 = $this->variant->stock; // 20

        // Create second variant with stock 1
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'stock' => 1,
            'is_active' => true,
        ]);

        $ordersCountBefore = Order::count();

        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 2, // Valid
                ],
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $variant2->id,
                    'quantity' => 5, // Exceeds stock (1)!
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422);

        // Check that no new order was created
        $this->assertEquals($ordersCountBefore, Order::count());

        // Check that item 1 stock was NOT decremented (rolled back)
        $this->variant->refresh();
        $this->assertEquals($initialStock1, $this->variant->stock);

        // Check variant 2 stock remained intact
        $variant2->refresh();
        $this->assertEquals(1, $variant2->stock);
    }

    /**
     * 12. Mock / Null Product ID Rejection
     */
    public function test_order_with_null_product_id_is_rejected(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'jnt',
            'items' => [
                [
                    'product_id' => null,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.product_id']);
    }

    /**
     * 13. Shipping Method Validation
     */
    public function test_invalid_shipping_method_is_rejected(): void
    {
        $payload = [
            'address_id' => $this->customerAddress->id,
            'shipping_method' => 'sicepat',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $this->variant->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['shipping_method']);
    }
}
