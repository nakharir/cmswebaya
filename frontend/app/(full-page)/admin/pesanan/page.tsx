'use client';

import React from 'react';
import { OrderList } from '@/app/(full-page)/component/ecommerce/OrderList';

export default function AdminPesananPage() {
  return <OrderList basePath="/admin/pesanan" />;
}
