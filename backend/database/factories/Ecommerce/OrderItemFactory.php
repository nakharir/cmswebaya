<?php

namespace Database\Factories\Ecommerce;

use App\Models\Ecommerce\Order;
use App\Models\Ecommerce\OrderItem;
use App\Models\Ecommerce\Product;
use App\Models\Ecommerce\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ecommerce\OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'variant_id' => ProductVariant::factory(),
            'product_name' => fake()->words(3, true),
            'variant_name' => 'Variant ' . fake()->colorName(),
            'sku' => 'SKU-' . fake()->numerify('#####'),
            'unit_price' => 25000,
            'quantity' => 2,
            'subtotal' => 50000,
        ];
    }
}
