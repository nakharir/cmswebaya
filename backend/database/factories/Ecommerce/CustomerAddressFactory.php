<?php

namespace Database\Factories\Ecommerce;

use App\Models\Ecommerce\CustomerAddress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ecommerce\CustomerAddress>
 */
class CustomerAddressFactory extends Factory
{
    protected $model = CustomerAddress::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->randomElement(['Rumah', 'Kantor', 'Studio', 'Apartemen']),
            'recipient_name' => fake()->name(),
            'whatsapp' => '08' . fake()->numerify('##########'),
            'address' => fake()->streetAddress(),
            'district' => 'Kecamatan ' . fake()->citySuffix(),
            'city' => fake()->city(),
            'province' => 'Jawa Timur',
            'postal_code' => fake()->numerify('6####'),
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
