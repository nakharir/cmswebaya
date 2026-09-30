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

class ManualTransferPaymentStatusTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected User $admin;
    protected string $customerToken;
    protected string $adminToken;
    protected CustomerAddress $address;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Budi Pembeli',
            'email' => 'budi.pembeli.' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0, // Customer
        ]);
        $this->customerToken = $this->customer->createToken('test-customer-token')->plainTextToken;

        $this->admin = User::create([
            'name' => 'Admin Keuangan',
            'email' => 'admin.keuangan.' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 1, // Admin
        ]);
        $this->adminToken = $this->admin->createToken('test-admin-token')->plainTextToken;

        $this->address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'recipient_name' => 'Budi Pembeli',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Mawar No. 12',
            'district' => 'Klojen',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65111',
            'is_default' => true,
        ]);

        $category = Category::create([
            'name' => 'Gelang Handmade',
            'slug' => 'gelang-handmade-' . uniqid(),
            'sort_order' => 1,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Gelang Daisy Manual',
            'slug' => 'gelang-daisy-manual-' . uniqid(),
            'base_price' => 50000,
            'stock' => 100,
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'sku' => 'GDM-01',
            'name' => 'Ukuran S',
            'options' => ['ukuran' => 'S'],
            'price' => 50000,
            'stock' => 50,
            'is_active' => true,
        ]);
    }

    /**
     * Test 1: New order defaults to payment_status = unpaid, payment_method = manual_transfer.
     * Even if client sends malicious payment_status, backend remains single source of truth.
     */
    public function test_new_order_defaults_to_unpaid_payment_status(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders', [
                'address_id' => $this->address->id,
                'shipping_method' => 'jnt',
                'payment_status' => 'paid', // Malicious attempt to mark paid
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $orderData = $response->json('data');

        $this->assertEquals('pending', $orderData['status']);
        $this->assertEquals('unpaid', $orderData['payment_status']);
        $this->assertEquals('manual_transfer', $orderData['payment_method']);

        // Verify in DB
        $order = Order::find($orderData['id']);
        $this->assertEquals(Order::PAYMENT_STATUS_UNPAID, $order->payment_status);
        $this->assertEquals('manual_transfer', $order->payment_method);
        $this->assertEquals('pending', $order->status);
    }

    /**
     * Test 2: Order Resource exposes payment_status and payment_method on single order and list.
     */
    public function test_order_resource_exposes_payment_fields(): void
    {
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-TEST-0001',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'manual_transfer',
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

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson("/api/ecommerce/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.payment_method', 'manual_transfer');
    }

    /**
     * Test 3: Admin can update order payment_status through all valid statuses.
     */
    public function test_admin_can_update_payment_status(): void
    {
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-TEST-0002',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'manual_transfer',
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

        // Step 1: Update to waiting_verification
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'payment_status' => 'waiting_verification',
            ]);
        $res1->assertStatus(200);
        $this->assertEquals('waiting_verification', $res1->json('data.payment_status'));
        $this->assertEquals('pending', $res1->json('data.status')); // Order status unchanged

        // Step 2: Update to paid
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]);
        $res2->assertStatus(200);
        $this->assertEquals('paid', $res2->json('data.payment_status'));
        $this->assertEquals('confirmed', $res2->json('data.status'));

        // Step 3: Update to rejected
        $res3 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'payment_status' => 'rejected',
            ]);
        $res3->assertStatus(200);
        $this->assertEquals('rejected', $res3->json('data.payment_status'));
    }

    /**
     * Test 4: Admin update rejects invalid payment status.
     */
    public function test_admin_update_rejects_invalid_payment_status(): void
    {
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-TEST-0003',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'manual_transfer',
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

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$order->id}", [
                'payment_status' => 'invalid_status_xyz',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_status']);
    }

    /**
     * Test 5: Admin can filter orders by payment_status.
     */
    public function test_admin_can_filter_orders_by_payment_status(): void
    {
        // Order 1: unpaid
        Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-UNPAID-' . uniqid(),
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'manual_transfer',
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

        // Order 2: paid
        Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-PAID-' . uniqid(),
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'payment_method' => 'manual_transfer',
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

        $responsePaid = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/ecommerce/admin/orders?payment_status=paid');

        $responsePaid->assertStatus(200);
        foreach ($responsePaid->json('data') as $orderItem) {
            $this->assertEquals('paid', $orderItem['payment_status']);
        }
    }

    /**
     * Test 6: Customer can confirm manual transfer payment transitioning unpaid to waiting_verification without changing order status.
     */
    public function test_customer_can_confirm_payment_transitioning_to_waiting_verification(): void
    {
        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-CONFIRM-' . uniqid(),
            'status' => 'pending',
            'payment_status' => Order::PAYMENT_STATUS_UNPAID,
            'payment_method' => 'manual_transfer',
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

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$order->id}/confirm-payment");

        $response->assertStatus(200);
        $this->assertEquals(Order::PAYMENT_STATUS_WAITING_VERIFICATION, $response->json('data.payment_status'));
        $this->assertEquals('pending', $response->json('data.status')); // Order status untouched!
        $this->assertNotEmpty($response->json('data.payment_details.bank_name'));
        $this->assertNotEmpty($response->json('data.payment_details.account_number'));
        $this->assertNotEmpty($response->json('data.payment_details.account_holder'));
        $this->assertNotEmpty($response->json('data.payment_details.expires_at'));

        // Verify database
        $order->refresh();
        $this->assertEquals(Order::PAYMENT_STATUS_WAITING_VERIFICATION, $order->payment_status);
        $this->assertEquals('pending', $order->status);
    }

    /**
     * Test 7: Another customer cannot confirm someone else's order.
     */
    public function test_customer_cannot_confirm_another_users_order(): void
    {
        $otherCustomer = User::create([
            'name' => 'Other Customer',
            'email' => 'other.' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0,
        ]);
        $otherToken = $otherCustomer->createToken('other-token')->plainTextToken;

        $order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-OTHER-' . uniqid(),
            'status' => 'pending',
            'payment_status' => Order::PAYMENT_STATUS_UNPAID,
            'payment_method' => 'manual_transfer',
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

        $response = $this->withHeader('Authorization', 'Bearer ' . $otherToken)
            ->postJson("/api/ecommerce/orders/{$order->id}/confirm-payment");

        $response->assertStatus(403);
    }

    private function makeOrder(string $paymentStatus = 'unpaid'): Order
    {
        return Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-PROOF-' . uniqid(),
            'status' => 'pending',
            'payment_status' => $paymentStatus,
            'payment_method' => 'manual_transfer',
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
    }

    /**
     * Test 8: Customer can upload transfer proof on unpaid order — auto-transitions to waiting_verification.
     */
    public function test_customer_can_upload_transfer_proof_on_unpaid_order(): void
    {
        $order = $this->makeOrder('unpaid');

        $file = \Illuminate\Http\UploadedFile::fake()->image('bukti.jpg', 200, 200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->post("/api/ecommerce/orders/{$order->id}/upload-proof", [
                'transfer_proof' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200);
        $this->assertEquals(Order::PAYMENT_STATUS_WAITING_VERIFICATION, $response->json('data.payment_status'));
        $this->assertEquals('pending', $response->json('data.status')); // Order status untouched
        $this->assertNotNull($response->json('data.transfer_proof_url'));

        $order->refresh();
        $this->assertEquals(Order::PAYMENT_STATUS_WAITING_VERIFICATION, $order->payment_status);
        $this->assertNotNull($order->transfer_proof);
    }

    /**
     * Test 9: Customer can re-upload proof when status is rejected.
     */
    public function test_customer_can_upload_proof_when_rejected(): void
    {
        $order = $this->makeOrder('rejected');

        $file = \Illuminate\Http\UploadedFile::fake()->image('bukti_ulang.png', 200, 200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->post("/api/ecommerce/orders/{$order->id}/upload-proof", [
                'transfer_proof' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200);
        $this->assertEquals(Order::PAYMENT_STATUS_WAITING_VERIFICATION, $response->json('data.payment_status'));
    }

    /**
     * Test 10: Customer cannot upload proof when payment is already paid.
     */
    public function test_customer_cannot_upload_proof_when_already_paid(): void
    {
        $order = $this->makeOrder('paid');

        $file = \Illuminate\Http\UploadedFile::fake()->image('attempt.jpg', 200, 200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->post("/api/ecommerce/orders/{$order->id}/upload-proof", [
                'transfer_proof' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422);
    }

    /**
     * Test 11: Upload fails when file type is not allowed.
     */
    public function test_upload_proof_rejects_invalid_file_type(): void
    {
        $order = $this->makeOrder('unpaid');

        $file = \Illuminate\Http\UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->post("/api/ecommerce/orders/{$order->id}/upload-proof", [
                'transfer_proof' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422);
    }

    /**
     * Test 12: Another customer cannot upload proof to someone else's order.
     */
    public function test_customer_cannot_upload_proof_to_another_users_order(): void
    {
        $otherCustomer = User::create([
            'name' => 'Stranger',
            'email' => 'stranger.' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0,
        ]);
        $otherToken = $otherCustomer->createToken('stranger-token')->plainTextToken;

        $order = $this->makeOrder('unpaid');

        $file = \Illuminate\Http\UploadedFile::fake()->image('hack.jpg', 200, 200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $otherToken)
            ->post("/api/ecommerce/orders/{$order->id}/upload-proof", [
                'transfer_proof' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(403);
    }
}
