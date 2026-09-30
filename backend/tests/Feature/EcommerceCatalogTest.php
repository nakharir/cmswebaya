<?php

namespace Tests\Feature;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductImage;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EcommerceCatalogTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Test GET /api/ecommerce/categories returns active categories ordered by sort_order.
     */
    public function test_categories_endpoint_returns_only_active_categories(): void
    {
        // Create an active and an inactive category
        $activeCat = Category::factory()->create([
            'name' => 'Active Category Test',
            'slug' => 'active-category-test',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $inactiveCat = Category::factory()->create([
            'name' => 'Inactive Category Test',
            'slug' => 'inactive-category-test',
            'is_active' => false,
            'sort_order' => 2,
        ]);

        $response = $this->getJson('/api/ecommerce/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'sort_order']
                ]
            ]);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($activeCat->slug, $slugs);
        $this->assertNotContains($inactiveCat->slug, $slugs);
    }

    /**
     * Test GET /api/ecommerce/products returns only active products with pagination.
     */
    public function test_products_endpoint_returns_only_active_products_and_paginated(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $activeProduct = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Active Beads Product',
            'slug' => 'active-beads-product-' . uniqid(),
            'is_active' => true,
        ]);

        $inactiveProduct = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Inactive Beads Product',
            'slug' => 'inactive-beads-product-' . uniqid(),
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/ecommerce/products?per_page=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'material', 'base_price', 'category', 'image']
                ],
                'links',
                'meta' => ['current_page', 'per_page', 'total'],
            ]);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($activeProduct->slug, $slugs);
        $this->assertNotContains($inactiveProduct->slug, $slugs);
    }

    /**
     * Test GET /api/ecommerce/products with category filter.
     */
    public function test_products_endpoint_filters_by_category(): void
    {
        $category1 = Category::factory()->create(['slug' => 'cat-filter-1-' . uniqid(), 'is_active' => true]);
        $category2 = Category::factory()->create(['slug' => 'cat-filter-2-' . uniqid(), 'is_active' => true]);

        $product1 = Product::factory()->create([
            'category_id' => $category1->id,
            'slug' => 'prod-cat-1-' . uniqid(),
            'is_active' => true,
        ]);

        $product2 = Product::factory()->create([
            'category_id' => $category2->id,
            'slug' => 'prod-cat-2-' . uniqid(),
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/ecommerce/products?category={$category1->slug}");

        $response->assertStatus(200);
        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($product1->slug, $slugs);
        $this->assertNotContains($product2->slug, $slugs);
    }

    /**
     * Test GET /api/ecommerce/products with search query.
     */
    public function test_products_endpoint_searches_by_keyword(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $uniqueKeyword = 'UnikXYZCraft' . rand(1000, 9999);
        $matchedProduct = Product::factory()->create([
            'category_id' => $category->id,
            'name' => "Special {$uniqueKeyword} Item",
            'slug' => 'search-match-' . uniqid(),
            'is_active' => true,
        ]);

        $otherProduct = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Regular Item',
            'slug' => 'search-other-' . uniqid(),
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/ecommerce/products?search={$uniqueKeyword}");

        $response->assertStatus(200);
        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($matchedProduct->slug, $slugs);
        $this->assertNotContains($otherProduct->slug, $slugs);
    }

    /**
     * Test GET /api/ecommerce/products sorting by price.
     */
    public function test_products_endpoint_sorts_by_price(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $cheap = Product::factory()->create([
            'category_id' => $category->id,
            'base_price' => 5000,
            'is_active' => true,
        ]);

        $expensive = Product::factory()->create([
            'category_id' => $category->id,
            'base_price' => 95000,
            'is_active' => true,
        ]);

        $responseAsc = $this->getJson('/api/ecommerce/products?sort=price_asc&per_page=50');
        $responseAsc->assertStatus(200);
        $prices = collect($responseAsc->json('data'))->pluck('base_price')->all();
        $this->assertTrue($prices[0] <= end($prices));

        $responseDesc = $this->getJson('/api/ecommerce/products?sort=price_desc&per_page=50');
        $responseDesc->assertStatus(200);
        $pricesDesc = collect($responseDesc->json('data'))->pluck('base_price')->all();
        $this->assertTrue($pricesDesc[0] >= end($pricesDesc));
    }

    /**
     * Test GET /api/ecommerce/products/{slug} returns product details with category, variants, images.
     */
    public function test_product_detail_endpoint_returns_complete_data(): void
    {
        $category = Category::factory()->create(['name' => 'Detail Test Category', 'is_active' => true]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Detail Test Product',
            'slug' => 'detail-test-product-' . uniqid(),
            'base_price' => 30000,
            'is_active' => true,
        ]);

        $activeVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-ACT-' . uniqid(),
            'name' => 'Active Variant',
            'is_active' => true,
            'stock' => 15,
        ]);

        $inactiveVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-INACT-' . uniqid(),
            'name' => 'Inactive Variant',
            'is_active' => false,
            'stock' => 10,
        ]);

        $image = ProductImage::factory()->create([
            'product_id' => $product->id,
            'image_url' => '/images/ecommerce/test.jpg',
            'is_primary' => true,
        ]);

        $response = $this->getJson("/api/ecommerce/products/{$product->slug}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'base_price' => 30000,
                    'category' => [
                        'id' => $category->id,
                        'name' => $category->name,
                    ],
                ]
            ]);

        // Assert inactive variant is NOT returned in public detail
        $variantSkus = collect($response->json('data.variants'))->pluck('sku')->all();
        $this->assertContains($activeVariant->sku, $variantSkus);
        $this->assertNotContains($inactiveVariant->sku, $variantSkus);

        // Assert image is returned
        $images = collect($response->json('data.images'))->pluck('image_url')->all();
        $this->assertContains($image->image_url, $images);
    }

    /**
     * Test GET /api/ecommerce/products/{slug} returns 404 for inactive product.
     */
    public function test_inactive_product_returns_404(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $inactiveProduct = Product::factory()->create([
            'category_id' => $category->id,
            'slug' => 'inactive-product-' . uniqid(),
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/ecommerce/products/{$inactiveProduct->slug}");
        $response->assertStatus(404);
    }

    /**
     * Test Admin Product CRUD endpoints.
     */
    public function test_admin_product_crud_endpoints(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        // 1. Create Product
        $createResponse = $this->postJson('/api/ecommerce/admin/products', [
            'category_id' => $category->id,
            'name' => 'Admin Created Product',
            'slug' => 'admin-created-product-' . uniqid(),
            'description' => 'Created via admin endpoint',
            'material' => 'Test Material',
            'base_price' => 45000,
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201);
        $productId = $createResponse->json('data.id');
        $this->assertNotNull($productId);

        // 2. Update Product
        $updateResponse = $this->putJson("/api/ecommerce/admin/products/{$productId}", [
            'name' => 'Admin Updated Product Name',
            'base_price' => 50000,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'Admin Updated Product Name',
                    'base_price' => 50000,
                ]
            ]);

        // 3. Delete Product
        $deleteResponse = $this->deleteJson("/api/ecommerce/admin/products/{$productId}");
        $deleteResponse->assertStatus(200);

        $this->assertDatabaseMissing('ecommerce_products', [
            'id' => $productId,
        ]);
    }
}
