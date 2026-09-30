'use client';

import React from 'react';
import { ProductForm } from '@/app/(full-page)/component/ecommerce/ProductForm';

export default function EcommerceProductsCreatePage() {
  return <ProductForm mode="create" baseRedirectPath="/ecommerce/products" />;
}
