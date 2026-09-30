'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
  FilterX,
  Layers,
  Image as LucideImage,
} from 'lucide-react';
import { EcommerceProduct, EcommerceCategory, ProductListParams } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { formatRupiah, getImageUrl, extractErrorMessage } from '@/app/api/ecommerce/client';
import { ProductDetailDialog } from './ProductDetailDialog';

interface ProductListProps {
  basePath: string; // e.g. '/admin/produk' or '/operator/produk'
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  basePath = '/admin/produk',
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const router = useRouter();
  const toast = useRef<Toast>(null);

  // Data States
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [categories, setCategories] = useState<EcommerceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination & Filters
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | number | null>(null);
  const [sortOption, setSortOption] = useState<string>('latest');
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);

  // Selected Product for Detail
  const [detailProduct, setDetailProduct] = useState<EcommerceProduct | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState<boolean>(false);

  // Selected Product for Delete
  const [productToDelete, setProductToDelete] = useState<EcommerceProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch categories for dropdown filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await ecommerceService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const params: ProductListParams = {
      page,
      per_page: rows,
      sort: sortOption,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (selectedCategory) {
      params.category = selectedCategory;
    }

    try {
      const response = await ecommerceService.getProducts(params);
      const dataList = response.data || [];
      setProducts(dataList);

      if (response.meta?.total !== undefined) {
        setTotalRecords(response.meta.total);
      } else {
        setTotalRecords(dataList.length);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      const message = extractErrorMessage(err);
      setErrorMsg(message);
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Memuat Produk',
        detail: message,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, rows, sortOption, search, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Search input with Enter key or button
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSortOption('latest');
    setPage(1);
  };

  const handlePageChange = (e: DataTableStateEvent) => {
    if (e.page !== undefined) {
      setPage(e.page + 1);
    }
    if (e.rows !== undefined) {
      setRows(e.rows);
    }
  };

  // Delete product action
  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await ecommerceService.deleteProduct(productToDelete.id);
      toast.current?.show({
        severity: 'success',
        summary: 'Produk Dihapus',
        detail: `Produk "${productToDelete.name}" telah dihapus.`,
        life: 3000,
      });
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Menghapus',
        detail: extractErrorMessage(err),
        life: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // View detail
  const handleOpenDetail = async (prod: EcommerceProduct) => {
    try {
      // Fetch full admin product detail to get images & all variants
      const full = await ecommerceService.getAdminProduct(prod.id);
      setDetailProduct(full);
    } catch {
      setDetailProduct(prod);
    }
    setShowDetailDialog(true);
  };

  // Sort Options
  const sortDropdownOptions = [
    { label: 'Terbaru', value: 'latest' },
    { label: 'Terlama', value: 'oldest' },
    { label: 'Harga: Termurah', value: 'price_asc' },
    { label: 'Harga: Termahal', value: 'price_desc' },
    { label: 'Nama: A - Z', value: 'name_asc' },
    { label: 'Nama: Z - A', value: 'name_desc' },
  ];

  const categoryFilterOptions = [
    { label: 'Semua Kategori', value: null },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  // Table Column Templates
  const imageBodyTemplate = (rowData: EcommerceProduct) => {
    const imageUrl = rowData.image;
    return (
      <div
        className="w-3rem h-3rem border-round overflow-hidden bg-white border-1 surface-border flex align-items-center justify-content-center cursor-pointer"
        onClick={() => handleOpenDetail(rowData)}
      >
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getImageUrl(imageUrl)}
            alt={rowData.name}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <LucideImage size={18} className="text-gray-400" />
        )}
      </div>
    );
  };

  const nameBodyTemplate = (rowData: EcommerceProduct) => {
    return (
      <div>
        <span
          className="font-bold text-sm text-gray-900 block cursor-pointer hover:underline"
          style={{ color: '#272329' }}
          onClick={() => handleOpenDetail(rowData)}
        >
          {rowData.name}
        </span>
        <span className="text-xs text-gray-500 font-mono">/{rowData.slug}</span>
      </div>
    );
  };

  const categoryBodyTemplate = (rowData: EcommerceProduct) => {
    return (
      <span
        className="px-2 py-1 text-xs font-semibold border-round inline-block"
        style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
      >
        {rowData.category?.name || 'Tanpa Kategori'}
      </span>
    );
  };

  const priceBodyTemplate = (rowData: EcommerceProduct) => {
    return (
      <span className="font-bold text-sm text-gray-800">
        {formatRupiah(rowData.base_price)}
      </span>
    );
  };

  const statusBodyTemplate = (rowData: EcommerceProduct) => {
    return (
      <Tag
        value={rowData.is_active ? 'Aktif' : 'Nonaktif'}
        severity={rowData.is_active ? 'success' : 'danger'}
        className="text-xs"
      />
    );
  };

  const variantBodyTemplate = (rowData: EcommerceProduct) => {
    const count = rowData.variants?.length || 0;
    if (count > 0) {
      return (
        <span className="text-xs font-semibold text-gray-700 flex align-items-center gap-1">
          <Layers size={13} style={{ color: '#D96C91' }} />
          {count} varian
        </span>
      );
    }
    return <span className="text-xs text-gray-400">Tunggal</span>;
  };

  const stockBodyTemplate = (rowData: EcommerceProduct) => {
    // Calculate total stock from variants if available, or rowData.stock for non-variant
    let totalStock = 0;
    if (rowData.variants && rowData.variants.length > 0) {
      totalStock = rowData.variants.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0
      );
    } else {
      totalStock = Number(rowData.stock) || 0;
    }

    const isZero = totalStock === 0;
    const isLow = totalStock > 0 && totalStock <= 5;

    return (
      <span
        className={`text-xs font-bold px-2 py-1 border-round ${
          isZero
            ? 'bg-red-100 text-red-700'
            : isLow
            ? 'bg-amber-100 text-amber-800'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {totalStock} pcs
      </span>
    );
  };

  const actionBodyTemplate = (rowData: EcommerceProduct) => {
    return (
      <div className="flex gap-1 justify-content-end">
        <Button
          type="button"
          icon={<Eye size={14} />}
          className="p-button-text p-button-sm p-button-secondary p-0 p-button-rounded"
          style={{ width: '32px', height: '32px' }}
          onClick={() => handleOpenDetail(rowData)}
          tooltip="Lihat Detail"
        />
        {canEdit && (
          <Button
            type="button"
            icon={<Edit2 size={14} />}
            className="p-button-text p-button-sm p-0 p-button-rounded"
            style={{ width: '32px', height: '32px', color: '#D96C91' }}
            onClick={() => router.push(`${basePath}/${rowData.id}/edit`)}
            tooltip="Edit Produk"
          />
        )}
        {canDelete && (
          <Button
            type="button"
            icon={<Trash2 size={14} />}
            className="p-button-text p-button-sm p-button-danger p-0 p-button-rounded"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setProductToDelete(rowData)}
            tooltip="Hapus Produk"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4">
      <Toast ref={toast} />

      {/* Header Banner */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div>
            <div className="flex align-items-center gap-2 mb-1">
              <Package size={24} style={{ color: '#D96C91' }} />
              <h1 className="text-2xl font-bold m-0" style={{ color: '#272329' }}>
                Katalog Produk KREZOEMA
              </h1>
              <span
                className="px-2 py-1 text-xs font-bold border-round"
                style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
              >
                {totalRecords} Total Produk
              </span>
            </div>
            <p className="text-sm m-0 text-gray-500">
              Kelola kerajinan handmade, harga dasar, variasi motif/ukuran, stok, dan galeri foto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              label="Segarkan"
              icon={<RefreshCw size={14} className={`mr-2 ${loading ? 'pi-spin' : ''}`} />}
              className="p-button-outlined p-button-secondary p-button-sm font-semibold"
              onClick={() => fetchProducts()}
              disabled={loading}
            />
            {canCreate && (
              <Link href={`${basePath}/create`} className="no-underline">
                <Button
                  label="Tambah Produk"
                  icon={<Plus size={16} className="mr-2" />}
                  className="p-button-sm font-semibold border-none"
                  style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
                />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card mb-4 p-3 border-round-xl">
        <form onSubmit={handleSearchSubmit}>
          <div className="grid align-items-center">
            {/* Search Input */}
            <div className="col-12 md:col-4">
              <div className="p-inputgroup">
                <InputText
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk, material, deskripsi..."
                  className="p-inputtext-sm"
                />
                <Button
                  type="submit"
                  icon={<Search size={15} />}
                  className="p-button-sm"
                  style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
                  tooltip="Cari"
                />
              </div>
            </div>

            {/* Category Dropdown Filter */}
            <div className="col-12 sm:col-6 md:col-3">
              <Dropdown
                value={selectedCategory}
                options={categoryFilterOptions}
                onChange={(e) => {
                  setSelectedCategory(e.value);
                  setPage(1);
                }}
                placeholder="Pilih Kategori"
                className="p-inputtext-sm w-full"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="col-12 sm:col-6 md:col-3">
              <Dropdown
                value={sortOption}
                options={sortDropdownOptions}
                onChange={(e) => {
                  setSortOption(e.value);
                  setPage(1);
                }}
                placeholder="Urutkan Produk"
                className="p-inputtext-sm w-full"
              />
            </div>

            {/* Reset Filters */}
            <div className="col-12 md:col-2 flex justify-content-end">
              {(search || selectedCategory || sortOption !== 'latest') && (
                <Button
                  type="button"
                  label="Reset Filter"
                  icon={<FilterX size={14} className="mr-1" />}
                  className="p-button-text p-button-sm p-button-secondary text-xs"
                  onClick={handleResetFilters}
                />
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Error Card if any */}
      {errorMsg && (
        <div className="card mb-4 p-3 bg-red-50 border-1 border-red-200 border-round flex align-items-center justify-content-between text-red-700">
          <div className="flex align-items-center gap-2 text-sm">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <Button
            type="button"
            label="Coba Lagi"
            icon="pi pi-refresh"
            className="p-button-sm p-button-outlined p-button-danger text-xs"
            onClick={fetchProducts}
          />
        </div>
      )}

      {/* Main DataTable */}
      <div className="card p-3 border-round-xl">
        <DataTable
          value={products}
          loading={loading}
          responsiveLayout="scroll"
          className="p-datatable-sm"
          emptyMessage={
            <div className="p-5 text-center">
              <Package size={40} className="text-gray-400 mb-2 opacity-60" />
              <h4 className="text-base font-bold text-gray-700 m-0 mb-1">
                Tidak ada produk ditemukan
              </h4>
              <p className="text-xs text-gray-500 m-0 mb-3">
                {search || selectedCategory
                  ? 'Tidak ada produk yang cocok dengan kriteria pencarian/filter Anda.'
                  : 'Belum ada produk yang tersimpan di katalog.'}
              </p>
              {(search || selectedCategory) && (
                <Button
                  type="button"
                  label="Hapus Filter Pencarian"
                  icon={<FilterX size={14} className="mr-1" />}
                  className="p-button-sm p-button-outlined"
                  style={{ borderColor: '#D96C91', color: '#D96C91' }}
                  onClick={handleResetFilters}
                />
              )}
            </div>
          }
          paginator
          lazy
          totalRecords={totalRecords}
          first={(page - 1) * rows}
          rows={rows}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={handlePageChange}
        >
          <Column
            header="No"
            body={(_, { rowIndex }) => (
              <span className="text-xs text-gray-500">
                {(page - 1) * rows + rowIndex + 1}
              </span>
            )}
            style={{ width: '50px' }}
          />
          <Column
            header="Foto"
            body={imageBodyTemplate}
            style={{ width: '65px' }}
          />
          <Column
            field="name"
            header="Nama Produk"
            body={nameBodyTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            field="category"
            header="Kategori"
            body={categoryBodyTemplate}
            style={{ width: '150px' }}
          />
          <Column
            field="material"
            header="Material"
            body={(row) => (
              <span className="text-xs text-gray-700">{row.material || '-'}</span>
            )}
            style={{ width: '130px' }}
          />
          <Column
            field="base_price"
            header="Harga Dasar"
            body={priceBodyTemplate}
            style={{ width: '120px' }}
          />
          <Column
            field="is_active"
            header="Status"
            body={statusBodyTemplate}
            style={{ width: '90px' }}
          />
          <Column
            header="Varian"
            body={variantBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column
            header="Total Stok"
            body={stockBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column
            header="Aksi"
            body={actionBodyTemplate}
            style={{ width: '110px', textAlign: 'right' }}
          />
        </DataTable>
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={detailProduct}
        visible={showDetailDialog}
        onHide={() => setShowDetailDialog(false)}
        onEdit={canEdit ? (id) => router.push(`${basePath}/${id}/edit`) : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        header="Konfirmasi Hapus Produk"
        visible={productToDelete !== null}
        style={{ width: '90vw', maxWidth: '440px' }}
        onHide={() => setProductToDelete(null)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Batal"
              icon="pi pi-times"
              className="p-button-text p-button-sm"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            />
            <Button
              type="button"
              label={isDeleting ? 'Menghapus...' : 'Hapus Produk'}
              icon="pi pi-trash"
              className="p-button-danger p-button-sm font-semibold"
              onClick={confirmDelete}
              disabled={isDeleting}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3 py-2">
          <AlertCircle size={32} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="m-0 text-sm font-semibold text-gray-800 mb-1">
              Apakah Anda yakin ingin menghapus produk ini?
            </p>
            <p className="m-0 text-xs text-gray-600">
              Produk <strong>&quot;{productToDelete?.name}&quot;</strong> beserta seluruh galeri
              gambar dan varian akan dihapus secara permanen dari server.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
