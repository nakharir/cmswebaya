<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable

{
    use HasApiTokens, HasFactory, Notifiable;

    /*
    |--------------------------------------------------------------------------
    | Role Constants
    |--------------------------------------------------------------------------
    */

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_OPERATOR = 'operator';
    public const ROLE_ADMIN_PROVINSI = 'admin_provinsi';
    public const ROLE_ADMIN_KABUPATEN = 'admin_kabupaten';
    public const ROLE_ADMIN_KECAMATAN = 'admin_kecamatan';
    public const ROLE_CUSTOMER = 'customer';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'sidebars' => 'array',
    ];

    protected $attributes = [
        'status' => 0,
        'role' => self::ROLE_CUSTOMER,
    ];

    /*
    |--------------------------------------------------------------------------
    | Role Checking
    |--------------------------------------------------------------------------
    */

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles, true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(self::ROLE_SUPER_ADMIN);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole([
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN,
        ]);
    }

    public function isOperator(): bool
    {
        return $this->hasRole(self::ROLE_OPERATOR);
    }

    public function isProvinceAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN_PROVINSI);
    }

    public function isRegencyAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN_KABUPATEN);
    }

    public function isDistrictAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN_KECAMATAN);
    }

    public function isRegionalAdmin(): bool
    {
        return $this->hasRole([
            self::ROLE_ADMIN_PROVINSI,
            self::ROLE_ADMIN_KABUPATEN,
            self::ROLE_ADMIN_KECAMATAN,
        ]);
    }

    public function isStaff(): bool
    {
        return $this->hasRole([
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN,
            self::ROLE_OPERATOR,
            self::ROLE_ADMIN_PROVINSI,
            self::ROLE_ADMIN_KABUPATEN,
            self::ROLE_ADMIN_KECAMATAN,
        ]);
    }

    public function isCustomer(): bool
    {
        return $this->hasRole(self::ROLE_CUSTOMER);
    }

    /*
    |--------------------------------------------------------------------------
    | Ecommerce Relationships
    |--------------------------------------------------------------------------
    */

    public function addresses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(
            \App\Models\Ecommerce\CustomerAddress::class,
            'user_id'
        );
    }

    public function defaultAddress(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(
            \App\Models\Ecommerce\CustomerAddress::class,
            'user_id'
        )->where('is_default', true);
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(
            \App\Models\Ecommerce\Order::class,
            'customer_id'
        );
    }
}
