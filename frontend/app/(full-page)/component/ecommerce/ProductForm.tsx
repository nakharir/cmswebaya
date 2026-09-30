'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ArrowLeft, Save, AlertCircle, Package, Sparkles } from 'lucide-react';
import {
  EcommerceCategory,
  EcommerceProduct,
  EcommerceVariant,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { extractErrorMessage, extractFieldErrors } from '@/app/api/ecommerce/client';
import { VariantManager } from './VariantManager';
import { ProductImageManager } from './ProductImageManager';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: EcommerceProduct | null;
  baseRedirectPath?: string; // e.g. '/admin/produk' or '/operator/produk'
}

export const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  initialData,
  baseRedirectPath = '/admin/produk',
}) => {
  const router = useRouter();
  const toast = useRef<Toast>(null);

  // Categories
  const [categories, setCategories] = useState<EcommerceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [variants, setVariants] = useState<EcommerceVariant[]>([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  // Form Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      try {
        const cats = await ecommerceService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Populate data in edit mode
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategoryId(
        initialData.category_id || initialData.category?.id || null
      );
      setSlug(initialData.slug || '');
      setMaterial(initialData.material || '');
      setBasePrice(initialData.base_price !== undefined ? Number(initialData.base_price) : null);
      setStock(initialData.stock !== undefined ? Number(initialData.stock) : 0);
      setDescription(initialData.description || '');
      setIsActive(initialData.is_active ?? true);
      setVariants(initialData.variants || []);
    }
  }, [initialData]);

  // Frontend validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Nama produk wajib diisi.';
    }

    if (!categoryId) {
      errors.category_id = 'Pilih salah satu kategori.';
    }

    if (basePrice === null || basePrice === undefined || basePrice < 0) {
      errors.base_price = 'Harga dasar wajib diisi dengan angka positif.';
    }

    if ((!variants || variants.length === 0) && (stock === null || stock === undefined || stock < 0)) {
      errors.stock = 'Stok produk wajib diisi dengan angka minimal 0.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setErrorMessage('Silakan lengkapi kolom yang bertanda bintang merah (*).');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const hasVariants = variants && variants.length > 0;

      if (mode === 'create') {
        const payload: ProductCreatePayload = {
          name: name.trim(),
          category_id: Number(categoryId),
          slug: slug.trim() || undefined,
          material: material.trim() || null,
          base_price: Number(basePrice),
          stock: hasVariants ? 0 : Number(stock || 0),
          description: description.trim() || null,
          is_active: isActive,
          variants: variants,
        };

        const created = await ecommerceService.createProduct(payload);

        // Upload staged images if any
        if (stagedFiles.length > 0 && created.id) {
          for (let i = 0; i < stagedFiles.length; i++) {
            try {
              await ecommerceService.uploadProductImage(created.id, stagedFiles[i], {
                is_primary: i === 0,
                sort_order: i,
              });
            } catch (imgErr) {
              console.warn('Failed to upload an attached image:', imgErr);
            }
          }
        }

        toast.current?.show({
          severity: 'success',
          summary: 'Produk Dibuat',
          detail: `Produk "${created.name}" berhasil disimpan.`,
          life: 2500,
        });

        setTimeout(() => {
          router.push(baseRedirectPath);
        }, 1200);
      } else if (mode === 'edit' && initialData?.id) {
        const payload: ProductUpdatePayload = {
          name: name.trim(),
          category_id: Number(categoryId),
          slug: slug.trim() || undefined,
          material: material.trim() || null,
          base_price: Number(basePrice),
          stock: hasVariants ? 0 : Number(stock || 0),
          description: description.trim() || null,
          is_active: isActive,
          variants: variants,
        };

        const updated = await ecommerceService.updateProduct(initialData.id, payload);

        toast.current?.show({
          severity: 'success',
          summary: 'Perubahan Disimpan',
          detail: `Produk "${updated.name}" berhasil diperbarui.`,
          life: 2500,
        });

        setTimeout(() => {
          router.push(baseRedirectPath);
        }, 1200);
      }
    } catch (err: unknown) {
      console.error('Error submitting product:', err);
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
      setFieldErrors(extractFieldErrors(err));

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

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  return (
    <div className="p-2 md:p-4">
      <Toast ref={toast} />

      {/* Header Bar */}
      <div className="card mb-4 p-4 border-round-xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div className="flex align-items-center gap-3">
            <Button
              type="button"
              icon={<ArrowLeft size={18} />}
              className="p-button-outlined p-button-secondary p-button-rounded"
              style={{ width: '40px', height: '40px' }}
              onClick={() => router.push(baseRedirectPath)}
              tooltip="Kembali ke Daftar Produk"
            />
            <div>
              <div className="flex align-items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold m-0" style={{ color: '#272329' }}>
                  {mode === 'create' ? 'Tambah Produk Handmade' : 'Edit Produk Handmade'}
                </h1>
                <span
                  className="px-2 py-1 text-xs font-bold border-round"
                  style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
                >
                  {mode === 'create' ? 'Baru' : `ID: #${initialData?.id}`}
                </span>
              </div>
              <p className="text-sm m-0 text-gray-500">
                {mode === 'create'
                  ? 'Masukkan detail produk, kategori, harga, varian, dan foto kerajinan'
                  : `Kelola data katalog dan informasi untuk "${initialData?.name || ''}"`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              label="Batal"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary p-button-sm font-semibold"
              onClick={() => router.push(baseRedirectPath)}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              label={
                isSubmitting
                  ? 'Menyimpan...'
                  : mode === 'create'
                  ? 'Terbitkan Produk'
                  : 'Simpan Perubahan'
              }
              icon={
                isSubmitting ? (
                  <ProgressSpinner
                    style={{ width: '14px', height: '14px' }}
                    strokeWidth="4"
                    className="mr-2"
                  />
                ) : (
                  <Save size={16} className="mr-2" />
                )
              }
              className="p-button-sm font-semibold border-none"
              style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="card mb-4 p-3 border-round bg-red-50 border-1 border-red-200 flex align-items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSubmit}>
        <div className="grid">
          {/* Left Column: General Info */}
          <div className="col-12 lg:col-8">
            <div className="card p-4 mb-4 border-round-xl">
              <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                <Package size={18} style={{ color: '#D96C91' }} />
                <h3 className="text-lg font-bold m-0" style={{ color: '#272329' }}>
                  Informasi Dasar Produk
                </h3>
              </div>

              <div className="p-fluid flex flex-column gap-3">
                {/* Nama Produk */}
                <div>
                  <label htmlFor="product-name" className="text-sm font-bold text-gray-800 block mb-1">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Gelang Manik Daisy Pastel, Kalung Resin Rose"
                    className={fieldErrors.name ? 'p-invalid' : ''}
                  />
                  {fieldErrors.name && (
                    <small className="p-error block mt-1">{fieldErrors.name}</small>
                  )}
                </div>

                {/* Kategori & Material */}
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <label htmlFor="product-category" className="text-sm font-bold text-gray-800 block mb-1">
                      Kategori Produk <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                      id="product-category"
                      value={categoryId}
                      options={categoryOptions}
                      onChange={(e) => setCategoryId(e.value)}
                      placeholder={
                        loadingCategories ? 'Memuat kategori...' : 'Pilih Kategori'
                      }
                      disabled={loadingCategories}
                      className={fieldErrors.category_id ? 'p-invalid' : ''}
                    />
                    {fieldErrors.category_id && (
                      <small className="p-error block mt-1">{fieldErrors.category_id}</small>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    <label htmlFor="product-material" className="text-sm font-bold text-gray-800 block mb-1">
                      Material / Bahan
                    </label>
                    <InputText
                      id="product-material"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Contoh: Manik Kaca, Resin & Bunga Kering, Tali Katun"
                      className={fieldErrors.material ? 'p-invalid' : ''}
                    />
                    {fieldErrors.material && (
                      <small className="p-error block mt-1">{fieldErrors.material}</small>
                    )}
                  </div>
                </div>

                {/* Harga Dasar, Stok (jika non-variant), & Slug */}
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <label htmlFor="product-price" className="text-sm font-bold text-gray-800 block mb-1">
                      Harga Dasar (Rp) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      id="product-price"
                      value={basePrice}
                      onValueChange={(e) => setBasePrice(e.value ?? null)}
                      mode="currency"
                      currency="IDR"
                      locale="id-ID"
                      placeholder="Rp 0"
                      className={fieldErrors.base_price ? 'p-invalid' : ''}
                    />
                    {fieldErrors.base_price && (
                      <small className="p-error block mt-1">{fieldErrors.base_price}</small>
                    )}
                  </div>

                  {variants.length === 0 ? (
                    <div className="col-12 md:col-6">
                      <label htmlFor="product-stock" className="text-sm font-bold text-gray-800 block mb-1">
                        Stok Produk (Non-Variant) <span className="text-red-500">*</span>
                      </label>
                      <InputNumber
                        id="product-stock"
                        value={stock}
                        onValueChange={(e) => setStock(e.value ?? 0)}
                        min={0}
                        placeholder="0"
                        className={fieldErrors.stock ? 'p-invalid' : ''}
                      />
                      <small className="text-gray-500 block mt-1">
                        Jumlah inventaris produk tunggal tanpa variasi.
                      </small>
                      {fieldErrors.stock && (
                        <small className="p-error block mt-1">{fieldErrors.stock}</small>
                      )}
                    </div>
                  ) : (
                    <div className="col-12 md:col-6">
                      <label htmlFor="product-slug" className="text-sm font-bold text-gray-800 block mb-1">
                        Slug URL (Opsional)
                      </label>
                      <InputText
                        id="product-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="Otomatis diisi dari nama produk jika kosong"
                        className={`font-mono text-sm ${fieldErrors.slug ? 'p-invalid' : ''}`}
                      />
                      {fieldErrors.slug && (
                        <small className="p-error block mt-1">{fieldErrors.slug}</small>
                      )}
                    </div>
                  )}
                </div>

                {variants.length === 0 && (
                  <div>
                    <label htmlFor="product-slug" className="text-sm font-bold text-gray-800 block mb-1">
                      Slug URL (Opsional)
                    </label>
                    <InputText
                      id="product-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="Otomatis diisi dari nama produk jika kosong"
                      className={`font-mono text-sm ${fieldErrors.slug ? 'p-invalid' : ''}`}
                    />
                    {fieldErrors.slug && (
                      <small className="p-error block mt-1">{fieldErrors.slug}</small>
                    )}
                  </div>
                )}

                {/* Deskripsi */}
                <div>
                  <label htmlFor="product-description" className="text-sm font-bold text-gray-800 block mb-1">
                    Deskripsi Lengkap Produk
                  </label>
                  <InputTextarea
                    id="product-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    autoResize
                    placeholder="Tuliskan cerita pembuatan, dimensi, keunikan motif, cara perawatan karya handmade ini..."
                  />
                </div>
              </div>
            </div>

            {/* Product Image Manager */}
            <ProductImageManager
              productId={mode === 'edit' ? initialData?.id : undefined}
              initialImages={initialData?.images || []}
              stagedFiles={stagedFiles}
              onStagedFilesChange={setStagedFiles}
            />

            {/* Variant Manager */}
            <VariantManager
              variants={variants}
              onChange={setVariants}
              basePrice={basePrice || 0}
            />
          </div>

          {/* Right Column: Status & Tips Card */}
          <div className="col-12 lg:col-4">
            {/* Status Card */}
            <div className="card p-4 mb-4 border-round-xl">
              <h4 className="text-base font-bold m-0 mb-3" style={{ color: '#272329' }}>
                Visibilitas &amp; Status
              </h4>

              <div className="flex align-items-center justify-content-between p-3 surface-50 border-round mb-3">
                <div>
                  <span className="font-bold text-sm text-gray-800 block">Status Publikasi</span>
                  <span className="text-xs text-gray-500">
                    {isActive
                      ? 'Produk aktif dan tampil di katalog publik'
                      : 'Produk disembunyikan dari katalog publik'}
                  </span>
                </div>
                <InputSwitch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.value ?? false)}
                />
              </div>

              <div className="p-3 border-round text-xs" style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}>
                <div className="flex align-items-center gap-1 font-bold mb-1">
                  <Sparkles size={14} />
                  <span>KREZOEMA Craft Standard</span>
                </div>
                Pastikan nama produk memuat karakteristik unik handmade (contoh: jenis manik, teknik rajut macrame, atau resin floral).
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card p-4 border-round-xl">
              <h4 className="text-base font-bold m-0 mb-3" style={{ color: '#272329' }}>
                Aksi Form
              </h4>

              <Button
                type="submit"
                label={
                  isSubmitting
                    ? 'Menyimpan...'
                    : mode === 'create'
                    ? 'Terbitkan Produk'
                    : 'Simpan Perubahan'
                }
                icon={
                  isSubmitting ? (
                    <ProgressSpinner
                      style={{ width: '14px', height: '14px' }}
                      strokeWidth="4"
                      className="mr-2"
                    />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )
                }
                className="w-full mb-2 font-bold p-3 border-none"
                style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
                disabled={isSubmitting}
              />

              <Button
                type="button"
                label="Batal &amp; Kembali"
                className="w-full p-button-outlined p-button-secondary font-semibold"
                onClick={() => router.push(baseRedirectPath)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
