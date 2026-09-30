'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Truck,
  Filter,
} from 'lucide-react';
import { EcommerceOrder } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { formatRupiah, extractErrorMessage } from '@/app/api/ecommerce/client';
import {
  OrderDetailDialog,
  getOrderStatusLabel,
  getOrderStatusSeverity,
  getPaymentStatusLabel,
  getPaymentStatusSeverity,
} from './OrderDetailDialog';

interface OrderListProps {
  basePath?: string;
}

const STATUS_FILTER_OPTIONS = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu Konfirmasi', value: 'pending' },
  { label: 'Dikonfirmasi', value: 'confirmed' },
  { label: 'Sedang Diproses', value: 'processing' },
  { label: 'Sedang Dikirim', value: 'shipped' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

export const OrderList: React.FC<OrderListProps> = ({ basePath = '/admin/pesanan' }) => {
  const toast = useRef<Toast>(null);

  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Detail Dialog State
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await ecommerceService.getOrders({
        search: search.trim() || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page,
        per_page: perPage,
      });

      setOrders(response.data || []);
      setTotalRecords(response.meta?.total || response.data?.length || 0);
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus, page, perPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderUpdated = (updated: EcommerceOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o))
    );
    setSelectedOrder(updated);
    toast.current?.show({
      severity: 'success',
      summary: 'Status Diperbarui',
      detail: `Pesanan ${updated.order_number} berhasil diperbarui menjadi ${getOrderStatusLabel(updated.status)}.`,
      life: 3000,
    });
  };

  const openOrderDetail = (order: EcommerceOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-1">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-pink-600" />
        <span className="font-bold text-lg text-gray-800">Daftar Pesanan</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="w-44">
          <Dropdown
            value={selectedStatus}
            options={STATUS_FILTER_OPTIONS}
            onChange={(e) => {
              setSelectedStatus(e.value);
              setPage(1);
            }}
            className="w-full text-xs"
          />
        </div>

        {/* Search Bar */}
        <div className="p-input-icon-left w-56">
          <i className="pi pi-search text-gray-400" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchOrders();
              }
            }}
            placeholder="Cari order / nama / WA..."
            className="w-full text-xs h-9"
          />
        </div>

        {/* Refresh Button */}
        <Button
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => fetchOrders()}
          className="p-button-outlined p-button-secondary text-xs h-9"
          tooltip="Segarkan Data"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border border-gray-200 rounded-xl p-4 bg-white">
      <Toast ref={toast} />

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <DataTable
        value={orders}
        header={header}
        loading={loading}
        dataKey="id"
        paginator
        rows={perPage}
        totalRecords={totalRecords}
        lazy
        first={(page - 1) * perPage}
        onPage={(e) => {
          setPage((e.page ?? 0) + 1);
          setPerPage(e.rows);
        }}
        rowsPerPageOptions={[10, 20, 50]}
        responsiveLayout="scroll"
        className="p-datatable-sm"
        emptyMessage="Belum ada pesanan yang sesuai."
      >
        <Column
          field="order_number"
          header="No. Pesanan"
          body={(row: EcommerceOrder) => (
            <button
              type="button"
              onClick={() => openOrderDetail(row)}
              className="font-mono font-bold text-pink-600 hover:text-pink-800 hover:underline text-left cursor-pointer"
            >
              {row.order_number}
            </button>
          )}
          style={{ width: '190px' }}
        />

        <Column
          header="Pelanggan"
          body={(row: EcommerceOrder) => (
            <div>
              <span className="font-semibold text-gray-800 block text-xs">
                {row.shipping_name}
              </span>
              <span className="text-[11px] text-gray-500 font-mono block">
                {row.shipping_whatsapp}
              </span>
            </div>
          )}
        />

        <Column
          header="Pengiriman"
          body={(row: EcommerceOrder) => (
            <div>
              <span className="text-xs uppercase font-bold text-gray-700 block">
                {row.shipping_method}
              </span>
              <span className="text-[11px] text-gray-500 block truncate max-w-[150px]">
                {row.shipping_city}
              </span>
            </div>
          )}
          style={{ width: '140px' }}
        />

        <Column
          header="Item"
          body={(row: EcommerceOrder) => (
            <span className="text-xs text-gray-700">
              {row.items?.length || 0} item
            </span>
          )}
          style={{ width: '80px', textAlign: 'center' }}
        />

        <Column
          field="total"
          header="Total"
          body={(row: EcommerceOrder) => (
            <span className="font-mono font-bold text-xs text-gray-900">
              {formatRupiah(row.total)}
            </span>
          )}
          style={{ width: '130px' }}
        />

        <Column
          field="status"
          header="Status"
          body={(row: EcommerceOrder) => (
            <Tag
              value={getOrderStatusLabel(row.status)}
              severity={getOrderStatusSeverity(row.status)}
              className="text-[11px] px-2.5 py-0.5"
            />
          )}
          style={{ width: '140px' }}
        />

        <Column
          field="payment_status"
          header="Pembayaran"
          body={(row: EcommerceOrder) => (
            <Tag
              value={getPaymentStatusLabel(row.payment_status || 'unpaid')}
              severity={getPaymentStatusSeverity(row.payment_status || 'unpaid')}
              className="text-[11px] px-2.5 py-0.5"
            />
          )}
          style={{ width: '140px' }}
        />

        <Column
          field="created_at"
          header="Tanggal"
          body={(row: EcommerceOrder) => (
            <span className="text-[11px] text-gray-500">
              {new Date(row.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          style={{ width: '110px' }}
        />

        <Column
          header="Aksi"
          body={(row: EcommerceOrder) => (
            <Button
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Detail"
              onClick={() => openOrderDetail(row)}
              className="p-button-sm p-button-outlined p-button-secondary text-xs h-8"
            />
          )}
          style={{ width: '100px', textAlign: 'center' }}
        />
      </DataTable>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        visible={isDetailOpen}
        order={selectedOrder}
        onHide={() => setIsDetailOpen(false)}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};
