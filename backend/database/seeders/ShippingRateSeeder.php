<?php

namespace Database\Seeders;

use App\Models\Ecommerce\ShippingRate;
use Illuminate\Database\Seeder;

class ShippingRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rates = [
            // General / Default Fallback Rates (* = all provinces)
            [
                'courier' => 'jnt',
                'courier_name' => 'J&T Express',
                'service_code' => 'ez',
                'service_name' => 'Reguler (EZ)',
                'province' => '*',
                'cost_per_kg' => 22000,
                'min_cost' => 22000,
                'etd' => '2-4 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'reg',
                'service_name' => 'Reguler (REG)',
                'province' => '*',
                'cost_per_kg' => 24000,
                'min_cost' => 24000,
                'etd' => '2-4 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'sicepat',
                'courier_name' => 'SiCepat',
                'service_code' => 'reg',
                'service_name' => 'SiUntung (Reguler)',
                'province' => '*',
                'cost_per_kg' => 22000,
                'min_cost' => 22000,
                'etd' => '2-4 hari',
                'is_active' => true,
            ],

            // Jawa Timur (Lokal / Terdekat)
            [
                'courier' => 'jnt',
                'courier_name' => 'J&T Express',
                'service_code' => 'ez',
                'service_name' => 'Reguler (EZ)',
                'province' => 'Jawa Timur',
                'cost_per_kg' => 10000,
                'min_cost' => 10000,
                'etd' => '1-2 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'reg',
                'service_name' => 'Reguler (REG)',
                'province' => 'Jawa Timur',
                'cost_per_kg' => 11000,
                'min_cost' => 11000,
                'etd' => '1-2 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'yes',
                'service_name' => 'Express (YES)',
                'province' => 'Jawa Timur',
                'cost_per_kg' => 20000,
                'min_cost' => 20000,
                'etd' => '1 hari (Besok Sampai)',
                'is_active' => true,
            ],

            // DKI Jakarta
            [
                'courier' => 'jnt',
                'courier_name' => 'J&T Express',
                'service_code' => 'ez',
                'service_name' => 'Reguler (EZ)',
                'province' => 'DKI Jakarta',
                'cost_per_kg' => 15000,
                'min_cost' => 15000,
                'etd' => '2-3 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'reg',
                'service_name' => 'Reguler (REG)',
                'province' => 'DKI Jakarta',
                'cost_per_kg' => 16000,
                'min_cost' => 16000,
                'etd' => '2-3 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'yes',
                'service_name' => 'Express (YES)',
                'province' => 'DKI Jakarta',
                'cost_per_kg' => 28000,
                'min_cost' => 28000,
                'etd' => '1 hari (Besok Sampai)',
                'is_active' => true,
            ],

            // Jawa Barat & Banten
            [
                'courier' => 'jnt',
                'courier_name' => 'J&T Express',
                'service_code' => 'ez',
                'service_name' => 'Reguler (EZ)',
                'province' => 'Jawa Barat',
                'cost_per_kg' => 16000,
                'min_cost' => 16000,
                'etd' => '2-3 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'reg',
                'service_name' => 'Reguler (REG)',
                'province' => 'Jawa Barat',
                'cost_per_kg' => 17000,
                'min_cost' => 17000,
                'etd' => '2-3 hari',
                'is_active' => true,
            ],

            // Jawa Tengah & DI Yogyakarta
            [
                'courier' => 'jnt',
                'courier_name' => 'J&T Express',
                'service_code' => 'ez',
                'service_name' => 'Reguler (EZ)',
                'province' => 'Jawa Tengah',
                'cost_per_kg' => 12000,
                'min_cost' => 12000,
                'etd' => '1-2 hari',
                'is_active' => true,
            ],
            [
                'courier' => 'jne',
                'courier_name' => 'JNE Express',
                'service_code' => 'reg',
                'service_name' => 'Reguler (REG)',
                'province' => 'Jawa Tengah',
                'cost_per_kg' => 13000,
                'min_cost' => 13000,
                'etd' => '1-2 hari',
                'is_active' => true,
            ],
        ];

        foreach ($rates as $rate) {
            ShippingRate::updateOrCreate(
                [
                    'courier' => $rate['courier'],
                    'service_code' => $rate['service_code'],
                    'province' => $rate['province'],
                ],
                $rate
            );
        }
    }
}
