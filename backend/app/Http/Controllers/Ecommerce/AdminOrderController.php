<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Resources\Ecommerce\OrderResource;
use App\Models\Ecommerce\Order;
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

                // Lock row variants inside the transaction
                $lockedVariants = collect();
                if ($variantIds->isNotEmpty()) {
                    $lockedVariants = ProductVariant::whereIn('id', $variantIds)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');
                }

                // Aggregate quantities by variant to handle multiple items with the same variant safely
                $quantitiesByVariant = [];
                foreach ($lockedOrder->items as $item) {
                    if ($item->variant_id) {
                        $quantitiesByVariant[$item->variant_id] = ($quantitiesByVariant[$item->variant_id] ?? 0) + $item->quantity;
                    }
                }

                // 1. If transitioning to 'cancelled' from an active status, restore stock
                if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                    foreach ($quantitiesByVariant as $variantId => $qty) {
                        if ($lockedVariants->has($variantId)) {
                            $variant = $lockedVariants->get($variantId);
                            $variant->increment('stock', $qty);
                        }
                    }
                }

                // 2. If transitioning from 'cancelled' back to an active status (confirmed/processing/shipped)
                $activeStatuses = ['confirmed', 'processing', 'shipped'];
                if ($oldStatus === 'cancelled' && in_array($newStatus, $activeStatuses)) {
                    // First pass: cek stock terlebih dahulu
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

                    // Second pass: jika stock cukup → decrement sesuai quantity (tidak boleh stock negatif)
                    foreach ($quantitiesByVariant as $variantId => $neededQty) {
                        $variant = $lockedVariants->get($variantId);
                        $variant->decrement('stock', $neededQty);
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
            $lockedOrder->save();
        });

        return (new OrderResource($order->fresh(['items', 'customer'])))
            ->response()
            ->setStatusCode(200);
    }
}
