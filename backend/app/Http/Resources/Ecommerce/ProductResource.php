<?php

namespace App\Http\Resources\Ecommerce;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $primaryImageUrl = $this->primaryImage?->image_url 
            ?? $this->images?->first()?->image_url;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'material' => $this->material,
            'base_price' => (float) $this->base_price,
            'stock' => (int) ($this->stock ?? 0),
            'is_active' => (bool) $this->is_active,
            'image' => $primaryImageUrl,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('activeVariants', function () {
                return $this->activeVariants;
            }, $this->whenLoaded('variants'))),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
