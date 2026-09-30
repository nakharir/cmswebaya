'use client';

import React from 'react';
import { ProductList } from '@/app/(full-page)/component/ecommerce/ProductList';

export default function AdminProdukPage() {
  return <ProductList basePath="/admin/produk" canCreate={true} canEdit={true} canDelete={true} />;
}
