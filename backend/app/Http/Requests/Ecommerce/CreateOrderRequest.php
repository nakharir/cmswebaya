<?php

namespace App\Http\Requests\Ecommerce;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer'],
            'shipping_method' => ['required', 'string', Rule::in(['jnt', 'jne'])],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'address_id.required' => 'Alamat pengiriman wajib dipilih.',
            'address_id.integer' => 'ID alamat harus berupa integer.',
            'shipping_method.required' => 'Metode pengiriman wajib dipilih.',
            'shipping_method.in' => 'Metode pengiriman hanya boleh jnt atau jne.',
            'items.required' => 'Item pesanan tidak boleh kosong.',
            'items.array' => 'Item pesanan harus berupa array.',
            'items.min' => 'Item pesanan minimal harus memiliki 1 item.',
            'items.*.product_id.required' => 'ID produk wajib diisi.',
            'items.*.product_id.integer' => 'ID produk harus berupa integer.',
            'items.*.variant_id.integer' => 'ID varian harus berupa integer.',
            'items.*.quantity.required' => 'Jumlah kuantitas wajib diisi.',
            'items.*.quantity.integer' => 'Jumlah kuantitas harus berupa integer.',
            'items.*.quantity.min' => 'Jumlah kuantitas minimal 1.',
        ];
    }
}
