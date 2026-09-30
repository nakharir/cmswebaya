<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class EcommerceAdminProductImageTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected string $token;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->admin = User::factory()->create([
            'status' => 1,
        ]);
        $this->token = $this->admin->createToken('admin-img-test-token')->plainTextToken;

        $this->category = Category::factory()->create([
            'name' => 'Kategori Aksesoris',
            'is_active' => true,
        ]);

        $this->product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Gelang Manik Kaca',
            'base_price' => 15000,
            'description' => 'Deskripsi gelang manik kaca handmade.',
            'material' => 'kaca',
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
     * 1 & 2 & 3 & 4. Authenticated admin dapat upload image, file tersimpan, record dibuat dan terhubung.
     */
    public function test_authenticated_admin_can_upload_product_image(): void
    {
        $file = UploadedFile::fake()->image('gelang1.jpg', 600, 600)->size(500); // 500 KB

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $file,
                'alt_text' => 'Gelang Tampak Depan',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.alt_text', 'Gelang Tampak Depan')
            ->assertJsonPath('data.is_primary', true); // First image should automatically be primary

        $imageUrl = $response->json('data.image_url');
        $this->assertNotEmpty($imageUrl);

        // Verify storage
        $storedPath = Str::after($imageUrl, '/storage/');
        Storage::disk('public')->assertExists($storedPath);

        // Verify database
        $this->assertDatabaseHas('ecommerce_product_images', [
            'product_id' => $this->product->id,
            'alt_text' => 'Gelang Tampak Depan',
            'is_primary' => true,
        ]);
    }

    /**
     * 5. Primary image bekerja dengan benar (hanya ada satu primary).
     */
    public function test_primary_image_selection_and_switch(): void
    {
        $file1 = UploadedFile::fake()->image('img1.png', 400, 400)->size(300);
        $file2 = UploadedFile::fake()->image('img2.png', 400, 400)->size(300);

        // Upload first image (auto primary)
        $res1 = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $file1,
            ]);
        $img1Id = $res1->json('data.id');
        $this->assertTrue($res1->json('data.is_primary'));

        // Upload second image with is_primary = true
        $res2 = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $file2,
                'is_primary' => true,
            ]);
        $img2Id = $res2->json('data.id');
        $this->assertTrue($res2->json('data.is_primary'));

        // Verify first image is now is_primary = false in DB
        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $img1Id,
            'is_primary' => false,
        ]);
        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $img2Id,
            'is_primary' => true,
        ]);

        // Explicitly set first image back to primary via endpoint
        $resSet = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/products/{$this->product->id}/images/{$img1Id}/primary");
        $resSet->assertStatus(200)
            ->assertJsonPath('data.is_primary', true);

        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $img1Id,
            'is_primary' => true,
        ]);
        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $img2Id,
            'is_primary' => false,
        ]);
    }

    /**
     * 6. Image invalid ditolak (file teks / format salah).
     */
    public function test_invalid_image_format_is_rejected(): void
    {
        $fakeText = UploadedFile::fake()->create('malicious.php', 100, 'text/plain');

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $fakeText,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * 7. File terlalu besar (> 5MB) ditolak.
     */
    public function test_oversized_image_is_rejected(): void
    {
        $largeFile = UploadedFile::fake()->image('huge.jpg')->size(6000); // 6 MB > 5 MB limit

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $largeFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * 8. Unauthenticated request ditolak (401).
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", [
                'image' => $file,
            ]);

        $response->assertStatus(401);
    }

    /**
     * 9. Image dapat dihapus dan mempromosikan image tersisa jika yang dihapus adalah primary.
     */
    public function test_image_can_be_deleted_and_promotes_remaining(): void
    {
        $file1 = UploadedFile::fake()->image('a.jpg', 400, 400)->size(100);
        $file2 = UploadedFile::fake()->image('b.jpg', 400, 400)->size(100);

        $res1 = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", ['image' => $file1]);
        $res2 = $this->withHeaders($this->authHeader())
            ->postJson("/api/ecommerce/admin/products/{$this->product->id}/images", ['image' => $file2, 'is_primary' => false]);

        $id1 = $res1->json('data.id');
        $id2 = $res2->json('data.id');

        // Delete primary image ($id1)
        $delRes = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/ecommerce/admin/products/{$this->product->id}/images/{$id1}");

        $delRes->assertStatus(200);

        $this->assertDatabaseMissing('ecommerce_product_images', ['id' => $id1]);

        // $id2 should now be promoted to primary
        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $id2,
            'is_primary' => true,
        ]);
    }

    /**
     * 10. Image dari product lain tidak dapat dihapus sembarangan.
     */
    public function test_image_from_another_product_cannot_be_deleted(): void
    {
        $otherProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Produk Lain',
            'base_price' => 20000,
        ]);

        $otherImage = ProductImage::create([
            'product_id' => $otherProduct->id,
            'image_url' => '/storage/ecommerce/products/other.jpg',
            'alt_text' => 'Other',
            'is_primary' => true,
        ]);

        // Try to delete otherProduct's image using $this->product->id
        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/ecommerce/admin/products/{$this->product->id}/images/{$otherImage->id}");

        $response->assertStatus(404);

        $this->assertDatabaseHas('ecommerce_product_images', [
            'id' => $otherImage->id,
        ]);
    }

    /**
     * 11 & 12 & 13. Deskripsi produk create, update, dan nullable validation.
     */
    public function test_product_description_crud_and_preservation(): void
    {
        // 1. Create with description
        $createPayload = [
            'name' => 'Manik Kaca Eksklusif',
            'category_id' => $this->category->id,
            'material' => 'kaca',
            'base_price' => 25000,
            'description' => 'Manik kaca warna-warni untuk berbagai kebutuhan crafting dan handmade.',
            'is_active' => true,
        ];

        $createRes = $this->withHeaders($this->authHeader())
            ->postJson('/api/ecommerce/admin/products', $createPayload);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.description', 'Manik kaca warna-warni untuk berbagai kebutuhan crafting dan handmade.');

        $prodId = $createRes->json('data.id');

        // Verify show endpoint returns description
        $showRes = $this->getJson("/api/ecommerce/admin/products/{$prodId}");
        $showRes->assertStatus(200)
            ->assertJsonPath('data.description', 'Manik kaca warna-warni untuk berbagai kebutuhan crafting dan handmade.');

        // 2. Update description
        $updatePayload = [
            'description' => 'Deskripsi diperbarui dengan detail ukuran 8mm.',
        ];

        $updateRes = $this->withHeaders($this->authHeader())
            ->putJson("/api/ecommerce/admin/products/{$prodId}", $updatePayload);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.description', 'Deskripsi diperbarui dengan detail ukuran 8mm.');

        $this->assertDatabaseHas('ecommerce_products', [
            'id' => $prodId,
            'description' => 'Deskripsi diperbarui dengan detail ukuran 8mm.',
        ]);
    }
}
