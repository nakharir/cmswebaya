<?php

namespace Database\Factories\Ecommerce;

use App\Models\Ecommerce\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ecommerce\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'customer_id' => User::factory(),
            'order_number' => 'KRE-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'shipping_method' => fake()->randomElement(['jnt', 'jne']),
            'shipping_name' => fake()->name(),
            'shipping_whatsapp' => '08' . fake()->numerify('##########'),
            'shipping_address' => fake()->streetAddress(),
            'shipping_kecamatan' => 'Kecamatan ' . fake()->citySuffix(),
            'shipping_city' => fake()->city(),
            'shipping_province' => 'Jawa Timur',
            'shipping_postal_code' => fake()->numerify('6####'),
            'notes' => fake()->sentence(),
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
        ];
    }
}
