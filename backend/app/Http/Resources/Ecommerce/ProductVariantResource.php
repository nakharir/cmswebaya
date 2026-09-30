<?php

namespace App\Http\Resources\Ecommerce;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'name' => $this->name,
            'options' => $this->options ?? [],
            'price' => $this->price !== null ? (float) $this->price : null,
            'effective_price' => (float) $this->effective_price,
            'stock' => (int) $this->stock,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
