<?php

use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
// Legacy routes (controllers not present in project)
// jaminan, finansial, aspek, limac, survey, pemohon, etc.
*/

//user
Route::post('/register', [UserController::class, 'register']); //tambah data
Route::post('/login', [UserController::class, 'login']); //login
Route::put('/updateuserbyid/{id}', [UserController::class, 'update']); //update data
//sidebar
Route::get('/user/{userId}/sidebars', [UserController::class, 'getUserWithSidebars']); //get data with sidebar
Route::get('/getallusersidebar', [UserController::class, 'getAllUsers']); //get all data
Route::post('/sidebars/update-status', [UserController::class, 'updateSidebarStatus']); //update status
Route::put('/sync-user-sidebars', [UserController::class, 'syncUserSidebars']); //sync user sidebar

//verify user
Route::post('/verify-user', [UserController::class, 'verifyUser']); //verify user

/*
// Legacy placeholders (controllers not in repository)
*/

// ==========================================
// KREZOEMA Ecommerce Routes (Stage 11)
// ==========================================
Route::prefix('ecommerce')->group(function () {
    // Public Catalog Endpoints
    Route::get('/categories', [\App\Http\Controllers\Ecommerce\CategoryController::class, 'index']);
    Route::get('/products', [\App\Http\Controllers\Ecommerce\ProductController::class, 'index']);
    Route::get('/products/{slug}', [\App\Http\Controllers\Ecommerce\ProductController::class, 'show']);

    // Customer Authentication (Stage 12)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [\App\Http\Controllers\Ecommerce\CustomerAuthController::class, 'register']);
        Route::post('/login', [\App\Http\Controllers\Ecommerce\CustomerAuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [\App\Http\Controllers\Ecommerce\CustomerAuthController::class, 'logout']);
            Route::get('/me', [\App\Http\Controllers\Ecommerce\CustomerAuthController::class, 'me']);
            Route::put('/profile', [\App\Http\Controllers\Ecommerce\CustomerAuthController::class, 'updateProfile']);
        });
    });

    // Customer Addresses (Stage 12)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/addresses', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'index']);
        Route::post('/addresses', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'store']);
        Route::get('/addresses/{id}', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'show']);
        Route::put('/addresses/{id}', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'update']);
        Route::delete('/addresses/{id}', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'destroy']);
        Route::post('/addresses/{id}/default', [\App\Http\Controllers\Ecommerce\CustomerAddressController::class, 'setDefault']);
    });

    // Customer Orders (Stage 14)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/orders', [\App\Http\Controllers\Ecommerce\OrderController::class, 'index']);
        Route::post('/orders', [\App\Http\Controllers\Ecommerce\OrderController::class, 'store']);
        Route::get('/orders/{id}', [\App\Http\Controllers\Ecommerce\OrderController::class, 'show']);
    });

    // Admin Foundation Endpoints
    Route::prefix('admin')->group(function () {
        Route::get('/products/{id}', [\App\Http\Controllers\Ecommerce\AdminProductController::class, 'show']);
        Route::post('/products', [\App\Http\Controllers\Ecommerce\AdminProductController::class, 'store']);
        Route::put('/products/{id}', [\App\Http\Controllers\Ecommerce\AdminProductController::class, 'update']);
        Route::delete('/products/{id}', [\App\Http\Controllers\Ecommerce\AdminProductController::class, 'destroy']);

        // Admin Product Images
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/products/{productId}/images', [\App\Http\Controllers\Ecommerce\AdminProductImageController::class, 'index']);
            Route::post('/products/{productId}/images', [\App\Http\Controllers\Ecommerce\AdminProductImageController::class, 'store']);
            Route::delete('/products/{productId}/images/{imageId}', [\App\Http\Controllers\Ecommerce\AdminProductImageController::class, 'destroy']);
            Route::put('/products/{productId}/images/{imageId}/primary', [\App\Http\Controllers\Ecommerce\AdminProductImageController::class, 'setPrimary']);
        });

        // Admin Categories
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/categories', [\App\Http\Controllers\Ecommerce\AdminCategoryController::class, 'index']);
            Route::post('/categories', [\App\Http\Controllers\Ecommerce\AdminCategoryController::class, 'store']);
            Route::get('/categories/{id}', [\App\Http\Controllers\Ecommerce\AdminCategoryController::class, 'show']);
            Route::put('/categories/{id}', [\App\Http\Controllers\Ecommerce\AdminCategoryController::class, 'update']);
            Route::delete('/categories/{id}', [\App\Http\Controllers\Ecommerce\AdminCategoryController::class, 'destroy']);
        });

        // Admin Orders (Restricted to Admin / Operator)
        Route::middleware(['auth:sanctum', 'admin'])->group(function () {
            Route::get('/orders', [\App\Http\Controllers\Ecommerce\AdminOrderController::class, 'index']);
            Route::get('/orders/{id}', [\App\Http\Controllers\Ecommerce\AdminOrderController::class, 'show']);
            Route::put('/orders/{id}', [\App\Http\Controllers\Ecommerce\AdminOrderController::class, 'update']);
        });
    });
});
