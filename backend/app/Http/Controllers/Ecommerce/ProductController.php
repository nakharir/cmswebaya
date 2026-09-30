<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\ProductListRequest;
use App\Http\Resources\Ecommerce\ProductResource;
use App\Models\Ecommerce\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * Display a paginated listing of active products with search, category filter, and sorting.
     */
    public function index(ProductListRequest $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->active()
            ->with(['category', 'primaryImage', 'images']);

        // Category filter (by slug or id, support 'category' and 'kategori')
        $categoryParam = $request->input('category') ?? $request->input('kategori');
        if (!empty($categoryParam)) {
            $query->whereHas('category', function ($q) use ($categoryParam) {
                $q->active()->where(function ($sub) use ($categoryParam) {
                    $sub->where('slug', $categoryParam)
                        ->orWhere('id', $categoryParam);
                });
            });
        }

        // Search filter (name, description, material)
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhere('material', 'like', "%{$term}%");
            });
        }

        // Sorting
        $sort = $request->input('sort', 'latest');
        switch ($sort) {
            case 'price_asc':
                $query->orderBy('base_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('base_price', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'oldest':
                $query->orderBy('id', 'asc');
                break;
            case 'latest':
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        $perPage = (int) $request->input('per_page', 12);
        $products = $query->paginate($perPage);

        return ProductResource::collection($products);
    }

    /**
     * Display the specified active product by slug.
     */
    public function show(string $slug): ProductResource|JsonResponse
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->active()
            ->with([
                'category',
                'images',
                'activeVariants' => function ($q) {
                    $q->where('is_active', true)->orderBy('id', 'asc');
                },
            ])
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        return new ProductResource($product);
    }
}
