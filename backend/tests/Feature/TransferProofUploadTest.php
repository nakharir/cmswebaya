<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TransferProofUploadTest extends TestCase
{
    use DatabaseTransactions;

    protected User $customer;
    protected string $customerToken;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->customer = User::factory()->create();
        $this->customerToken = $this->customer->createToken('test-token')->plainTextToken;

        $category = Category::factory()->create(['is_active' => true]);
        $product  = Product::factory()->create(['category_id' => $category->id, 'is_active' => true]);
        $variant  = ProductVariant::factory()->create(['product_id' => $product->id, 'is_active' => true, 'stock' => 10]);

        $address = CustomerAddress::factory()->create(['user_id' => $this->customer->id]);

        $this->order = Order::factory()->create([
            'customer_id'    => $this->customer->id,
            'payment_status' => Order::PAYMENT_STATUS_UNPAID,
            'status'         => 'pending',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Happy Path
    // ─────────────────────────────────────────────────────────────────────

    public function test_customer_can_upload_proof_when_unpaid(): void
    {
        $file = UploadedFile::fake()->image('bukti.jpg', 800, 600)->size(500);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.payment_status', 'waiting_verification')
            ->assertJsonStructure(['data' => ['transfer_proof_url']]);

        $this->assertNotNull($response->json('data.transfer_proof_url'));

        // DB should store path and status
        $this->assertDatabaseHas('ecommerce_orders', [
            'id'             => $this->order->id,
            'payment_status' => 'waiting_verification',
        ]);

        // File should exist on storage
        $this->order->refresh();
        Storage::disk('public')->assertExists($this->order->transfer_proof);
    }

    public function test_customer_can_upload_proof_when_rejected(): void
    {
        $this->order->update(['payment_status' => Order::PAYMENT_STATUS_REJECTED]);

        $file = UploadedFile::fake()->image('bukti.png')->size(300);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.payment_status', 'waiting_verification');
    }

    public function test_order_status_remains_unchanged_after_proof_upload(): void
    {
        $file = UploadedFile::fake()->image('bukti.jpg')->size(200);

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('ecommerce_orders', [
            'id'     => $this->order->id,
            'status' => 'pending', // order status must NOT change
        ]);
    }

    public function test_reupload_replaces_old_file(): void
    {
        // First upload
        $file1 = UploadedFile::fake()->image('first.jpg')->size(100);
        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file1,
            ])
            ->assertStatus(200);

        $this->order->refresh();
        $firstPath = $this->order->transfer_proof;

        // Second upload — set back to rejected to allow re-upload
        $this->order->update(['payment_status' => Order::PAYMENT_STATUS_REJECTED]);

        $file2 = UploadedFile::fake()->image('second.jpg')->size(200);
        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file2,
            ])
            ->assertStatus(200);

        // Old file should be gone
        Storage::disk('public')->assertMissing($firstPath);

        $this->order->refresh();
        Storage::disk('public')->assertExists($this->order->transfer_proof);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Authorization
    // ─────────────────────────────────────────────────────────────────────

    public function test_guest_cannot_upload_proof(): void
    {
        $file = UploadedFile::fake()->image('bukti.jpg')->size(100);

        $this->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
            'transfer_proof' => $file,
        ])->assertStatus(401);
    }

    public function test_other_customer_cannot_upload_proof(): void
    {
        $other = User::factory()->create();
        $otherToken = $other->createToken('other')->plainTextToken;

        $file = UploadedFile::fake()->image('bukti.jpg')->size(100);

        $this->withHeader('Authorization', 'Bearer ' . $otherToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Business Rules
    // ─────────────────────────────────────────────────────────────────────

    public function test_upload_blocked_when_payment_is_paid(): void
    {
        $this->order->update(['payment_status' => Order::PAYMENT_STATUS_PAID]);

        $file = UploadedFile::fake()->image('bukti.jpg')->size(100);

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(422);
    }

    public function test_upload_returns_404_for_missing_order(): void
    {
        $file = UploadedFile::fake()->image('bukti.jpg')->size(100);

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson('/api/ecommerce/orders/999999/upload-proof', [
                'transfer_proof' => $file,
            ])
            ->assertStatus(404);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Validation
    // ─────────────────────────────────────────────────────────────────────

    public function test_upload_rejected_without_file(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transfer_proof']);
    }

    public function test_upload_rejected_for_invalid_format(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transfer_proof']);
    }

    public function test_upload_rejected_when_file_too_large(): void
    {
        // 3 MB — over the 2 MB limit
        $file = UploadedFile::fake()->image('large.jpg')->size(3072);

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transfer_proof']);
    }

    public function test_png_format_is_accepted(): void
    {
        $file = UploadedFile::fake()->image('bukti.png')->size(400);

        $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ])
            ->assertStatus(200);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. Response Structure
    // ─────────────────────────────────────────────────────────────────────

    public function test_upload_response_includes_transfer_proof_url(): void
    {
        $file = UploadedFile::fake()->image('bukti.jpg')->size(200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->customerToken)
            ->postJson("/api/ecommerce/orders/{$this->order->id}/upload-proof", [
                'transfer_proof' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'payment_status',
                    'transfer_proof_url',
                ],
            ]);

        $url = $response->json('data.transfer_proof_url');
        $this->assertNotNull($url);
        $this->assertStringContainsString('transfer_proofs', $url);
    }
}
