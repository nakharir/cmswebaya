<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\AdminCategoryStoreRequest;
use App\Http\Requests\Ecommerce\AdminCategoryUpdateRequest;
use App\Http\Resources\Ecommerce\CategoryResource;
use App\Models\Ecommerce\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminCategoryController extends Controller
{
    /**
     * Display a listing of categories for admin.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::query()->withCount('products');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $isActive = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        $categories = $query->orderBy('sort_order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(AdminCategoryStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (!array_key_exists('is_active', $validated) || $validated['is_active'] === null) {
            $validated['is_active'] = true;
        }

        if (!array_key_exists('sort_order', $validated) || $validated['sort_order'] === null) {
            $validated['sort_order'] = 0;
        }

        $category = Category::create($validated);
        $category->loadCount('products');

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified category.
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::withCount('products')->find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan',
            ], 404);
        }

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Update the specified category.
     */
    public function update(AdminCategoryUpdateRequest $request, int $id): JsonResponse
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan',
            ], 404);
        }

        $validated = $request->validated();
        $category->update($validated);
        $category->loadCount('products');

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan',
            ], 404);
        }

        // Pastikan kategori tidak masih digunakan oleh produk
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Kategori masih digunakan oleh produk dan tidak dapat dihapus.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus',
        ], 200);
    }
}
