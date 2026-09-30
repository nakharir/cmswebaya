<?php

namespace Tests\Feature;

use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminOrderAuthorizationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected string $customerToken;
    protected User $adminUser;
    protected string $adminToken;
    protected User $operatorUser2;
    protected string $operatorToken2;
    protected User $operatorUser3;
    protected string $operatorToken3;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Customer (status = 0)
        $this->customer = User::create([
            'name' => 'Regular Customer',
            'email' => 'customer_auth_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 0,
        ]);
        $this->customerToken = $this->customer->createToken('customer-token')->plainTextToken;

        // 2. SuperAdmin / Admin (status = 1)
        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin_auth_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 1,
        ]);
        $this->adminToken = $this->adminUser->createToken('admin-token')->plainTextToken;

        // 3. Operator / Admin Approval (status = 2)
        $this->operatorUser2 = User::create([
            'name' => 'Operator User 2',
            'email' => 'operator2_auth_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 2,
        ]);
        $this->operatorToken2 = $this->operatorUser2->createToken('operator2-token')->plainTextToken;

        // 4. Operator / Visitor (status = 3)
        $this->operatorUser3 = User::create([
            'name' => 'Operator User 3',
            'email' => 'operator3_auth_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'status' => 3,
        ]);
        $this->operatorToken3 = $this->operatorUser3->createToken('operator3-token')->plainTextToken;

        // Create sample order
        $this->order = Order::create([
            'customer_id' => $this->customer->id,
            'order_number' => 'KREZOEMA-20260929-TEST',
            'status' => 'pending',
            'shipping_method' => 'jnt',
            'shipping_name' => 'Test Recipient',
            'shipping_whatsapp' => '081234567890',
            'shipping_address' => 'Jl. Test No. 1',
            'shipping_kecamatan' => 'Klojen',
            'shipping_city' => 'Malang',
            'shipping_province' => 'Jawa Timur',
            'shipping_postal_code' => '65111',
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
        ]);
    }

    /**
     * Customer (status = 0) must receive 403 Forbidden for all admin order endpoints.
     */
    public function test_customer_receives_403_on_admin_orders(): void
    {
        // 1. GET /api/ecommerce/admin/orders
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(403);

        // 2. GET /api/ecommerce/admin/orders/{id}
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->getJson("/api/ecommerce/admin/orders/{$this->order->id}");
        $showRes->assertStatus(403);

        // 3. PUT /api/ecommerce/admin/orders/{id}
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->putJson("/api/ecommerce/admin/orders/{$this->order->id}", [
                'status' => 'confirmed',
            ]);
        $updateRes->assertStatus(403);
    }

    /**
     * Admin (status = 1) can access all admin order endpoints.
     */
    public function test_admin_status_1_can_access_admin_orders(): void
    {
        // 1. GET /api/ecommerce/admin/orders
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(200);

        // 2. GET /api/ecommerce/admin/orders/{id}
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/ecommerce/admin/orders/{$this->order->id}");
        $showRes->assertStatus(200);

        // 3. PUT /api/ecommerce/admin/orders/{id}
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/ecommerce/admin/orders/{$this->order->id}", [
                'status' => 'confirmed',
            ]);
        $updateRes->assertStatus(200);
    }

    /**
     * Operator (status = 2) can access all admin order endpoints.
     */
    public function test_operator_status_2_can_access_admin_orders(): void
    {
        // 1. GET /api/ecommerce/admin/orders
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken2)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(200);

        // 2. GET /api/ecommerce/admin/orders/{id}
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken2)
            ->getJson("/api/ecommerce/admin/orders/{$this->order->id}");
        $showRes->assertStatus(200);

        // 3. PUT /api/ecommerce/admin/orders/{id}
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken2)
            ->putJson("/api/ecommerce/admin/orders/{$this->order->id}", [
                'status' => 'processing',
            ]);
        $updateRes->assertStatus(200);
    }

    /**
     * Operator (status = 3) can access all admin order endpoints.
     */
    public function test_operator_status_3_can_access_admin_orders(): void
    {
        // 1. GET /api/ecommerce/admin/orders
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken3)
            ->getJson('/api/ecommerce/admin/orders');
        $listRes->assertStatus(200);

        // 2. GET /api/ecommerce/admin/orders/{id}
        $showRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken3)
            ->getJson("/api/ecommerce/admin/orders/{$this->order->id}");
        $showRes->assertStatus(200);

        // 3. PUT /api/ecommerce/admin/orders/{id}
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->operatorToken3)
            ->putJson("/api/ecommerce/admin/orders/{$this->order->id}", [
                'status' => 'shipped',
            ]);
        $updateRes->assertStatus(200);
    }
}
