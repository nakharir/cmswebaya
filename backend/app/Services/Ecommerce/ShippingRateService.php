<?php

namespace App\Services\Ecommerce;

use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use App\Models\Ecommerce\ShippingRate;
use Illuminate\Validation\ValidationException;

class ShippingRateService
{
    const DEFAULT_ITEM_WEIGHT_GRAMS = 250;

    /**
     * Calculate total weight in grams from checkout items.
     *
     * @param array $items Array of ['product_id' => int, 'variant_id' => ?int, 'quantity' => int]
     * @return array ['total_weight' => int, 'weight_kg' => int, 'items_weight' => array]
     */
    public function calculateItemsWeight(array $items): array
    {
        $totalWeight = 0;
        $itemsWeight = [];

        // Preload products & variants
        $productIds = collect($items)->pluck('product_id')->filter()->unique()->values();
        $variantIds = collect($items)->pluck('variant_id')->filter()->unique()->values();

        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        $variants = ProductVariant::whereIn('id', $variantIds)->get()->keyBy('id');

        foreach ($items as $index => $item) {
            $productId = $item['product_id'] ?? null;
            $variantId = $item['variant_id'] ?? null;
            $qty = (int) ($item['quantity'] ?? 1);

            $itemWeight = self::DEFAULT_ITEM_WEIGHT_GRAMS;

            if ($variantId && isset($variants[$variantId])) {
                $variant = $variants[$variantId];
                if ($variant->weight !== null && $variant->weight > 0) {
                    $itemWeight = (int) $variant->weight;
                } elseif (isset($products[$productId]) && $products[$productId]->weight > 0) {
                    $itemWeight = (int) $products[$productId]->weight;
                }
            } elseif ($productId && isset($products[$productId])) {
                $product = $products[$productId];
                if ($product->weight > 0) {
                    $itemWeight = (int) $product->weight;
                }
            }

            $lineWeight = $itemWeight * $qty;
            $totalWeight += $lineWeight;

            $itemsWeight[$index] = [
                'unit_weight' => $itemWeight,
                'quantity' => $qty,
                'total_weight' => $lineWeight,
            ];
        }

        // Billable weight in kg: minimum 1 kg, rounded up
        $weightKg = (int) max(1, ceil($totalWeight / 1000));

        return [
            'total_weight' => $totalWeight,
            'weight_kg' => $weightKg,
            'items_weight' => $itemsWeight,
        ];
    }

    /**
     * Get available shipping rates for destination and calculated weight.
     *
     * @param string $province
     * @param string|null $city
     * @param int $totalWeightGrams
     * @return array
     */
    public function getAvailableRates(string $province, ?string $city = null, int $totalWeightGrams = 250): array
    {
        $weightKg = (int) max(1, ceil($totalWeightGrams / 1000));

        // 1. Fetch only supported couriers (JNE REG and J&T EZ), excluding SiCepat and duplicate services
        $rates = ShippingRate::active()
            ->whereIn('courier', ['jne', 'jnt'])
            ->where(function ($query) use ($province) {
                $query->where('province', $province)
                    ->orWhere('province', '*');
            })
            ->get()
            ->filter(function ($rate) {
                $c = strtolower($rate->courier);
                $s = strtolower($rate->service_code);
                return ($c === 'jne' && $s === 'reg') || ($c === 'jnt' && $s === 'ez');
            });

        // 2. Group by courier + service_code, prioritizing province-specific rates over '*'
        $grouped = [];
        foreach ($rates as $rate) {
            $key = strtolower($rate->courier) . '_' . strtolower($rate->service_code);

            if (!isset($grouped[$key])) {
                $grouped[$key] = $rate;
            } else {
                // If existing is wildcard and current is specific province, replace it
                if ($grouped[$key]->province === '*' && $rate->province !== '*') {
                    $grouped[$key] = $rate;
                }
            }
        }

        $options = [];
        foreach ($grouped as $rate) {
            $cost = max((float) $rate->min_cost, (float) ($rate->cost_per_kg * $weightKg));
            $courierKey = strtolower($rate->courier);

            $courierName = $courierKey === 'jne' ? 'JNE Express' : 'J&T Express';
            $serviceCode = $courierKey === 'jne' ? 'reg' : 'ez';
            $serviceName = $courierKey === 'jne' ? 'REG (Regular)' : 'EZ (Reguler)';
            $methodName = "{$courierName} — {$serviceName}";

            $options[] = [
                'courier' => $courierKey,
                'courier_name' => $courierName,
                'service_code' => $serviceCode,
                'service_name' => $serviceName,
                'shipping_method' => $methodName,
                'cost' => $cost,
                'etd' => $rate->etd,
                'total_weight' => $totalWeightGrams,
                'weight_kg' => $weightKg,
            ];
        }

        // Sort: 1. JNE Express — REG (Regular), 2. J&T Express — EZ (Reguler)
        usort($options, function ($a, $b) {
            $sortOrder = ['jne' => 1, 'jnt' => 2];
            return ($sortOrder[$a['courier']] ?? 99) <=> ($sortOrder[$b['courier']] ?? 99);
        });

        return array_values($options);
    }

    /**
     * Calculate and validate exact shipping cost for checkout.
     *
     * @param string $province
     * @param string $courier
     * @param string|null $serviceCode
     * @param int $totalWeightGrams
     * @return array
     * @throws ValidationException
     */
    public function calculateExactRate(string $province, string $courier, ?string $serviceCode, int $totalWeightGrams): array
    {
        $courier = strtolower(trim($courier));
        $weightKg = (int) max(1, ceil($totalWeightGrams / 1000));

        $query = ShippingRate::active()->where('courier', $courier);

        if ($serviceCode) {
            $query->where('service_code', strtolower(trim($serviceCode)));
        }

        $rates = $query->where(function ($q) use ($province) {
            $q->where('province', $province)
              ->orWhere('province', '*');
        })->get();

        if ($rates->isEmpty()) {
            throw ValidationException::withMessages([
                'shipping_courier' => ["Layanan pengiriman untuk kurir '{$courier}' ke tujuan '{$province}' tidak tersedia."],
            ]);
        }

        // Prioritize specific province over wildcard
        $selectedRate = $rates->firstWhere('province', $province) ?? $rates->firstWhere('province', '*');

        if (!$selectedRate) {
            throw ValidationException::withMessages([
                'shipping_courier' => ["Tarif pengiriman tidak ditemukan."],
            ]);
        }

        $cost = max((float) $selectedRate->min_cost, (float) ($selectedRate->cost_per_kg * $weightKg));
        $courierKey = strtolower($selectedRate->courier);

        $courierName = $courierKey === 'jne' ? 'JNE Express' : ($courierKey === 'jnt' ? 'J&T Express' : $selectedRate->courier_name);
        $serviceCode = $courierKey === 'jne' ? 'reg' : ($courierKey === 'jnt' ? 'ez' : $selectedRate->service_code);
        $serviceName = $courierKey === 'jne' ? 'REG (Regular)' : ($courierKey === 'jnt' ? 'EZ (Reguler)' : $selectedRate->service_name);
        $methodName = "{$courierName} — {$serviceName}";

        return [
            'courier' => $courierKey,
            'courier_name' => $courierName,
            'service_code' => $serviceCode,
            'service_name' => $serviceName,
            'shipping_method' => $methodName,
            'cost' => $cost,
            'etd' => $selectedRate->etd,
            'total_weight' => $totalWeightGrams,
            'weight_kg' => $weightKg,
        ];
    }
}
