<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EcommerceAdminProductTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected string $token;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'status' => 1,
        ]);
        $this->token = $this->admin->createToken('admin-test-token')->plainTextToken;

        $this->category = Category::factory()->create([
            'name' => 'manik manik',
            'is_active' => true,
        ]);
    }

    protected function authHeader(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test admin can create a product with base_price = 2000 (scenario from user bug report).
     */
    public function test_admin_can_create_product_with_base_price(): void
    {
        $payload = [
            'name' => 'manik manik warna warni',
            'category_id' => $this->category->id,
            'material' => 'kaca',
            'base_price' => 2000,
            'description' => 'apalah',
            'is_active' => true,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'manik manik warna warni')
            ->assertJsonPath('data.base_price', 2000)
            ->assertJsonPath('data.material', 'kaca')
            ->assertJsonPath('data.description', 'apalah');

        $this->assertDatabaseHas('ecommerce_products', [
            'name' => 'manik manik warna warni',
            'base_price' => 2000,
            'category_id' => $this->category->id,
        ]);
    }

    /**
     * Test admin creating products with various price tiers.
     */
    public function test_admin_can_create_product_with_various_prices(): void
    {
        $prices = [500, 2000, 10000, 25500, 100000, 1250000];

        foreach ($prices as $price) {
            $payload = [
                'name' => "Produk Harga {$price}",
                'category_id' => $this->category->id,
                'material' => 'batu alam',
                'base_price' => $price,
                'description' => "Deskripsi untuk produk seharga {$price}",
                'is_active' => true,
            ];

            $response = $this->withHeaders($this->authHeader())
                ->postJson('/api/ecommerce/admin/products', $payload);

            $response->assertStatus(201)
                ->assertJsonPath('data.base_price', $price);

            $this->assertDatabaseHas('ecommerce_products', [
                'name' => "Produk Harga {$price}",
                'base_price' => $price,
            ]);
        }
    }

    /**
     * Test admin can update product base_price from 2000 to 5000.
     */
    public function test_admin_can_update_product_base_price(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Awal',
            'category_id' => $this->category->id,
            'base_price' => 2000,
            'is_active' => true,
        ]);

        $updatePayload = [
            'base_price' => 5000,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/products/{$product->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('data.base_price', 5000);

        $this->assertDatabaseHas('ecommerce_products', [
            'id' => $product->id,
            'base_price' => 5000,
        ]);
    }

    /**
     * Test product creation fails when base_price is missing.
     */
    public function test_product_creation_fails_when_base_price_missing(): void
    {
        $payload = [
            'name' => 'Produk Tanpa Harga',
            'category_id' => $this->category->id,
            'material' => 'kaca',
            'description' => 'tanpa harga dasar',
            'is_active' => true,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['base_price']);
    }

    /**
     * Test product creation fails when base_price is negative.
     */
    public function test_product_creation_fails_when_base_price_negative(): void
    {
        $payload = [
            'name' => 'Produk Harga Negatif',
            'category_id' => $this->category->id,
            'base_price' => -500,
            'is_active' => true,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['base_price']);
    }

    /**
     * Test admin can delete product.
     */
    public function test_admin_can_delete_product(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Hapus',
            'category_id' => $this->category->id,
            'base_price' => 2000,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/ecommerce/admin/products/{$product->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('ecommerce_products', [
            'id' => $product->id,
        ]);
    }
}
