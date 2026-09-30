<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ManualCrudVerificationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_complete_manual_crud_scenario_from_spec(): void
    {
        // 1. Admin logs in or has token
        $admin = User::firstOrCreate(
            ['email' => 'admin@cms.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('admin123'),
                'status' => 1,
            ]
        );
        $token = $admin->createToken('manual-test-token')->plainTextToken;
        $headers = [
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ];

        // Ensure no leftover from previous run
        Category::where('slug', 'manik-kaca-test')->delete();
        Category::where('name', 'Manik Kaca Test')->delete();

        // ---------------------------------------------------------
        // Step 1: TAMBAH KATEGORI
        // Nama: Manik Kaca Test
        // Deskripsi: Testing kategori
        // Status: Aktif (true)
        // Urutan: 10
        // ---------------------------------------------------------
        $createPayload = [
            'name' => 'Manik Kaca Test',
            'description' => 'Testing kategori',
            'is_active' => true,
            'sort_order' => 10,
        ];

        $createRes = $this->withHeaders($headers)
            ->postJson('/api/ecommerce/admin/categories', $createPayload);

        $createRes->assertStatus(201);
        $catId = $createRes->json('data.id');
        $this->assertNotNull($catId);
        $this->assertEquals('Manik Kaca Test', $createRes->json('data.name'));
        $this->assertEquals('manik-kaca-test', $createRes->json('data.slug'));
        $this->assertEquals('Testing kategori', $createRes->json('data.description'));
        $this->assertTrue($createRes->json('data.is_active'));
        $this->assertEquals(10, $createRes->json('data.sort_order'));

        // Pastikan muncul di table list admin
        $listRes = $this->withHeaders($headers)
            ->getJson('/api/ecommerce/admin/categories');
        $listRes->assertStatus(200);
        $listedIds = collect($listRes->json('data'))->pluck('id')->all();
        $this->assertContains($catId, $listedIds);

        // ---------------------------------------------------------
        // Step 2: PRODUK DROPDOWN (/ecommerce/products/create)
        // Pastikan kategori baru tersedia di dropdown GET /api/ecommerce/categories
        // ---------------------------------------------------------
        $publicCatRes = $this->getJson('/api/ecommerce/categories');
        $publicCatRes->assertStatus(200);
        $publicSlugs = collect($publicCatRes->json('data'))->pluck('slug')->all();
        $this->assertContains('manik-kaca-test', $publicSlugs, 'Kategori baru harus muncul di dropdown publik/produk');

        // ---------------------------------------------------------
        // Step 3: EDIT KATEGORI
        // Ubah nama menjadi: Manik Kaca Updated (or unique if Manik Kaca exists)
        // ---------------------------------------------------------
        $editPayload = [
            'name' => 'Manik Kaca Edisi Spesial',
            'description' => 'Deskripsi sesudah edit',
            'sort_order' => 12,
            'is_active' => true,
        ];

        $editRes = $this->withHeaders($headers)
            ->putJson("/api/ecommerce/admin/categories/{$catId}", $editPayload);

        $editRes->assertStatus(200);
        $this->assertEquals('Manik Kaca Edisi Spesial', $editRes->json('data.name'));
        $this->assertEquals('manik-kaca-edisi-spesial', $editRes->json('data.slug'));
        $this->assertEquals('Deskripsi sesudah edit', $editRes->json('data.description'));
        $this->assertEquals(12, $editRes->json('data.sort_order'));

        // ---------------------------------------------------------
        // Step 4: KATEGORI DENGAN PRODUK TIDAK BISA DIHAPUS
        // ---------------------------------------------------------
        $product = Product::factory()->create([
            'category_id' => $catId,
            'name' => 'Produk Penghambat Hapus',
            'slug' => 'produk-penghambat-hapus-' . uniqid(),
            'base_price' => 50000,
        ]);

        $failDeleteRes = $this->withHeaders($headers)
            ->deleteJson("/api/ecommerce/admin/categories/{$catId}");

        $failDeleteRes->assertStatus(422);
        $this->assertStringContainsString('masih digunakan oleh produk', $failDeleteRes->json('message'));
        $this->assertDatabaseHas('ecommerce_categories', ['id' => $catId]);
        $this->assertDatabaseHas('ecommerce_products', ['id' => $product->id]);

        // ---------------------------------------------------------
        // Step 5: HAPUS KATEGORI SETELAH PRODUK DILEPAS/DIHAPUS
        // ---------------------------------------------------------
        $product->delete();

        $successDeleteRes = $this->withHeaders($headers)
            ->deleteJson("/api/ecommerce/admin/categories/{$catId}");

        $successDeleteRes->assertStatus(200);
        $this->assertDatabaseMissing('ecommerce_categories', ['id' => $catId]);
    }
}
