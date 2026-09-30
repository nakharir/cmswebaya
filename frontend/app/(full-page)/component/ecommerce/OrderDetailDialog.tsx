'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  Package,
  User,
  MapPin,
  Clock,
  AlertCircle,
  Truck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { EcommerceOrder, EcommerceOrderItem, OrderStatus } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { formatRupiah, extractErrorMessage } from '@/app/api/ecommerce/client';

interface OrderDetailDialogProps {
  visible: boolean;
  order: EcommerceOrder | null;
  onHide: () => void;
  onOrderUpdated: (updated: EcommerceOrder) => void;
}

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: 'Menunggu Konfirmasi (Pending)', value: 'pending' },
  { label: 'Dikonfirmasi (Confirmed)', value: 'confirmed' },
  { label: 'Sedang Diproses (Processing)', value: 'processing' },
  { label: 'Sedang Dikirim (Shipped)', value: 'shipped' },
  { label: 'Selesai (Completed)', value: 'completed' },
  { label: 'Dibatalkan (Cancelled)', value: 'cancelled' },
];

export const getOrderStatusSeverity = (
  status: string
): 'warning' | 'info' | 'success' | 'danger' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'processing':
    case 'shipped':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'info';
  }
};

export const getOrderStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Menunggu Konfirmasi';
    case 'confirmed':
      return 'Dikonfirmasi';
    case 'processing':
      return 'Sedang Diproses';
    case 'shipped':
      return 'Sedang Dikirim';
    case 'completed':
      return 'Selesai';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({
  visible,
  order,
  onHide,
  onOrderUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setAdminNotes(order.notes || '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [order]);

  if (!order) return null;

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await ecommerceService.updateOrderStatus(
        order.id,
        selectedStatus,
        adminNotes
      );
      setSuccessMessage('Status pesanan berhasil diperbarui.');
      onOrderUpdated(updated);
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const headerElement = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pr-6">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-pink-600" />
        <span className="font-bold text-lg font-mono text-gray-800">
          {order.order_number}
        </span>
      </div>
      <Tag
        value={getOrderStatusLabel(order.status)}
        severity={getOrderStatusSeverity(order.status)}
        className="text-xs px-3 py-1 font-semibold"
      />
    </div>
  );

  return (
    <Dialog
      header={headerElement}
      visible={visible}
      style={{ width: '90vw', maxWidth: '850px' }}
      modal
      onHide={onHide}
      className="p-fluid"
    >
      <div className="space-y-6 pt-2">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Customer & Shipping Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info Card */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-200">
              <User className="w-4 h-4 text-pink-600" />
              <span>Informasi Pelanggan</span>
            </div>
            <div className="text-sm space-y-1 pt-1">
              <div>
                <span className="text-xs text-gray-500 block">Nama Akun</span>
                <span className="font-semibold text-gray-800">
                  {order.customer?.name || order.shipping_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Email</span>
                <span className="text-gray-700">
                  {order.customer?.email || '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">WhatsApp / Telepon</span>
                <span className="text-gray-700 font-mono text-xs">
                  {order.shipping_whatsapp || order.customer?.phone || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Info Card */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-200">
              <MapPin className="w-4 h-4 text-pink-600" />
              <span>Alamat Pengiriman</span>
            </div>
            <div className="text-sm space-y-1 pt-1">
              <div>
                <span className="text-xs text-gray-500 block">Penerima</span>
                <span className="font-semibold text-gray-800">
                  {order.shipping_name} ({order.shipping_whatsapp})
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Alamat Lengkap</span>
                <span className="text-gray-700 text-xs leading-relaxed block">
                  {order.shipping_address}, {order.shipping_kecamatan},{' '}
                  {order.shipping_city}, {order.shipping_province}{' '}
                  {order.shipping_postal_code}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Ekspedisi</span>
                <span className="font-medium text-gray-700 uppercase">
                  {order.shipping_method}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table Snapshot */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Package className="w-4 h-4 text-pink-600" />
              <span>Item Pesanan ({order.items?.length || 0})</span>
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(order.created_at).toLocaleString('id-ID')}
            </span>
          </div>

          <DataTable
            value={order.items || []}
            responsiveLayout="scroll"
            className="p-datatable-sm"
            emptyMessage="Tidak ada item dalam pesanan ini."
          >
            <Column
              header="Produk"
              body={(item: EcommerceOrderItem) => (
                <div>
                  <span className="font-semibold text-gray-800 block">
                    {item.product_name}
                  </span>
                  {item.variant_name && (
                    <span className="text-xs text-pink-600 font-medium">
                      Varian: {item.variant_name}
                    </span>
                  )}
                  {item.sku && (
                    <span className="text-[11px] text-gray-400 block font-mono">
                      SKU: {item.sku}
                    </span>
                  )}
                </div>
              )}
            />
            <Column
              header="Harga"
              body={(item: EcommerceOrderItem) => (
                <span className="text-xs font-mono text-gray-700">
                  {formatRupiah(item.unit_price)}
                </span>
              )}
            />
            <Column
              header="Qty"
              field="quantity"
              body={(item: EcommerceOrderItem) => (
                <span className="font-semibold text-xs text-gray-800">
                  × {item.quantity}
                </span>
              )}
              style={{ width: '80px', textAlign: 'center' }}
            />
            <Column
              header="Subtotal"
              body={(item: EcommerceOrderItem) => (
                <span className="text-xs font-bold font-mono text-gray-900">
                  {formatRupiah(item.subtotal)}
                </span>
              )}
              style={{ textAlign: 'right' }}
            />
          </DataTable>

          {/* Totals Summary */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col items-end space-y-1 text-sm">
            <div className="flex justify-between w-full sm:w-64 text-xs text-gray-600">
              <span>Subtotal Produk:</span>
              <span className="font-mono">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between w-full sm:w-64 text-xs text-gray-600">
              <span>Biaya Pengiriman:</span>
              <span className="font-mono">
                {order.shipping_cost > 0 ? formatRupiah(order.shipping_cost) : 'Rp 0'}
              </span>
            </div>
            <div className="flex justify-between w-full sm:w-64 text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span>Total Pesanan:</span>
              <span className="text-pink-600 font-mono text-base">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Notes if any */}
        {order.notes && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Catatan Pelanggan:</span>
            </div>
            <p className="text-amber-900 italic">&ldquo;{order.notes}&rdquo;</p>
          </div>
        )}

        {/* Status Update Section */}
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-pink-600" />
            <span>Ubah Status Pesanan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Status Baru
              </label>
              <Dropdown
                value={selectedStatus}
                options={STATUS_OPTIONS}
                onChange={(e) => setSelectedStatus(e.value)}
                placeholder="Pilih Status"
                className="w-full text-xs"
              />
            </div>

            <div>
              <Button
                label={isUpdating ? 'Menyimpan...' : 'Perbarui Status'}
                icon={isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                onClick={handleUpdateStatus}
                disabled={isUpdating || selectedStatus === order.status}
                className="w-full bg-pink-600 hover:bg-pink-700 border-none text-xs h-10"
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
