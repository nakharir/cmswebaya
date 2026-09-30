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

    // Order Lifecycle Status Constants
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_PROCESSING,
        self::STATUS_SHIPPED,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    // Manual Transfer Payment Status Constants
    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_WAITING_VERIFICATION = 'waiting_verification';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_REJECTED = 'rejected';

    const PAYMENT_STATUSES = [
        self::PAYMENT_STATUS_UNPAID,
        self::PAYMENT_STATUS_WAITING_VERIFICATION,
        self::PAYMENT_STATUS_PAID,
        self::PAYMENT_STATUS_REJECTED,
    ];

    protected $attributes = [
        'status' => self::STATUS_PENDING,
        'payment_status' => self::PAYMENT_STATUS_UNPAID,
        'payment_method' => 'manual_transfer',
    ];

    protected $fillable = [
        'customer_id',
        'order_number',
        'status',
        'payment_status',
        'payment_method',
        'transfer_proof',
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
