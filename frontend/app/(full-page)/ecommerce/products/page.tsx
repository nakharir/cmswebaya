'use client';

import React from 'react';
import { ProductList } from '@/app/(full-page)/component/ecommerce/ProductList';

export default function EcommerceProductsPage() {
  return <ProductList basePath="/ecommerce/products" canCreate={true} canEdit={true} canDelete={true} />;
}
