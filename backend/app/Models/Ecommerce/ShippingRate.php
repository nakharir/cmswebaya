<?php

namespace App\Models\Ecommerce;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    use HasFactory;

    protected $table = 'ecommerce_shipping_rates';

    protected $fillable = [
        'courier',
        'courier_name',
        'service_code',
        'service_name',
        'province',
        'city',
        'cost_per_kg',
        'min_cost',
        'etd',
        'is_active',
    ];

    protected $casts = [
        'cost_per_kg' => 'float',
        'min_cost' => 'float',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
