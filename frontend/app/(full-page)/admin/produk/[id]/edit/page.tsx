'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { EcommerceProduct } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { extractErrorMessage } from '@/app/api/ecommerce/client';
import { ProductForm } from '@/app/(full-page)/component/ecommerce/ProductForm';

export default function AdminProdukEditPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<EcommerceProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const productId = params?.id ? Number(params.id) : null;

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setErrorMsg('ID Produk tidak valid.');
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await ecommerceService.getAdminProduct(productId);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product for editing:', err);
        setErrorMsg(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center min-h-screen p-4">
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
        <p className="text-gray-600 text-sm mt-3 font-semibold">Memuat data produk...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="p-4">
        <div className="card p-5 text-center border-round-xl">
          <AlertCircle size={48} className="text-red-500 mb-3 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800 m-0 mb-2">Gagal Memuat Produk</h2>
          <p className="text-sm text-gray-600 m-0 mb-4">{errorMsg || 'Produk tidak ditemukan.'}</p>
          <Button
            type="button"
            label="Kembali ke Daftar Produk"
            icon={<ArrowLeft size={16} className="mr-2" />}
            className="p-button-sm font-semibold"
            style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
            onClick={() => router.push('/admin/produk')}
          />
        </div>
      </div>
    );
  }

  return <ProductForm mode="edit" initialData={product} baseRedirectPath="/admin/produk" />;
}
