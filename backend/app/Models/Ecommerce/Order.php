<?php

namespace App\Models\Ecommerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $table = 'ecommerce_orders';

    protected $fillable = [
        'customer_id',
        'order_number',
        'status',
        'shipping_method',
        'shipping_name',
        'shipping_whatsapp',
        'shipping_address',
        'shipping_kecamatan',
        'shipping_city',
        'shipping_province',
        'shipping_postal_code',
        'notes',
        'subtotal',
        'shipping_cost',
        'total',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping_cost' => 'float',
        'total' => 'float',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
}
