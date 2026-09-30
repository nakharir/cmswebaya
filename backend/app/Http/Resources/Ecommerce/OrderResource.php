<?php

namespace App\Http\Resources\Ecommerce;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'customer_id' => $this->customer_id,
            'customer' => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone ?? $this->shipping_whatsapp,
            ] : null,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'shipping_method' => $this->shipping_method,
            'shipping_name' => $this->shipping_name,
            'shipping_whatsapp' => $this->shipping_whatsapp,
            'shipping_address' => $this->shipping_address,
            'shipping_kecamatan' => $this->shipping_kecamatan,
            'shipping_city' => $this->shipping_city,
            'shipping_province' => $this->shipping_province,
            'shipping_postal_code' => $this->shipping_postal_code,
            'shipping_address_snapshot' => [
                'recipient_name' => $this->shipping_name,
                'whatsapp' => $this->shipping_whatsapp,
                'address' => $this->shipping_address,
                'district' => $this->shipping_kecamatan,
                'city' => $this->shipping_city,
                'province' => $this->shipping_province,
                'postal_code' => $this->shipping_postal_code,
            ],
            'notes' => $this->notes,
            'subtotal' => (float) $this->subtotal,
            'shipping_cost' => (float) $this->shipping_cost,
            'total' => (float) $this->total,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
