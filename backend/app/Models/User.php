<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'phone',
        'address',
        'status',
        'sidebars' 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'sidebars' => 'array'
    ];

    protected $attributes = [
        'status' => 0,
    ];

    /**
     * Check if user is staff (SuperAdmin, Admin, or Operator).
     */
    public function isStaff(): bool
    {
        return in_array((int) $this->status, [1, 2, 3], true);
    }

    /**
     * Check if user is admin (SuperAdmin or Admin).
     */
    public function isAdmin(): bool
    {
        return in_array((int) $this->status, [1, 2], true);
    }

    /**
     * Check if user is a standard customer.
     */
    public function isCustomer(): bool
    {
        return !$this->isStaff();
    }

    public function addresses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\Ecommerce\CustomerAddress::class, 'user_id');
    }

    public function defaultAddress(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\Ecommerce\CustomerAddress::class, 'user_id')->where('is_default', true);
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\Ecommerce\Order::class, 'customer_id');
    }
}
