<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\AdminProductImageStoreRequest;
use App\Http\Resources\Ecommerce\ProductImageResource;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminProductImageController extends Controller
{
    /**
     * Get all images for a product.
     */
    public function index(int $productId): AnonymousResourceCollection|JsonResponse
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $images = $product->images()
            ->orderBy('is_primary', 'desc')
            ->orderBy('sort_order', 'asc')
            ->get();

        return ProductImageResource::collection($images);
    }

    /**
     * Upload and store a new image for a product.
     */
    public function store(AdminProductImageStoreRequest $request, int $productId): JsonResponse
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validated();
        $file = $request->file('image');

        // Store file in Storage disk public under ecommerce/products
        $path = $file->store('ecommerce/products', 'public');
        $imageUrl = '/storage/' . $path;

        // Determine if this should be primary image:
        // 1. Explicitly requested as primary, OR
        // 2. Product has no existing images yet
        $hasExistingImages = ProductImage::where('product_id', $product->id)->exists();
        $isPrimary = $request->boolean('is_primary') || !$hasExistingImages;

        if ($isPrimary) {
            // Unset previous primary image(s) for this product
            ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
        }

        $altText = !empty($validated['alt_text']) ? $validated['alt_text'] : $product->name;
        $sortOrder = isset($validated['sort_order']) ? (int) $validated['sort_order'] : 0;

        $productImage = ProductImage::create([
            'product_id' => $product->id,
            'image_url' => $imageUrl,
            'alt_text' => $altText,
            'sort_order' => $sortOrder,
            'is_primary' => $isPrimary,
        ]);

        return (new ProductImageResource($productImage))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Delete an image from storage and database.
     */
    public function destroy(int $productId, int $imageId): JsonResponse
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $image = ProductImage::where('product_id', $product->id)->find($imageId);

        if (!$image) {
            return response()->json([
                'message' => 'Gambar tidak ditemukan untuk produk ini.',
            ], 404);
        }

        // Delete physical file from storage if present
        $relativePath = Str::after($image->image_url, '/storage/');
        if ($relativePath && Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        $wasPrimary = $image->is_primary;
        $image->delete();

        // If the deleted image was primary, promote the first remaining image to primary
        if ($wasPrimary) {
            $firstRemaining = ProductImage::where('product_id', $product->id)
                ->orderBy('sort_order', 'asc')
                ->first();

            if ($firstRemaining) {
                $firstRemaining->update(['is_primary' => true]);
            }
        }

        return response()->json([
            'message' => 'Gambar berhasil dihapus.',
        ]);
    }

    /**
     * Set a specific image as the primary image for a product.
     */
    public function setPrimary(int $productId, int $imageId): JsonResponse
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $image = ProductImage::where('product_id', $product->id)->find($imageId);

        if (!$image) {
            return response()->json([
                'message' => 'Gambar tidak ditemukan untuk produk ini.',
            ], 404);
        }

        // Unset primary for all other images of this product
        ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);

        // Set this image as primary
        $image->update(['is_primary' => true]);

        return (new ProductImageResource($image))
            ->response()
            ->setStatusCode(200);
    }
}
