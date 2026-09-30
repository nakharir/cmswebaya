<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EcommerceAdminCategoryTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'status' => 1, // Admin status
        ]);
        $this->token = $this->admin->createToken('admin-test-token')->plainTextToken;
    }

    protected function authHeader(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/json',
        ];
    }

    /**
     * 1. Admin dapat melihat kategori.
     */
    public function test_admin_can_view_categories_list(): void
    {
        $cat = Category::factory()->create([
            'name' => 'Kategori Uji Lihat ' . uniqid(),
            'slug' => 'kategori-uji-lihat-' . uniqid(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/ecommerce/admin/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'description',
                        'is_active',
                        'sort_order',
                        'products_count',
                    ]
                ]
            ]);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($cat->id, $ids);
    }

    /**
     * 2. Admin dapat membuat kategori.
     */
    public function test_admin_can_create_category(): void
    {
        $payload = [
            'name' => 'Manik Kaca Test',
            'description' => 'Testing kategori manik kaca artisan.',
            'is_active' => true,
            'sort_order' => 10,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'name' => 'Manik Kaca Test',
                    'slug' => 'manik-kaca-test',
                    'description' => 'Testing kategori manik kaca artisan.',
                    'is_active' => true,
                    'sort_order' => 10,
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_categories', [
            'name' => 'Manik Kaca Test',
            'slug' => 'manik-kaca-test',
            'sort_order' => 10,
        ]);
    }

    /**
     * 3. Slug dibuat dengan benar.
     */
    public function test_slug_is_safely_and_correctly_generated(): void
    {
        $payload = [
            'name' => 'Manik Kaca & Kristal Kilau',
            'description' => 'Kategori dengan karakter khusus.',
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', $payload);

        $response->assertStatus(201);
        $slug = $response->json('data.slug');
        $this->assertEquals('manik-kaca-kristal-kilau', $slug);

        $this->assertDatabaseHas('ecommerce_categories', [
            'name' => 'Manik Kaca & Kristal Kilau',
            'slug' => 'manik-kaca-kristal-kilau',
        ]);
    }

    /**
     * 4. Duplicate slug ditolak.
     */
    public function test_duplicate_slug_is_rejected(): void
    {
        $existing = Category::factory()->create([
            'name' => 'Manik Kaca Unik',
            'slug' => 'manik-kaca-unik',
        ]);

        // Attempt 1: submit with same name (generates same slug)
        $response1 = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', [
                'name' => 'Manik Kaca Unik',
            ]);

        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);

        // Attempt 2: explicit duplicate slug
        $response2 = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', [
                'name' => 'Nama Berbeda',
                'slug' => $existing->slug,
            ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    /**
     * 5. Admin dapat mengedit kategori.
     */
    public function test_admin_can_edit_category(): void
    {
        $category = Category::factory()->create([
            'name' => 'Nama Sebelum Edit',
            'slug' => 'nama-sebelum-edit-' . uniqid(),
            'description' => 'Deskripsi lama',
            'sort_order' => 5,
        ]);

        $newSlug = 'nama-sesudah-edit-' . uniqid();
        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/categories/{$category->id}", [
                'name' => 'Nama Sesudah Edit',
                'slug' => $newSlug,
                'description' => 'Deskripsi baru yang diperbarui',
                'sort_order' => 15,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $category->id,
                    'name' => 'Nama Sesudah Edit',
                    'slug' => $newSlug,
                    'description' => 'Deskripsi baru yang diperbarui',
                    'sort_order' => 15,
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_categories', [
            'id' => $category->id,
            'name' => 'Nama Sesudah Edit',
            'slug' => $newSlug,
            'sort_order' => 15,
        ]);
    }

    /**
     * 6. Admin dapat mengubah status aktif/nonaktif.
     */
    public function test_admin_can_update_category_status(): void
    {
        $category = Category::factory()->create([
            'is_active' => true,
        ]);

        // Nonaktifkan
        $responseInactive = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/categories/{$category->id}", [
                'is_active' => false,
            ]);

        $responseInactive->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $category->id,
                    'is_active' => false,
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_categories', [
            'id' => $category->id,
            'is_active' => 0,
        ]);

        // Aktifkan kembali
        $responseActive = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/categories/{$category->id}", [
                'is_active' => true,
            ]);

        $responseActive->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $category->id,
                    'is_active' => true,
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_categories', [
            'id' => $category->id,
            'is_active' => 1,
        ]);
    }

    /**
     * 7. Admin dapat menghapus kategori yang tidak digunakan.
     */
    public function test_admin_can_delete_unused_category(): void
    {
        $category = Category::factory()->create([
            'name' => 'Kategori Hapus Test ' . uniqid(),
            'slug' => 'kategori-hapus-test-' . uniqid(),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/ecommerce/admin/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Kategori berhasil dihapus',
            ]);

        $this->assertDatabaseMissing('ecommerce_categories', [
            'id' => $category->id,
        ]);
    }

    /**
     * 8. Kategori yang masih digunakan produk tidak dapat dihapus.
     */
    public function test_category_used_by_products_cannot_be_deleted(): void
    {
        $category = Category::factory()->create([
            'name' => 'Kategori Punya Produk ' . uniqid(),
            'slug' => 'kategori-punya-produk-' . uniqid(),
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Produk Terkait',
            'slug' => 'produk-terkait-' . uniqid(),
            'base_price' => 25000,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/ecommerce/admin/categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Kategori masih digunakan oleh produk dan tidak dapat dihapus.',
            ]);

        // Pastikan kategori dan produk tetap ada di database
        $this->assertDatabaseHas('ecommerce_categories', [
            'id' => $category->id,
        ]);
        $this->assertDatabaseHas('ecommerce_products', [
            'id' => $product->id,
        ]);
    }

    /**
     * 9. Unauthenticated request ditolak.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $category = Category::factory()->create();

        // GET index without auth
        $this->getJson('/api/ecommerce/admin/categories')
            ->assertStatus(401);

        // POST store without auth
        $this->postJson('/api/ecommerce/admin/categories', ['name' => 'Test'])
            ->assertStatus(401);

        // GET show without auth
        $this->getJson("/api/ecommerce/admin/categories/{$category->id}")
            ->assertStatus(401);

        // PUT update without auth
        $this->putJson("/api/ecommerce/admin/categories/{$category->id}", ['name' => 'Update'])
            ->assertStatus(401);

        // DELETE destroy without auth
        $this->deleteJson("/api/ecommerce/admin/categories/{$category->id}")
            ->assertStatus(401);
    }

    /**
     * 10. Validation error bekerja.
     */
    public function test_validation_errors_work(): void
    {
        // 1. Missing name
        $response1 = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', [
                'name' => '',
            ]);

        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        // 2. Invalid sort_order (string instead of integer)
        $response2 = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', [
                'name' => 'Kategori Valid',
                'sort_order' => 'bukan_angka',
            ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['sort_order']);

        // 3. Name exceeds 255 chars
        $response3 = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/categories', [
                'name' => str_repeat('a', 256),
            ]);

        $response3->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }
}
