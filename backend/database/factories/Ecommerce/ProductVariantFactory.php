<?php

namespace Database\Factories\Ecommerce;

use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ecommerce\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => 'SKU-' . strtoupper(Str::random(8)),
            'name' => 'Variant ' . fake()->colorName(),
            'options' => [
                'warna' => fake()->colorName(),
                'ukuran' => fake()->randomElement(['6mm', '8mm', '10mm']),
            ],
            'price' => fake()->randomElement([15000, 20000, 25000]),
            'stock' => fake()->numberBetween(10, 100),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
