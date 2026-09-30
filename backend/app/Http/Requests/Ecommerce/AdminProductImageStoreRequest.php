<?php

namespace App\Http\Requests\Ecommerce;

use Illuminate\Foundation\Http\FormRequest;

class AdminProductImageStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120', // 5 MB max
            ],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'is_primary' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'File gambar wajib diunggah.',
            'image.file' => 'File yang diunggah tidak valid.',
            'image.image' => 'Format gambar tidak didukung.',
            'image.mimes' => 'Format gambar tidak didukung. Format yang diizinkan: JPG, JPEG, PNG, WEBP.',
            'image.max' => 'Ukuran gambar maksimal 5 MB.',
        ];
    }
}
