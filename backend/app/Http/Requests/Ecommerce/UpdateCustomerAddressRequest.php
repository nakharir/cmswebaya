<?php

namespace App\Http\Requests\Ecommerce;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['sometimes', 'required', 'string', 'max:100'],
            'recipient_name' => ['sometimes', 'required', 'string', 'max:255'],
            'whatsapp' => ['sometimes', 'required', 'string', 'max:30'],
            'address' => ['sometimes', 'required', 'string'],
            'district' => ['sometimes', 'required', 'string', 'max:100'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'province' => ['sometimes', 'required', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'required', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
