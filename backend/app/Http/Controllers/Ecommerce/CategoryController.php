<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Resources\Ecommerce\CategoryResource;
use App\Models\Ecommerce\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * Display a listing of active categories.
     */
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->active()
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->withCount('activeProducts')
            ->get();

        return CategoryResource::collection($categories);
    }
}
