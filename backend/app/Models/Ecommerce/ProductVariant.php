<?php

namespace App\Models\Ecommerce;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $table = 'ecommerce_product_variants';

    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'options',
        'price',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'options' => 'array',
        'price' => 'float',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variant_id');
    }

    public function getEffectivePriceAttribute(): ?float
    {
        if ($this->price !== null) {
            return (float) $this->price;
        }

        return $this->product ? (float) $this->product->base_price : null;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
