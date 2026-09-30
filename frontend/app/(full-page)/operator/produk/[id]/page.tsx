'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  Package,
  Tags,
  Layers,
  Image as LucideImage,
  Edit2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { EcommerceProduct, EcommerceVariant } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { formatRupiah, getImageUrl, extractErrorMessage } from '@/app/api/ecommerce/client';

export default function OperatorProdukDetailPage() {
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
        console.error('Failed to load product detail:', err);
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
        <p className="text-gray-600 text-sm mt-3 font-semibold">Memuat detail produk...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="p-4">
        <div className="card p-5 text-center border-round-xl">
          <AlertCircle size={48} className="text-red-500 mb-3 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800 m-0 mb-2">Produk Tidak Ditemukan</h2>
          <p className="text-sm text-gray-600 m-0 mb-4">{errorMsg || 'Data tidak tersedia.'}</p>
          <Button
            type="button"
            label="Kembali ke Daftar Produk"
            icon={<ArrowLeft size={16} className="mr-2" />}
            className="p-button-sm font-semibold"
            style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
            onClick={() => router.push('/operator/produk')}
          />
        </div>
      </div>
    );
  }

  const totalStock =
    product.variants && product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : 0;

  return (
    <div className="p-2 md:p-4">
      {/* Header Bar */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div className="flex align-items-center gap-3">
            <Button
              type="button"
              icon={<ArrowLeft size={18} />}
              className="p-button-outlined p-button-secondary p-button-rounded"
              style={{ width: '40px', height: '40px' }}
              onClick={() => router.push('/operator/produk')}
              tooltip="Kembali"
            />
            <div>
              <div className="flex align-items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold m-0" style={{ color: '#272329' }}>
                  {product.name}
                </h1>
                <Tag
                  value={product.is_active ? 'Aktif' : 'Nonaktif'}
                  severity={product.is_active ? 'success' : 'danger'}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">Slug: /{product.slug}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              label="Edit Produk"
              icon={<Edit2 size={16} className="mr-2" />}
              className="p-button-sm font-semibold border-none"
              style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
              onClick={() => router.push(`/operator/produk/${product.id}/edit`)}
            />
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid">
        <div className="col-12 lg:col-5">
          {/* Gallery */}
          <div className="card p-4 mb-4 border-round-xl">
            <div
              className="w-full border-1 surface-border border-round overflow-hidden bg-white flex align-items-center justify-content-center p-3 mb-3"
              style={{ height: '300px' }}
            >
              {product.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <LucideImage size={48} className="mb-2 opacity-50" />
                  <p className="text-xs m-0">Tidak ada gambar produk</p>
                </div>
              )}
            </div>

            {product.images && product.images.length > 0 && (
              <div className="grid">
                {product.images.map((img) => (
                  <div key={img.id} className="col-3">
                    <div
                      className="border-round overflow-hidden bg-white cursor-pointer"
                      style={{
                        height: '60px',
                        border: img.is_primary ? '2px solid #D96C91' : '1px solid #E5E7EB',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Thumbnail"
                        className="w-full h-full"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 lg:col-7">
          <div className="card p-4 mb-4 border-round-xl">
            <h3 className="text-lg font-bold m-0 mb-3" style={{ color: '#272329' }}>
              Spesifikasi Produk
            </h3>

            <div className="grid mb-3">
              <div className="col-6 mb-2">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Kategori</span>
                <div className="flex align-items-center gap-1">
                  <Tags size={15} style={{ color: '#B94F76' }} />
                  <span className="font-bold text-sm text-gray-800">
                    {product.category?.name || 'Tanpa Kategori'}
                  </span>
                </div>
              </div>

              <div className="col-6 mb-2">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Material / Bahan</span>
                <span className="font-bold text-sm text-gray-800">{product.material || '-'}</span>
              </div>

              <div className="col-6 mb-2">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Harga Dasar</span>
                <span className="font-extrabold text-xl" style={{ color: '#D96C91' }}>
                  {formatRupiah(product.base_price)}
                </span>
              </div>

              <div className="col-6 mb-2">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Total Stok</span>
                <span className="font-bold text-base text-gray-800">
                  {totalStock > 0 ? `${totalStock} pcs` : 'Tergantung varian'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-top-1 surface-border">
              <span className="text-xs font-semibold text-gray-500 block mb-1">Deskripsi</span>
              <p className="text-sm text-gray-700 m-0 line-height-3 whitespace-pre-line">
                {product.description || 'Tidak ada deskripsi.'}
              </p>
            </div>
          </div>

          {/* Variants */}
          <div className="card p-4 border-round-xl">
            <div className="flex align-items-center gap-2 mb-3">
              <Layers size={18} style={{ color: '#D96C91' }} />
              <h3 className="text-base font-bold m-0 text-gray-900">
                Daftar Varian ({product.variants?.length || 0})
              </h3>
            </div>

            {product.variants && product.variants.length > 0 ? (
              <DataTable value={product.variants} className="p-datatable-sm" responsiveLayout="scroll">
                <Column
                  field="sku"
                  header="SKU"
                  body={(row) => <span className="font-mono text-xs">{row.sku || '-'}</span>}
                />
                <Column
                  field="name"
                  header="Nama Varian"
                  body={(row) => <span className="font-semibold text-xs">{row.name}</span>}
                />
                <Column
                  header="Harga"
                  body={(row: EcommerceVariant) => (
                    <span className="text-xs font-medium">
                      {row.price !== null && row.price !== undefined
                        ? formatRupiah(row.price)
                        : `${formatRupiah(product.base_price)} (dasar)`}
                    </span>
                  )}
                />
                <Column
                  field="stock"
                  header="Stok"
                  body={(row) => <span className="font-bold text-xs">{row.stock} pcs</span>}
                />
                <Column
                  header="Status"
                  body={(row) => (
                    <span className="text-xs flex align-items-center gap-1">
                      {row.is_active ? (
                        <>
                          <CheckCircle size={12} className="text-green-600" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle size={12} className="text-red-500" /> Nonaktif
                        </>
                      )}
                    </span>
                  )}
                />
              </DataTable>
            ) : (
              <p className="text-xs text-gray-400 m-0 italic">Produk tidak memiliki varian khusus.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
