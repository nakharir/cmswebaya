'use client';

import React from 'react';
import { ProductList } from '../../component/ecommerce/ProductList';

export default function CustomerProdukPage() {
  return (
    <ProductList
      basePath="/customer/produk"
      canCreate={false}
      canEdit={false}
      canDelete={false}
      usePublicDetail={true}
    />
  );
}