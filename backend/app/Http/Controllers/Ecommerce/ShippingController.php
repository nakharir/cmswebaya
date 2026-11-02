<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Models\Ecommerce\CustomerAddress;
use App\Models\Ecommerce\ShippingRate;
use App\Services\Ecommerce\ShippingRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShippingController extends Controller
{
    protected ShippingRateService $shippingService;

    public function __construct(ShippingRateService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    /**
     * Calculate available shipping rates for checkout.
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'address_id' => ['nullable', 'integer'],
            'province' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $province = null;
        $city = null;

        // Determine destination province from address_id or directly from request
        if ($request->filled('address_id')) {
            $address = CustomerAddress::find($request->address_id);
            if (!$address) {
                return response()->json(['message' => 'Alamat pengiriman tidak ditemukan.'], 404);
            }
            if ($request->user() && (int) $address->user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Akses alamat tidak sah.'], 403);
            }
            $province = $address->province;
            $city = $address->city;
        } elseif ($request->filled('province')) {
            $province = $request->province;
            $city = $request->city;
        } else {
            return response()->json(['message' => 'Pilih alamat pengiriman atau provinsi tujuan terlebih dahulu.'], 422);
        }

        $items = $request->input('items', []);
        $weightData = $this->shippingService->calculateItemsWeight($items);
        $options = $this->shippingService->getAvailableRates($province, $city, $weightData['total_weight']);

        return response()->json([
            'destination' => [
                'province' => $province,
                'city' => $city,
            ],
            'total_weight' => $weightData['total_weight'],
            'weight_kg' => $weightData['weight_kg'],
            'rates' => $options,
        ]);
    }

    /**
     * Admin: List all shipping rates.
     */
    public function indexRates(): JsonResponse
    {
        $rates = ShippingRate::orderBy('province')->orderBy('courier')->get();
        return response()->json(['data' => $rates]);
    }

    /**
     * Admin: Create new shipping rate.
     */
    public function storeRate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'courier' => ['required', 'string', 'max:50'],
            'courier_name' => ['required', 'string', 'max:100'],
            'service_code' => ['required', 'string', 'max:50'],
            'service_name' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'cost_per_kg' => ['required', 'numeric', 'min:0'],
            'min_cost' => ['required', 'numeric', 'min:0'],
            'etd' => ['required', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        $rate = ShippingRate::create($validated);
        return response()->json(['data' => $rate, 'message' => 'Tarif pengiriman berhasil ditambahkan.'], 201);
    }

    /**
     * Admin: Update shipping rate.
     */
    public function updateRate(Request $request, int $id): JsonResponse
    {
        $rate = ShippingRate::findOrFail($id);

        $validated = $request->validate([
            'courier' => ['sometimes', 'string', 'max:50'],
            'courier_name' => ['sometimes', 'string', 'max:100'],
            'service_code' => ['sometimes', 'string', 'max:50'],
            'service_name' => ['sometimes', 'string', 'max:100'],
            'province' => ['sometimes', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'cost_per_kg' => ['sometimes', 'numeric', 'min:0'],
            'min_cost' => ['sometimes', 'numeric', 'min:0'],
            'etd' => ['sometimes', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        $rate->update($validated);
        return response()->json(['data' => $rate, 'message' => 'Tarif pengiriman berhasil diperbarui.']);
    }

    /**
     * Admin: Delete shipping rate.
     */
    public function destroyRate(int $id): JsonResponse
    {
        $rate = ShippingRate::findOrFail($id);
        $rate->delete();
        return response()->json(['message' => 'Tarif pengiriman berhasil dihapus.']);
    }
}
