'use client';

import React from 'react';
import { ProductList } from '@/app/(full-page)/component/ecommerce/ProductList';

export default function OperatorProdukPage() {
  return <ProductList basePath="/operator/produk" canCreate={true} canEdit={true} canDelete={true} />;
}
