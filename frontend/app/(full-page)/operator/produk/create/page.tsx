'use client';

import React from 'react';
import { ProductForm } from '@/app/(full-page)/component/ecommerce/ProductForm';

export default function OperatorProdukCreatePage() {
  return <ProductForm mode="create" baseRedirectPath="/operator/produk" />;
}
