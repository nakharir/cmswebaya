<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\CreateOrderRequest;
use App\Http\Resources\Ecommerce\OrderResource;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Services\Ecommerce\OrderNumberGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Display a listing of orders for the authenticated customer.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()
            ->orders()
            ->with(['items', 'customer'])
            ->orderBy('id', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Display the specified order for the authenticated customer.
     */
    public function show(Request $request, int $id): OrderResource|JsonResponse
    {
        $order = Order::with(['items', 'customer'])->find($id);

        if (!$order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        if ((int) $order->customer_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke pesanan ini.',
            ], 403);
        }

        return new OrderResource($order);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        $user = $request->user();

        // 1. Verify Address Ownership & Existence
        $address = CustomerAddress::find($request->address_id);

        if (!$address) {
            return response()->json([
                'message' => 'Alamat pengiriman tidak ditemukan.',
            ], 404);
        }

        if ((int) $address->user_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk menggunakan alamat ini.',
            ], 403);
        }

        // 2. Process Order Atomically inside DB Transaction
        $order = DB::transaction(function () use ($user, $address, $request) {
            $itemsInput = $request->input('items', []);

            // Sort non-null variant IDs to lock in deterministic order to prevent race conditions / deadlocks
            $variantIds = collect($itemsInput)
                ->pluck('variant_id')
                ->filter()
                ->unique()
                ->sort()
                ->values();

            $lockedVariants = collect();
            if ($variantIds->isNotEmpty()) {
                $lockedVariants = ProductVariant::whereIn('id', $variantIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
            }

            // Sort product IDs to lock in deterministic order to prevent race conditions / deadlocks
            $productIds = collect($itemsInput)
                ->pluck('product_id')
                ->filter()
                ->unique()
                ->sort()
                ->values();

            $lockedProducts = collect();
            if ($productIds->isNotEmpty()) {
                $lockedProducts = Product::with('variants')
                    ->whereIn('id', $productIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
            }

            $orderSubtotal = 0;
            $preparedItems = [];

            foreach ($itemsInput as $item) {
                $productId = $item['product_id'];
                $variantId = $item['variant_id'] ?? null;
                $requestedQty = (int) $item['quantity'];

                // Validate Product
                $product = $lockedProducts->get($productId) ?? Product::with('variants')->lockForUpdate()->find($productId);
                if (!$product) {
                    throw new HttpResponseException(response()->json([
                        'message' => "Produk dengan ID {$productId} tidak ditemukan.",
                    ], 404));
                }

                if (!$product->is_active) {
                    throw new HttpResponseException(response()->json([
                        'message' => "Produk '{$product->name}' sedang tidak aktif.",
                    ], 422));
                }

                // Check if product has variants
                $hasVariants = $product->variants->isNotEmpty();

                if ($hasVariants) {
                    if (!$variantId) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Produk '{$product->name}' memiliki varian, silakan pilih salah satu varian.",
                        ], 422));
                    }

                    // Validate Variant
                    $variant = $lockedVariants->get($variantId);
                    if (!$variant) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Varian dengan ID {$variantId} tidak ditemukan.",
                        ], 404));
                    }

                    if ((int) $variant->product_id !== (int) $product->id) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Varian '{$variant->name}' bukan merupakan varian dari produk '{$product->name}'.",
                        ], 422));
                    }

                    if (!$variant->is_active) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Varian '{$variant->name}' sedang tidak aktif.",
                        ], 422));
                    }

                    // Validate Stock
                    if ($variant->stock < $requestedQty) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Stok tidak mencukupi untuk varian '{$variant->name}'. Stok tersedia: {$variant->stock}, diminta: {$requestedQty}.",
                        ], 422));
                    }

                    // Calculate Server-Side Unit Price & Subtotal
                    $unitPrice = $variant->price !== null
                        ? (float) $variant->price
                        : (float) $product->base_price;

                    $itemSubtotal = round($unitPrice * $requestedQty, 2);
                    $orderSubtotal += $itemSubtotal;

                    // Decrement Stock
                    $variant->stock -= $requestedQty;
                    $variant->save();

                    // Prepare Snapshot Data for Order Item
                    $preparedItems[] = [
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'product_name' => $product->name,
                        'variant_name' => $variant->name,
                        'sku' => $variant->sku,
                        'unit_price' => $unitPrice,
                        'quantity' => $requestedQty,
                        'subtotal' => $itemSubtotal,
                    ];
                } else {
                    if ($variantId) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Produk '{$product->name}' tidak memiliki varian.",
                        ], 422));
                    }

                    // Validate Stock for non-variant product
                    if ($product->stock < $requestedQty) {
                        throw new HttpResponseException(response()->json([
                            'message' => "Stok tidak mencukupi untuk produk '{$product->name}'. Stok tersedia: {$product->stock}, diminta: {$requestedQty}.",
                        ], 422));
                    }

                    // Calculate Server-Side Unit Price & Subtotal
                    $unitPrice = (float) $product->base_price;
                    $itemSubtotal = round($unitPrice * $requestedQty, 2);
                    $orderSubtotal += $itemSubtotal;

                    // Decrement Stock
                    $product->stock -= $requestedQty;
                    $product->save();

                    // Prepare Snapshot Data without variant
                    $preparedItems[] = [
                        'product_id' => $product->id,
                        'variant_id' => null,
                        'product_name' => $product->name,
                        'variant_name' => null,
                        'sku' => null,
                        'unit_price' => $unitPrice,
                        'quantity' => $requestedQty,
                        'subtotal' => $itemSubtotal,
                    ];
                }
            }

            // Generate Sequential Order Number: KREZOEMA-YYYYMMDD-XXXX (atomic, concurrency-safe)
            $orderNumber = OrderNumberGenerator::generate();

            // Create Order with Shipping Snapshot
            $order = Order::create([
                'customer_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'shipping_method' => $request->shipping_method,
                'shipping_name' => $address->recipient_name,
                'shipping_whatsapp' => $address->whatsapp,
                'shipping_address' => $address->address,
                'shipping_kecamatan' => $address->district,
                'shipping_city' => $address->city,
                'shipping_province' => $address->province,
                'shipping_postal_code' => $address->postal_code,
                'notes' => $request->notes,
                'subtotal' => $orderSubtotal,
                'shipping_cost' => 0.00,
                'total' => $orderSubtotal,
            ]);

            // Create Order Items
            foreach ($preparedItems as $itemRecord) {
                $order->items()->create($itemRecord);
            }

            return $order;
        });

        return (new OrderResource($order->load(['items', 'customer'])))
            ->response()
            ->setStatusCode(201);
    }
}
