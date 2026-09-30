'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import {
  Package,
  CheckCircle2,
  Tags,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  Plus,
  ArrowRight,
  RefreshCw,
  Image as LucideImage,
} from 'lucide-react';
import { EcommerceProduct, EcommerceCategory } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { formatRupiah, getImageUrl } from '@/app/api/ecommerce/client';

interface StockAlertItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  status: 'Habis' | 'Kritis';
  recommendation: string;
}

const DashboardOperator = () => {
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [categories, setCategories] = useState<EcommerceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    criticalStock: 0,
    outOfStock: 0,
  });
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.allSettled([
        ecommerceService.getProducts({ per_page: 50, sort: 'latest' }),
        ecommerceService.getCategories(),
      ]);

      const productList: EcommerceProduct[] =
        productsRes.status === 'fulfilled' ? productsRes.value.data || [] : [];
      const categoryList: EcommerceCategory[] =
        categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];

      setProducts(productList);
      setCategories(categoryList);

      const totalCount =
        productsRes.status === 'fulfilled' && productsRes.value.meta?.total !== undefined
          ? productsRes.value.meta.total
          : productList.length;

      const activeCount = productList.filter((p) => p.is_active).length;
      const totalCats = categoryList.length;

      let critical = 0;
      let outOfStock = 0;
      const alerts: StockAlertItem[] = [];

      productList.forEach((prod) => {
        let prodTotalStock = 0;
        let hasVariants = false;

        if (prod.variants && prod.variants.length > 0) {
          hasVariants = true;
          prodTotalStock = prod.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        }

        if (hasVariants) {
          if (prodTotalStock === 0) {
            outOfStock++;
            alerts.push({
              id: prod.id,
              sku: prod.variants?.[0]?.sku || `KZ-${prod.id}`,
              name: prod.name,
              category: prod.category?.name || 'Handmade Craft',
              stock: 0,
              minStock: 5,
              status: 'Habis',
              recommendation: `Stok varian habis. Segera produksi ulang karya "${prod.name}".`,
            });
          } else if (prodTotalStock <= 5) {
            critical++;
            alerts.push({
              id: prod.id,
              sku: prod.variants?.[0]?.sku || `KZ-${prod.id}`,
              name: prod.name,
              category: prod.category?.name || 'Handmade Craft',
              stock: prodTotalStock,
              minStock: 5,
              status: 'Kritis',
              recommendation: `Sisa ${prodTotalStock} pcs. Jadwalkan pengerjaan bahan ${prod.material || 'craft'}.`,
            });
          }
        }
      });

      setStats({
        totalProducts: totalCount,
        activeProducts: activeCount,
        totalCategories: totalCats,
        criticalStock: critical,
        outOfStock: outOfStock,
      });

      setStockAlerts(alerts);
    } catch (err) {
      console.error('Failed to load operator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="p-2 md:p-4">
      {/* 🌟 Header Section */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div>
            <div className="flex align-items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold m-0" style={{ color: '#272329' }}>
                Dashboard Operator KREZOEMA
              </h1>
              <span
                className="px-2 py-1 text-xs font-bold border-round"
                style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
              >
                Panel Operator
              </span>
            </div>
            <p className="text-sm m-0" style={{ color: '#6B7280' }}>
              Creative Craft &amp; Handmade Accessories &bull;{' '}
              <span className="italic" style={{ color: '#B94F76' }}>
                &ldquo;Dari kreativitas menjadi karya, dari karya menjadi identitas.&rdquo;
              </span>
            </p>
          </div>

          {/* Quick Access Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              label="Segarkan Data"
              icon={<RefreshCw size={14} className={`mr-2 ${loading ? 'pi-spin' : ''}`} />}
              className="p-button-sm p-button-outlined font-semibold"
              style={{ borderColor: '#D96C91', color: '#D96C91' }}
              onClick={loadDashboardData}
              disabled={loading}
            />
            <Link href="/operator/produk/create" className="no-underline">
              <Button
                label="Tambah Produk"
                icon={<Plus size={16} className="mr-2" />}
                className="p-button-sm border-none font-semibold"
                style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
              />
            </Link>
            <Link href="/operator/produk" className="no-underline">
              <Button
                label="Kelola Produk"
                icon={<Package size={16} className="mr-2" />}
                className="p-button-sm p-button-outlined font-semibold"
                style={{ borderColor: '#6B7280', color: '#374151' }}
              />
            </Link>
            <Link href="/operator/kategori" className="no-underline">
              <Button
                label="Kategori"
                icon={<Tags size={16} className="mr-2" />}
                className="p-button-sm p-button-outlined font-semibold"
                style={{ borderColor: '#6B7280', color: '#374151' }}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 Metrics Summary Cards */}
      <div className="grid mb-4">
        {/* Total Produk */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #D96C91' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Total Produk</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#F8E4EB', color: '#D96C91' }}
              >
                <Package size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#272329' }}>
                {loading ? '...' : stats.totalProducts}
              </div>
              <span className="text-xs font-medium text-gray-500">
                {stats.totalCategories} Kategori terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Produk Aktif */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #10B981' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Produk Aktif</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#DCFCE7', color: '#10B981' }}
              >
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#272329' }}>
                {loading ? '...' : stats.activeProducts}
              </div>
              <span className="text-xs font-medium text-green-700">Tampil di katalog</span>
            </div>
          </div>
        </div>

        {/* Total Kategori */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #8B5CF6' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Total Kategori</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#EDE9FE', color: '#8B5CF6' }}
              >
                <Tags size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#272329' }}>
                {loading ? '...' : stats.totalCategories}
              </div>
              <span className="text-xs font-medium text-gray-500">Craft &amp; Aksesoris</span>
            </div>
          </div>
        </div>

        {/* Stok Kritis */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #F59E0B' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Stok Kritis</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}
              >
                <AlertTriangle size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#D97706' }}>
                {loading ? '...' : stats.criticalStock}
              </div>
              <span className="text-xs font-medium text-amber-700">Stok &le; 5 item</span>
            </div>
          </div>
        </div>

        {/* Stok Habis */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #EF4444' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Stok Habis</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <AlertCircle size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#DC2626' }}>
                {loading ? '...' : stats.outOfStock}
              </div>
              <span className="text-xs font-medium text-red-700">Perlu restock</span>
            </div>
          </div>
        </div>

        {/* Pesanan */}
        <div className="col-12 sm:col-6 lg:col-2">
          <div
            className="card p-3 h-full flex flex-column justify-content-between"
            style={{ borderLeft: '4px solid #9CA3AF' }}
          >
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Pesanan</span>
              <div
                className="p-2 border-round"
                style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
              >
                <ShoppingCart size={18} />
              </div>
            </div>
            <div>
              <span
                className="px-2 py-1 text-xs font-bold border-round inline-block"
                style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
              >
                Segera Hadir
              </span>
              <div className="text-xs font-medium text-gray-400 mt-1">Stage berikutnya</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 Section: Produk Terbaru dari Real API */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="text-xl font-bold m-0" style={{ color: '#272329' }}>
              Produk Terbaru
            </h2>
            <p className="text-xs text-gray-500 m-0">
              Daftar kerajinan dan aksesoris handmade terbaru terdaftar dari katalog server
            </p>
          </div>
          <Link href="/operator/produk" className="no-underline">
            <Button
              label="Lihat Semua Produk"
              icon={<ArrowRight size={14} className="ml-1" />}
              iconPos="right"
              className="p-button-text p-button-sm font-semibold"
              style={{ color: '#B94F76' }}
            />
          </Link>
        </div>

        <DataTable
          value={products.slice(0, 6)}
          loading={loading}
          responsiveLayout="scroll"
          className="p-datatable-sm"
          emptyMessage="Belum ada data produk"
        >
          <Column
            header="Foto"
            body={(row: EcommerceProduct) => (
              <div className="w-2rem h-2rem border-round overflow-hidden bg-white border-1 surface-border flex align-items-center justify-content-center">
                {row.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getImageUrl(row.image)}
                    alt={row.name}
                    className="w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <LucideImage size={14} className="text-gray-400" />
                )}
              </div>
            )}
            style={{ width: '50px' }}
          />
          <Column
            field="name"
            header="Nama Produk"
            body={(row: EcommerceProduct) => (
              <div>
                <Link
                  href={`/operator/produk/${row.id}`}
                  className="font-semibold no-underline hover:underline block"
                  style={{ color: '#272329' }}
                >
                  {row.name}
                </Link>
                <span className="text-xs text-gray-500 font-mono">/{row.slug}</span>
              </div>
            )}
          />
          <Column
            field="category"
            header="Kategori"
            body={(row: EcommerceProduct) => (
              <span
                className="px-2 py-1 text-xs font-semibold border-round inline-block"
                style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
              >
                {row.category?.name || 'Tanpa Kategori'}
              </span>
            )}
          />
          <Column
            field="base_price"
            header="Harga"
            body={(row: EcommerceProduct) => (
              <span className="font-semibold text-gray-800">{formatRupiah(row.base_price)}</span>
            )}
          />
          <Column
            header="Total Stok"
            body={(row: EcommerceProduct) => {
              const stock =
                row.variants && row.variants.length > 0
                  ? row.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                  : 0;
              const isZero = stock === 0;
              const isLow = stock > 0 && stock <= 5;
              return (
                <span
                  className={`font-bold text-xs px-2 py-1 border-round ${
                    isZero
                      ? 'bg-red-100 text-red-700'
                      : isLow
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-gray-800'
                  }`}
                >
                  {stock} pcs
                </span>
              );
            }}
          />
          <Column
            field="is_active"
            header="Status"
            body={(row: EcommerceProduct) => (
              <Tag
                value={row.is_active ? 'Aktif' : 'Nonaktif'}
                severity={row.is_active ? 'success' : 'danger'}
                className="text-xs"
              />
            )}
          />
        </DataTable>
      </div>

      {/* ⚠️ Section: Monitoring Stok dari Real Data */}
      <div className="card p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center justify-content-between mb-3 gap-2">
          <div>
            <div className="flex align-items-center gap-2">
              <h2 className="text-xl font-bold m-0" style={{ color: '#272329' }}>
                Monitoring Stok
              </h2>
              <span
                className="px-2 py-0 text-xs font-bold border-round"
                style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
              >
                {stockAlerts.length} Perhatian
              </span>
            </div>
            <p className="text-xs text-gray-500 m-0">
              Pantau produk yang berada di bawah ambang batas minimal stok
            </p>
          </div>

          <div className="flex gap-2 text-xs font-medium">
            <span
              className="px-2 py-1 border-round flex align-items-center gap-1"
              style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
            >
              &bull; Aman: {Math.max(0, stats.totalProducts - stats.criticalStock - stats.outOfStock)} item
            </span>
            <span
              className="px-2 py-1 border-round flex align-items-center gap-1"
              style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
            >
              &bull; Kritis: {stats.criticalStock} item
            </span>
            <span
              className="px-2 py-1 border-round flex align-items-center gap-1"
              style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
            >
              &bull; Habis: {stats.outOfStock} item
            </span>
          </div>
        </div>

        <DataTable
          value={stockAlerts}
          loading={loading}
          responsiveLayout="scroll"
          className="p-datatable-sm"
          emptyMessage="Seluruh produk memiliki stok yang memadai."
        >
          <Column field="sku" header="SKU / ID" style={{ width: '110px' }} />
          <Column
            field="name"
            header="Produk"
            body={(row: StockAlertItem) => (
              <Link
                href={`/operator/produk/${row.id}`}
                className="font-semibold text-gray-900 no-underline hover:underline"
              >
                {row.name}
              </Link>
            )}
          />
          <Column field="category" header="Kategori" />
          <Column
            field="stock"
            header="Sisa Stok"
            body={(row: StockAlertItem) => (
              <span
                className={`font-bold ${
                  row.stock === 0 ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                {row.stock} / {row.minStock} pcs
              </span>
            )}
            style={{ width: '120px' }}
          />
          <Column
            field="status"
            header="Status"
            body={(row: StockAlertItem) => (
              <span
                className={`px-2 py-1 text-xs font-bold border-round ${
                  row.status === 'Habis'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {row.status}
              </span>
            )}
            style={{ width: '100px' }}
          />
          <Column
            field="recommendation"
            header="Catatan &amp; Rekomendasi"
            body={(row: StockAlertItem) => (
              <span className="text-xs text-gray-700">{row.recommendation}</span>
            )}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default DashboardOperator;
