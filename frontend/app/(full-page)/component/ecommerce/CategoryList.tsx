'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tags, Search, RefreshCw, AlertCircle, Info, Package, Plus, Edit2, Trash2 } from 'lucide-react';
import { EcommerceCategory, CategoryCreatePayload, CategoryUpdatePayload } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { extractErrorMessage } from '@/app/api/ecommerce/client';

export const CategoryList: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [categories, setCategories] = useState<EcommerceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<EcommerceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<EcommerceCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Prioritize admin endpoint to get accurate products_count
      const data = await ecommerceService.getAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      const msg = extractErrorMessage(err);
      setErrorMsg(msg);
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Memuat Kategori',
        detail: msg,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Create Dialog
  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormSortOrder(categories.length);
    setFormIsActive(true);
    setIsSlugManuallyEdited(false);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const openEditDialog = (category: EcommerceCategory) => {
    setDialogMode('edit');
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || '');
    setFormSortOrder(category.sort_order ?? 0);
    setFormIsActive(category.is_active ?? true);
    setIsSlugManuallyEdited(true);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Handle Name Change with Auto-slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormName(val);
    if (!isSlugManuallyEdited && dialogMode === 'create') {
      setFormSlug(slugify(val));
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    const finalSlug = formSlug.trim() ? slugify(formSlug.trim()) : slugify(formName.trim());
    if (!finalSlug) {
      setFormError('Slug kategori tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (dialogMode === 'create') {
        const payload: CategoryCreatePayload = {
          name: formName.trim(),
          slug: finalSlug,
          description: formDescription.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        };

        const created = await ecommerceService.createCategory(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Kategori Berhasil Dibuat',
          detail: `Kategori "${created.name}" telah ditambahkan.`,
          life: 3000,
        });
      } else if (dialogMode === 'edit' && editingCategory) {
        const payload: CategoryUpdatePayload = {
          name: formName.trim(),
          slug: finalSlug,
          description: formDescription.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        };

        const updated = await ecommerceService.updateCategory(editingCategory.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Kategori Diperbarui',
          detail: `Perubahan untuk "${updated.name}" berhasil disimpan.`,
          life: 3000,
        });
      }

      setIsDialogOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      const msg = extractErrorMessage(err);
      setFormError(msg);
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Menyimpan',
        detail: msg,
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const openDeleteConfirm = (category: EcommerceCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Handle Delete Action
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    if (categoryToDelete.products_count && categoryToDelete.products_count > 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Tidak Dapat Dihapus',
        detail: `Kategori masih digunakan oleh ${categoryToDelete.products_count} produk.`,
        life: 4000,
      });
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await ecommerceService.deleteCategory(categoryToDelete.id);
      toast.current?.show({
        severity: 'success',
        summary: 'Kategori Dihapus',
        detail: `Kategori "${categoryToDelete.name}" berhasil dihapus.`,
        life: 3000,
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      const msg = extractErrorMessage(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Menghapus Kategori',
        detail: msg,
        life: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side search filtering
  const filteredCategories = categories.filter((cat) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term) ||
      (cat.description && cat.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-2 md:p-4">
      <Toast ref={toast} />

      {/* Header Card */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div>
            <div className="flex align-items-center gap-2 mb-1">
              <Tags size={24} style={{ color: '#D96C91' }} />
              <h1 className="text-2xl font-bold m-0" style={{ color: '#272329' }}>
                Kategori Produk KREZOEMA
              </h1>
              <span
                className="px-2 py-1 text-xs font-bold border-round"
                style={{ backgroundColor: '#EDE9FE', color: '#8B5CF6' }}
              >
                {categories.length} Kategori
              </span>
            </div>
            <p className="text-sm m-0 text-gray-500">
              Kelola klasifikasi kerajinan tangan, aksesoris handmade, dan bahan karya kreatif.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              label="Segarkan"
              icon={<RefreshCw size={14} className={`mr-2 ${loading ? 'pi-spin' : ''}`} />}
              className="p-button-outlined p-button-secondary p-button-sm font-semibold"
              onClick={fetchCategories}
              disabled={loading}
            />
            <Button
              type="button"
              label="Tambah Kategori"
              icon={<Plus size={16} className="mr-1" />}
              className="p-button-sm font-semibold border-none"
              style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
              onClick={openCreateDialog}
            />
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div
        className="card mb-4 p-3 border-round-xl flex align-items-center gap-3"
        style={{ backgroundColor: '#FAF8F5', border: '1px solid #F8E4EB' }}
      >
        <div
          className="p-2 border-round flex align-items-center justify-content-center"
          style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
        >
          <Info size={18} />
        </div>
        <div>
          <span className="text-xs font-bold block" style={{ color: '#272329' }}>
            Manajemen Kategori Terpadu
          </span>
          <span className="text-xs text-gray-600">
            Kategori yang ditambahkan atau diubah di sini akan otomatis tampil pada formulir produk dan filter katalog di etalase publik KREZOEMA.
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card mb-4 p-3 border-round-xl">
        <div className="grid align-items-center">
          <div className="col-12 md:col-5">
            <div className="p-inputgroup">
              <InputText
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kategori, slug, deskripsi..."
                className="p-inputtext-sm"
              />
              <Button
                type="button"
                icon={<Search size={15} />}
                className="p-button-sm"
                style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
              />
            </div>
          </div>
          {search && (
            <div className="col-12 md:col-3">
              <Button
                type="button"
                label="Hapus Pencarian"
                className="p-button-text p-button-sm text-xs p-button-secondary"
                onClick={() => setSearch('')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
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
            onClick={fetchCategories}
          />
        </div>
      )}

      {/* Categories DataTable */}
      <div className="card p-3 border-round-xl">
        <DataTable
          value={filteredCategories}
          loading={loading}
          responsiveLayout="scroll"
          className="p-datatable-sm"
          emptyMessage={
            <div className="p-5 text-center">
              <Tags size={36} className="text-gray-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-gray-700 m-0">
                {search ? 'Tidak ada kategori yang sesuai pencarian.' : 'Belum ada kategori tersedia.'}
              </p>
            </div>
          }
        >
          <Column
            header="No"
            body={(_, { rowIndex }) => (
              <span className="text-xs text-gray-500">{rowIndex + 1}</span>
            )}
            style={{ width: '50px' }}
          />
          <Column
            field="name"
            header="Nama Kategori"
            body={(row: EcommerceCategory) => (
              <div>
                <span className="font-bold text-sm text-gray-900 block">{row.name}</span>
                <span className="text-xs text-gray-500 font-mono">slug: {row.slug}</span>
              </div>
            )}
          />
          <Column
            field="description"
            header="Deskripsi"
            body={(row: EcommerceCategory) => (
              <span className="text-xs text-gray-700 line-height-2">
                {row.description || '-'}
              </span>
            )}
          />
          <Column
            field="products_count"
            header="Jumlah Produk"
            body={(row: EcommerceCategory) => {
              const count = row.products_count ?? 0;
              return (
                <span
                  className="px-2 py-1 text-xs font-bold border-round inline-flex align-items-center gap-1"
                  style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
                >
                  <Package size={12} />
                  {count} produk
                </span>
              );
            }}
            style={{ width: '140px' }}
          />
          <Column
            field="sort_order"
            header="Urutan"
            body={(row: EcommerceCategory) => (
              <span className="text-xs text-gray-600 font-semibold">{row.sort_order}</span>
            )}
            style={{ width: '80px' }}
          />
          <Column
            field="is_active"
            header="Status"
            body={(row: EcommerceCategory) => (
              <Tag
                value={row.is_active ? 'Aktif' : 'Nonaktif'}
                severity={row.is_active ? 'success' : 'danger'}
                className="text-xs"
              />
            )}
            style={{ width: '90px' }}
          />
          <Column
            header="Aksi"
            body={(row: EcommerceCategory) => (
              <div className="flex gap-1">
                <Button
                  type="button"
                  icon={<Edit2 size={13} />}
                  className="p-button-text p-button-sm p-button-info p-0 p-button-rounded"
                  style={{ width: '30px', height: '30px' }}
                  onClick={() => openEditDialog(row)}
                  tooltip="Edit Kategori"
                />
                <Button
                  type="button"
                  icon={<Trash2 size={13} />}
                  className="p-button-text p-button-sm p-button-danger p-0 p-button-rounded"
                  style={{ width: '30px', height: '30px' }}
                  onClick={() => openDeleteConfirm(row)}
                  tooltip={
                    (row.products_count ?? 0) > 0
                      ? 'Kategori sedang digunakan oleh produk'
                      : 'Hapus Kategori'
                  }
                  disabled={(row.products_count ?? 0) > 0}
                />
              </div>
            )}
            style={{ width: '90px' }}
          />
        </DataTable>
      </div>

      {/* Dialog Form Tambah / Edit Kategori */}
      <Dialog
        header={dialogMode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori Produk'}
        visible={isDialogOpen}
        style={{ width: '95vw', maxWidth: '520px' }}
        onHide={() => setIsDialogOpen(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Batal"
              icon="pi pi-times"
              className="p-button-text p-button-sm"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              label={isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
              icon={
                isSubmitting ? (
                  <ProgressSpinner
                    style={{ width: '14px', height: '14px' }}
                    strokeWidth="4"
                    className="mr-2"
                  />
                ) : (
                  'pi pi-check'
                )
              }
              className="p-button-sm border-none font-semibold"
              style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            />
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="p-fluid flex flex-column gap-3 pt-2">
          {formError && (
            <div className="p-3 bg-red-50 border-1 border-red-200 border-round text-red-700 text-xs flex align-items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <InputText
              value={formName}
              onChange={handleNameChange}
              placeholder="Contoh: Manik Kaca, Mutiara Air Tawar, Tali & Kawat"
              className="p-inputtext-sm"
              required
            />
          </div>

          <div>
            <div className="flex justify-content-between align-items-center mb-1">
              <label className="text-xs font-bold text-gray-800 block">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">Otomatis dari nama</span>
            </div>
            <InputText
              value={formSlug}
              onChange={(e) => {
                setFormSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              placeholder="contoh: manik-kaca"
              className="p-inputtext-sm font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1">
              Deskripsi Kategori (Opsional)
            </label>
            <InputTextarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat jenis material dan kerajinan pada kategori ini..."
              className="text-xs"
            />
          </div>

          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="text-xs font-bold text-gray-800 block mb-1">
                Urutan Tampil (Sort Order)
              </label>
              <InputNumber
                value={formSortOrder}
                onValueChange={(e) => setFormSortOrder(e.value ?? 0)}
                min={0}
                className="p-inputtext-sm"
              />
            </div>
            <div className="col-12 md:col-6 flex flex-column justify-content-center">
              <label className="text-xs font-bold text-gray-800 block mb-2">
                Status Publikasi
              </label>
              <div className="flex align-items-center gap-2">
                <InputSwitch
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.value)}
                />
                <span className="text-xs font-semibold text-gray-700">
                  {formIsActive ? 'Aktif di Katalog' : 'Disembunyikan'}
                </span>
              </div>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog
        header="Konfirmasi Hapus Kategori"
        visible={deleteDialogOpen}
        style={{ width: '90vw', maxWidth: '440px' }}
        onHide={() => setDeleteDialogOpen(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Batal"
              className="p-button-text p-button-sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            />
            <Button
              type="button"
              label={isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              icon="pi pi-trash"
              className="p-button-sm p-button-danger font-semibold"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
            />
          </div>
        }
      >
        <div className="flex align-items-start gap-3 pt-2">
          <div
            className="p-2 border-round flex align-items-center justify-content-center bg-red-100 text-red-700"
            style={{ width: '40px', height: '40px' }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 m-0 mb-1">
              Hapus kategori &quot;{categoryToDelete?.name}&quot;?
            </p>
            <p className="text-xs text-gray-600 m-0">
              Tindakan ini tidak dapat dibatalkan. Kategori hanya dapat dihapus jika tidak ada produk yang terhubung.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
