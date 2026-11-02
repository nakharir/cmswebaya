<?php

namespace App\Http\Requests\Ecommerce;

use Illuminate\Foundation\Http\FormRequest;

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
            'shipping_method' => ['nullable', 'string', 'max:100'],
            'shipping_courier' => ['nullable', 'string', 'max:50'],
            'shipping_service' => ['nullable', 'string', 'max:50'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Configure validator instance to ensure at least shipping_method or shipping_courier is provided.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $hasMethod = !empty($this->input('shipping_method'));
            $hasCourier = !empty($this->input('shipping_courier'));

            if (!$hasMethod && !$hasCourier) {
                $validator->errors()->add('shipping_courier', 'Kurir / metode pengiriman wajib dipilih.');
            }
        });
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
