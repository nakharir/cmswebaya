<?php

namespace Database\Seeders;

use App\Models\Ecommerce\Category;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductImage;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Database\Seeder;

class EcommerceSeeder extends Seeder
{
    /**
     * Seed KREZOEMA ecommerce foundation data (Idempotent).
     */
    public function run(): void
    {
        // 1. Categories
        $categoriesData = [
            [
                'name' => 'Manik Kaca',
                'slug' => 'manik-kaca',
                'description' => 'Kilau pendaran cahaya, efek aurora transparan, dan teknik lampwork artisan dengan detail warna organik.',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Akrilik',
                'slug' => 'akrilik',
                'description' => 'Material ringan warna pastel matte, bentuk geometris ceria, dan tekstur kontemporer yang playful.',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Mutiara',
                'slug' => 'mutiara',
                'description' => 'Mutiara sintetis satin klasik hingga mutiara air tawar baroque bertekstur alami yang elegan.',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Tali & Kawat',
                'slug' => 'tali-kawat',
                'description' => 'Benang nilon anyam kuat, benang elastis lentur, hingga kawat tembaga non-tarnish untuk struktur tahan lama.',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Alat & Tang Crafting',
                'slug' => 'alat-crafting',
                'description' => 'Tang presisi berujung halus, gunting mikro, bead mat, dan jarum perangkai untuk kenyamanan berkarya.',
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $catData) {
            $categories[$catData['slug']] = Category::updateOrCreate(
                ['slug' => $catData['slug']],
                $catData
            );
        }

        // 2. Products, Variants, & Images
        $productsData = [
            [
                'category_slug' => 'manik-kaca',
                'name' => 'Manik Kaca Aurora Iridescent',
                'slug' => 'manik-kaca-aurora-iridescent',
                'description' => 'Manik kaca kilau aurora dengan pendaran spektrum warna lembut saat terkena pantulan cahaya.',
                'material' => 'Kaca kristal borosilikat 8mm • Isi 25 butir',
                'base_price' => 24000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/manik-kaca-aurora-1.jpg',
                        'alt_text' => 'Manik Kaca Aurora Iridescent Tampilan Utama',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                    [
                        'image_url' => '/images/ecommerce/products/manik-kaca-aurora-2.jpg',
                        'alt_text' => 'Detail Kilau Pendaran Manik Kaca Aurora',
                        'sort_order' => 2,
                        'is_primary' => false,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'MK-AUR-VIO-6MM',
                        'name' => 'Violet Pendar - 6mm',
                        'options' => ['warna' => 'Violet Pendar', 'ukuran' => '6mm'],
                        'price' => 24000,
                        'stock' => 50,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-AUR-VIO-8MM',
                        'name' => 'Violet Pendar - 8mm',
                        'options' => ['warna' => 'Violet Pendar', 'ukuran' => '8mm'],
                        'price' => 26000,
                        'stock' => 45,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-AUR-AQU-6MM',
                        'name' => 'Aqua Mist - 6mm',
                        'options' => ['warna' => 'Aqua Mist', 'ukuran' => '6mm'],
                        'price' => 24000,
                        'stock' => 30,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-AUR-AQU-8MM',
                        'name' => 'Aqua Mist - 8mm',
                        'options' => ['warna' => 'Aqua Mist', 'ukuran' => '8mm'],
                        'price' => 26000,
                        'stock' => 40,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-AUR-SUN-8MM',
                        'name' => 'Sunset Peach - 8mm',
                        'options' => ['warna' => 'Sunset Peach', 'ukuran' => '8mm'],
                        'price' => 26000,
                        'stock' => 35,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'akrilik',
                'name' => 'Manik Akrilik Pastel Matte',
                'slug' => 'manik-akrilik-pastel-matte',
                'description' => 'Butiran akrilik ringan bernuansa pastel matte dengan tekstur lembut untuk strap dan gelang.',
                'material' => 'Akrilik matte premium • Isi 50 butir',
                'base_price' => 18000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/manik-akrilik-pastel-1.jpg',
                        'alt_text' => 'Manik Akrilik Pastel Matte Beragam Bentuk',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                    [
                        'image_url' => '/images/ecommerce/products/manik-akrilik-pastel-2.jpg',
                        'alt_text' => 'Detail Tekstur Halus Akrilik Pastel',
                        'sort_order' => 2,
                        'is_primary' => false,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'AKR-PAS-LIL-BLT',
                        'name' => 'Lilac Fog - Bulat',
                        'options' => ['warna' => 'Lilac Fog', 'bentuk' => 'Bulat'],
                        'price' => 18000,
                        'stock' => 60,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'AKR-PAS-LIL-BNG',
                        'name' => 'Lilac Fog - Bunga',
                        'options' => ['warna' => 'Lilac Fog', 'bentuk' => 'Bunga'],
                        'price' => 20000,
                        'stock' => 40,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'AKR-PAS-SAG-BLT',
                        'name' => 'Soft Sage - Bulat',
                        'options' => ['warna' => 'Soft Sage', 'bentuk' => 'Bulat'],
                        'price' => 18000,
                        'stock' => 55,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'AKR-PAS-BLU-BTG',
                        'name' => 'Blush - Bintang',
                        'options' => ['warna' => 'Blush', 'bentuk' => 'Bintang'],
                        'price' => 20000,
                        'stock' => 50,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'mutiara',
                'name' => 'Mutiara Sintetis Classic Ivory',
                'slug' => 'mutiara-sintetis-classic-ivory',
                'description' => 'Mutiara sintetis berbobot mantap dengan lapisan kilau satin klasik untuk kalung dan anting berkelas.',
                'material' => 'Inti kaca dilapisi pearlescent satin • 1 untai 40cm',
                'base_price' => 28000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/mutiara-classic-ivory-1.jpg',
                        'alt_text' => 'Mutiara Sintetis Classic Ivory Elegan',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'MUT-IVO-CLA-4MM',
                        'name' => 'Classic Ivory - 4mm',
                        'options' => ['warna' => 'Classic Ivory', 'ukuran' => '4mm'],
                        'price' => 26000,
                        'stock' => 40,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MUT-IVO-CLA-6MM',
                        'name' => 'Classic Ivory - 6mm',
                        'options' => ['warna' => 'Classic Ivory', 'ukuran' => '6mm'],
                        'price' => 28000,
                        'stock' => 70,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MUT-IVO-CLA-8MM',
                        'name' => 'Classic Ivory - 8mm',
                        'options' => ['warna' => 'Classic Ivory', 'ukuran' => '8mm'],
                        'price' => 32000,
                        'stock' => 50,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MUT-IVO-CHA-6MM',
                        'name' => 'Champagne - 6mm',
                        'options' => ['warna' => 'Champagne', 'ukuran' => '6mm'],
                        'price' => 28000,
                        'stock' => 35,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MUT-IVO-ROS-6MM',
                        'name' => 'Soft Rose - 6mm',
                        'options' => ['warna' => 'Soft Rose', 'ukuran' => '6mm'],
                        'price' => 28000,
                        'stock' => 30,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'tali-kawat',
                'name' => 'Tali Nylon Craft Braided 0.8mm',
                'slug' => 'tali-nylon-craft-braided',
                'description' => 'Tali anyaman nilon kuat, tahan air, dan tidak mudah berserabut. Ideal untuk macrame dan anyaman manik.',
                'material' => 'Nilon mikro 0.8mm • Panjang 10 meter',
                'base_price' => 15000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/tali-nylon-braided-1.jpg',
                        'alt_text' => 'Roll Tali Nylon Craft Braided',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'TAL-NYL-TER',
                        'name' => 'Earthy Terracotta',
                        'options' => ['warna' => 'Earthy Terracotta'],
                        'price' => 15000,
                        'stock' => 100,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'TAL-NYL-CHA',
                        'name' => 'Charcoal Slate',
                        'options' => ['warna' => 'Charcoal Slate'],
                        'price' => 15000,
                        'stock' => 80,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'TAL-NYL-WAR',
                        'name' => 'Warm Sand',
                        'options' => ['warna' => 'Warm Sand'],
                        'price' => 15000,
                        'stock' => 90,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'TAL-NYL-LAV',
                        'name' => 'Lavender',
                        'options' => ['warna' => 'Lavender'],
                        'price' => 15000,
                        'stock' => 65,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'alat-crafting',
                'name' => 'Tang Round Nose Mini Precision',
                'slug' => 'tang-round-nose-mini-crafting',
                'description' => 'Tang presisi berujung bulat halus untuk membuat loop kawat rapi tanpa meninggalkan goresan pada material.',
                'material' => 'Stainless steel dengan gagang ergonomis soft-grip',
                'base_price' => 45000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/tang-round-nose-1.jpg',
                        'alt_text' => 'Tang Round Nose Mini Precision Gagang Lilac dan Coral',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'ALT-TNG-LIL',
                        'name' => 'Gagang Lilac',
                        'options' => ['warna' => 'Gagang Lilac'],
                        'price' => 45000,
                        'stock' => 25,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'ALT-TNG-COR',
                        'name' => 'Gagang Coral',
                        'options' => ['warna' => 'Gagang Coral'],
                        'price' => 45000,
                        'stock' => 30,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'tali-kawat',
                'name' => 'Kawat Tembaga Non-Tarnish 0.5mm',
                'slug' => 'kawat-tembaga-craft-non-tarnish',
                'description' => 'Kawat lilit lentur berlapis anti-karat untuk wire-wrapping liontin dan rangka aksesoris handmade.',
                'material' => 'Tembaga murni dilapisi proteksi ganda • Roll 5 meter',
                'base_price' => 32000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/kawat-tembaga-1.jpg',
                        'alt_text' => 'Kawat Tembaga Non-Tarnish Kilau Logam',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'KWT-TMB-GLD-05',
                        'name' => 'Warm Gold - 0.5mm',
                        'options' => ['warna' => 'Warm Gold', 'ukuran' => '0.5mm'],
                        'price' => 32000,
                        'stock' => 50,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'KWT-TMB-GLD-08',
                        'name' => 'Warm Gold - 0.8mm',
                        'options' => ['warna' => 'Warm Gold', 'ukuran' => '0.8mm'],
                        'price' => 35000,
                        'stock' => 40,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'KWT-TMB-SLV-05',
                        'name' => 'Silver Gleam - 0.5mm',
                        'options' => ['warna' => 'Silver Gleam', 'ukuran' => '0.5mm'],
                        'price' => 32000,
                        'stock' => 45,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'KWT-TMB-COP-05',
                        'name' => 'Rose Copper - 0.5mm',
                        'options' => ['warna' => 'Rose Copper', 'ukuran' => '0.5mm'],
                        'price' => 32000,
                        'stock' => 35,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'manik-kaca',
                'name' => 'Manik Kaca Lampwork Bunga Mekar',
                'slug' => 'manik-kaca-lampwork-bunga-mekar',
                'description' => 'Setiap butir dibentuk manual satu per satu di atas api obor dengan motif flora organik yang unik.',
                'material' => 'Artisan Lampwork Glass • Set 4 butir',
                'base_price' => 35000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/lampwork-bunga-1.jpg',
                        'alt_text' => 'Manik Kaca Lampwork Motif Bunga Mekar Unik',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'MK-LMP-VIO',
                        'name' => 'Wild Violet',
                        'options' => ['warna' => 'Wild Violet'],
                        'price' => 35000,
                        'stock' => 20,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-LMP-YEL',
                        'name' => 'Sunbeam Yellow',
                        'options' => ['warna' => 'Sunbeam Yellow'],
                        'price' => 35000,
                        'stock' => 25,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MK-LMP-CHE',
                        'name' => 'Cherry Blossom',
                        'options' => ['warna' => 'Cherry Blossom'],
                        'price' => 35000,
                        'stock' => 30,
                        'is_active' => true,
                    ],
                ],
            ],
            [
                'category_slug' => 'mutiara',
                'name' => 'Mutiara Air Tawar Baroque Asimetris',
                'slug' => 'mutiara-air-tawar-baroque-natural',
                'description' => 'Bentuk alami asimetris dari alam, memberi sentuhan otentik dan tekstur personal pada perhiasan buatan tangan.',
                'material' => 'Mutiara air tawar asli bentuk baroque • 1 string 35cm',
                'base_price' => 52000,
                'is_active' => true,
                'images' => [
                    [
                        'image_url' => '/images/ecommerce/products/mutiara-baroque-1.jpg',
                        'alt_text' => 'Mutiara Air Tawar Baroque Alami Asimetris',
                        'sort_order' => 1,
                        'is_primary' => true,
                    ],
                ],
                'variants' => [
                    [
                        'sku' => 'MUT-BAR-WHT',
                        'name' => 'Natural White',
                        'options' => ['warna' => 'Natural White'],
                        'price' => 52000,
                        'stock' => 18,
                        'is_active' => true,
                    ],
                    [
                        'sku' => 'MUT-BAR-PCH',
                        'name' => 'Iridescent Peach',
                        'options' => ['warna' => 'Iridescent Peach'],
                        'price' => 55000,
                        'stock' => 22,
                        'is_active' => true,
                    ],
                ],
            ],
        ];

        foreach ($productsData as $pData) {
            $category = $categories[$pData['category_slug']];

            $product = Product::updateOrCreate(
                ['slug' => $pData['slug']],
                [
                    'category_id' => $category->id,
                    'name' => $pData['name'],
                    'description' => $pData['description'],
                    'material' => $pData['material'],
                    'base_price' => $pData['base_price'],
                    'is_active' => $pData['is_active'],
                ]
            );

            // Seed variants
            if (!empty($pData['variants'])) {
                foreach ($pData['variants'] as $vData) {
                    ProductVariant::updateOrCreate(
                        ['sku' => $vData['sku']],
                        [
                            'product_id' => $product->id,
                            'name' => $vData['name'],
                            'options' => $vData['options'],
                            'price' => $vData['price'],
                            'stock' => $vData['stock'],
                            'is_active' => $vData['is_active'],
                        ]
                    );
                }
            }

            // Seed images
            if (!empty($pData['images'])) {
                foreach ($pData['images'] as $imgData) {
                    ProductImage::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'image_url' => $imgData['image_url'],
                        ],
                        [
                            'alt_text' => $imgData['alt_text'],
                            'sort_order' => $imgData['sort_order'],
                            'is_primary' => $imgData['is_primary'],
                        ]
                    );
                }
            }
        }
    }
}
