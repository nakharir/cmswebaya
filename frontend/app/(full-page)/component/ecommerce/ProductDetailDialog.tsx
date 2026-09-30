'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Package, Tags, Layers, Image as LucideImage, Edit, CheckCircle, XCircle } from 'lucide-react';
import { EcommerceProduct, EcommerceVariant } from '@/types/ecommerce';
import { formatRupiah, getImageUrl } from '@/app/api/ecommerce/client';

interface ProductDetailDialogProps {
  product: EcommerceProduct | null;
  visible: boolean;
  onHide: () => void;
  onEdit?: (id: number) => void;
}

export const ProductDetailDialog: React.FC<ProductDetailDialogProps> = ({
  product,
  visible,
  onHide,
  onEdit,
}) => {
  if (!product) return null;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : (product.stock ?? 0);

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2">
          <Package size={20} style={{ color: '#D96C91' }} />
          <span className="font-bold text-lg" style={{ color: '#272329' }}>
            Detail Produk: {product.name}
          </span>
          <Tag
            value={product.is_active ? 'Aktif' : 'Nonaktif'}
            severity={product.is_active ? 'success' : 'danger'}
            className="ml-2"
          />
        </div>
      }
      visible={visible}
      style={{ width: '95vw', maxWidth: '800px' }}
      onHide={onHide}
      footer={
        <div className="flex justify-content-between align-items-center">
          <span className="text-xs text-gray-500 font-mono">
            Slug: /{product.slug}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              label="Tutup"
              icon="pi pi-times"
              className="p-button-text p-button-sm"
              onClick={onHide}
            />
            {onEdit && (
              <Button
                type="button"
                label="Edit Produk Ini"
                icon={<Edit size={14} className="mr-1" />}
                className="p-button-sm font-semibold"
                style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
                onClick={() => {
                  onHide();
                  onEdit(product.id);
                }}
              />
            )}
          </div>
        </div>
      }
    >
      <div className="pt-2">
        {/* Info Grid */}
        <div className="grid mb-3">
          {/* Main Image */}
          <div className="col-12 md:col-4 flex flex-column align-items-center">
            <div
              className="border-1 surface-border border-round overflow-hidden bg-white w-full flex align-items-center justify-content-center p-2 mb-2"
              style={{ height: '220px' }}
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
                  <LucideImage size={40} className="mb-2 opacity-50" />
                  <p className="text-xs m-0">Tidak ada gambar</p>
                </div>
              )}
            </div>

            {/* Sub images preview */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto w-full p-1 surface-50 border-round">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="border-1 surface-border border-round overflow-hidden flex-shrink-0"
                    style={{
                      width: '45px',
                      height: '45px',
                      border: img.is_primary ? '2px solid #D96C91' : '1px solid #E5E7EB',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.alt_text || 'Produk'}
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="col-12 md:col-8">
            <div className="p-3 surface-50 border-round h-full">
              <div className="mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                  Nama Produk
                </span>
                <h3 className="m-0 text-xl font-bold" style={{ color: '#272329' }}>
                  {product.name}
                </h3>
              </div>

              <div className="grid">
                <div className="col-6 mb-2">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Kategori</span>
                  <div className="flex align-items-center gap-1">
                    <Tags size={14} style={{ color: '#B94F76' }} />
                    <span className="font-semibold text-sm text-gray-800">
                      {product.category?.name || 'Tanpa Kategori'}
                    </span>
                  </div>
                </div>

                <div className="col-6 mb-2">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Material</span>
                  <span className="font-semibold text-sm text-gray-800">
                    {product.material || '-'}
                  </span>
                </div>

                <div className="col-6 mb-2">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Harga Dasar</span>
                  <span className="font-bold text-lg" style={{ color: '#D96C91' }}>
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

              <div className="mt-2 pt-2 border-top-1 surface-border">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Deskripsi</span>
                <p className="text-xs text-gray-700 m-0 line-height-3 whitespace-pre-line">
                  {product.description || 'Tidak ada deskripsi produk.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Variants List */}
        <div className="surface-card border-round p-3 border-1 surface-border">
          <div className="flex align-items-center gap-2 mb-2">
            <Layers size={16} style={{ color: '#D96C91' }} />
            <h4 className="m-0 text-sm font-bold text-gray-900">
              Daftar Varian ({product.variants?.length || 0})
            </h4>
          </div>

          {product.variants && product.variants.length > 0 ? (
            <DataTable
              value={product.variants}
              className="p-datatable-sm"
              responsiveLayout="scroll"
            >
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
            <p className="text-xs text-gray-400 m-0 italic">
              Produk ini tidak memiliki varian tersendiri.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
};
