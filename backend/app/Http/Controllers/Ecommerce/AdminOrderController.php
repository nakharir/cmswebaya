<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Resources\Ecommerce\OrderResource;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    /**
     * Display a listing of orders for admin/operator.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with(['items', 'customer'])->orderByDesc('id');

        // Filter by Search Query
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('shipping_name', 'like', "%{$search}%")
                    ->orWhere('shipping_whatsapp', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Order Status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Filter by Payment Status
        if ($request->filled('payment_status') && $request->input('payment_status') !== 'all') {
            $query->where('payment_status', $request->input('payment_status'));
        }

        $perPage = (int) $request->input('per_page', 20);
        $orders = $query->paginate($perPage);

        return OrderResource::collection($orders);
    }

    /**
     * Display the specified order for admin.
     */
    public function show(int $id): OrderResource|JsonResponse
    {
        $order = Order::with(['items', 'customer'])->find($id);

        if (!$order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        return new OrderResource($order);
    }

    /**
     * Update the specified order's status and details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => [
                'sometimes',
                'required',
                'string',
                Rule::in(['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']),
            ],
            'payment_status' => [
                'sometimes',
                'required',
                'string',
                Rule::in(Order::PAYMENT_STATUSES),
            ],
            'notes' => ['nullable', 'string', 'max:500'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
        ], [
            'status.required' => 'Status pesanan wajib diisi.',
            'status.in' => 'Status pesanan tidak valid.',
            'payment_status.required' => 'Status pembayaran wajib diisi.',
            'payment_status.in' => 'Status pembayaran tidak valid.',
        ]);

        DB::transaction(function () use ($order, $validated) {
            // Re-lock the order row inside the transaction
            $lockedOrder = Order::with('items')->lockForUpdate()->find($order->id);
            if (!$lockedOrder) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Pesanan tidak ditemukan.',
                ], 404));
            }

            if (isset($validated['status'])) {
                $newStatus = $validated['status'];
                $oldStatus = $lockedOrder->status;

                // Extract unique variant IDs in deterministic sorted order to prevent deadlocks
                $variantIds = $lockedOrder->items
                    ->pluck('variant_id')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values();

                // Extract unique product IDs for non-variant items
                $nonVariantProductIds = $lockedOrder->items
                    ->filter(fn($i) => !$i->variant_id)
                    ->pluck('product_id')
                    ->unique()
                    ->sort()
                    ->values();

                // Lock variant rows inside the transaction
                $lockedVariants = collect();
                if ($variantIds->isNotEmpty()) {
                    $lockedVariants = ProductVariant::whereIn('id', $variantIds)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');
                }

                // Lock non-variant product rows inside the transaction
                $lockedProducts = collect();
                if ($nonVariantProductIds->isNotEmpty()) {
                    $lockedProducts = Product::whereIn('id', $nonVariantProductIds)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');
                }

                // Aggregate quantities by variant ID
                $quantitiesByVariant = [];
                foreach ($lockedOrder->items as $item) {
                    if ($item->variant_id) {
                        $quantitiesByVariant[$item->variant_id] = ($quantitiesByVariant[$item->variant_id] ?? 0) + $item->quantity;
                    }
                }

                // Aggregate quantities by product ID for non-variant items
                $quantitiesByProduct = [];
                foreach ($lockedOrder->items as $item) {
                    if (!$item->variant_id) {
                        $quantitiesByProduct[$item->product_id] = ($quantitiesByProduct[$item->product_id] ?? 0) + $item->quantity;
                    }
                }

                // 1. If transitioning to 'cancelled' from an active status, restore stock
                if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                    // Restore variant stock
                    foreach ($quantitiesByVariant as $variantId => $qty) {
                        if ($lockedVariants->has($variantId)) {
                            $lockedVariants->get($variantId)->increment('stock', $qty);
                        }
                    }
                    // Restore non-variant product stock
                    foreach ($quantitiesByProduct as $productId => $qty) {
                        if ($lockedProducts->has($productId)) {
                            $lockedProducts->get($productId)->increment('stock', $qty);
                        }
                    }
                }

                // 2. If transitioning from 'cancelled' back to an active status (confirmed/processing/shipped)
                $activeStatuses = ['confirmed', 'processing', 'shipped'];
                if ($oldStatus === 'cancelled' && in_array($newStatus, $activeStatuses)) {
                    // First pass: check variant stock
                    foreach ($quantitiesByVariant as $variantId => $neededQty) {
                        $variant = $lockedVariants->get($variantId);
                        if (!$variant) {
                            throw new HttpResponseException(response()->json([
                                'message' => "Varian produk tidak ditemukan.",
                            ], 422));
                        }

                        if ($variant->stock < $neededQty) {
                            throw new HttpResponseException(response()->json([
                                'message' => "Stok tidak mencukupi untuk varian '{$variant->name}'. Stok tersedia: {$variant->stock}, dibutuhkan: {$neededQty}.",
                                'errors' => [
                                    'status' => ["Stok tidak mencukupi untuk varian '{$variant->name}' (tersedia: {$variant->stock}, dibutuhkan: {$neededQty})."],
                                ],
                            ], 422));
                        }
                    }

                    // First pass: check non-variant product stock
                    foreach ($quantitiesByProduct as $productId => $neededQty) {
                        $product = $lockedProducts->get($productId);
                        if (!$product) {
                            throw new HttpResponseException(response()->json([
                                'message' => "Produk tidak ditemukan.",
                            ], 422));
                        }

                        if ($product->stock < $neededQty) {
                            throw new HttpResponseException(response()->json([
                                'message' => "Stok tidak mencukupi untuk produk '{$product->name}'. Stok tersedia: {$product->stock}, dibutuhkan: {$neededQty}.",
                                'errors' => [
                                    'status' => ["Stok tidak mencukupi untuk produk '{$product->name}' (tersedia: {$product->stock}, dibutuhkan: {$neededQty})."],
                                ],
                            ], 422));
                        }
                    }

                    // Second pass: decrement variant stock
                    foreach ($quantitiesByVariant as $variantId => $neededQty) {
                        $lockedVariants->get($variantId)->decrement('stock', $neededQty);
                    }

                    // Second pass: decrement non-variant product stock
                    foreach ($quantitiesByProduct as $productId => $neededQty) {
                        $lockedProducts->get($productId)->decrement('stock', $neededQty);
                    }
                }

                $lockedOrder->status = $newStatus;
            }

            if (isset($validated['payment_status'])) {
                $lockedOrder->payment_status = $validated['payment_status'];
            }

            if (array_key_exists('notes', $validated)) {
                $lockedOrder->notes = $validated['notes'];
            }

            if (array_key_exists('tracking_number', $validated)) {
                $lockedOrder->tracking_number = $validated['tracking_number'];
            }

            $lockedOrder->save();
        });

        return (new OrderResource($order->fresh(['items', 'customer'])))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Dashboard statistics for admin.
     */
    public function dashboardStats(): JsonResponse
    {
        // Order counts by status
        $statusCounts = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalOrders = Order::count();
        $activeOrders = Order::whereIn('status', ['pending', 'confirmed', 'processing', 'shipped'])->count();

        // Revenue: sum of total for orders with payment_status = 'paid'
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');

        // Monthly revenue (last 12 months)
        $monthlyRevenue = Order::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue")
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderBy('month')
            ->get();

        // Recent orders (last 10)
        $recentOrders = Order::with('customer')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_name' => $o->customer?->name ?? $o->shipping_name,
                'total' => $o->total,
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'created_at' => $o->created_at,
            ]);

        return response()->json([
            'total_orders' => $totalOrders,
            'active_orders' => $activeOrders,
            'total_revenue' => (float) $totalRevenue,
            'status_counts' => $statusCounts,
            'monthly_revenue' => $monthlyRevenue,
            'recent_orders' => $recentOrders,
        ]);
    }
}
