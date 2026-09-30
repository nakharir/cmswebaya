'use client';

import React from 'react';
import { ProductForm } from '@/app/(full-page)/component/ecommerce/ProductForm';

export default function AdminProdukCreatePage() {
  return <ProductForm mode="create" baseRedirectPath="/admin/produk" />;
}
