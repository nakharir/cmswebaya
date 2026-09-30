'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Image as LucideImage, Upload, Trash2, Star, Eye, AlertCircle } from 'lucide-react';
import { EcommerceProductImage } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { getImageUrl, extractErrorMessage } from '@/app/api/ecommerce/client';

interface ProductImageManagerProps {
  productId?: number;
  initialImages?: EcommerceProductImage[];
  onImagesChange?: (images: EcommerceProductImage[]) => void;
  // In create mode (before product ID exists), parent can receive staged files
  stagedFiles?: File[];
  onStagedFilesChange?: (files: File[]) => void;
  readOnly?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  productId,
  initialImages = [],
  onImagesChange,
  stagedFiles = [],
  onStagedFilesChange,
  readOnly = false,
}) => {
  const [images, setImages] = useState<EcommerceProductImage[]>(initialImages);
  const [localFiles, setLocalFiles] = useState<File[]>(stagedFiles);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [altText, setAltText] = useState('');
  const [isPrimaryCheck, setIsPrimaryCheck] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useRef<Toast>(null);

  // Sync initial images
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  // Generate previews for local staged files (when in create mode)
  useEffect(() => {
    if (!productId && localFiles.length > 0) {
      const urls = localFiles.map((file) => URL.createObjectURL(file));
      setLocalPreviews(urls);
      return () => {
        urls.forEach((url) => URL.revokeObjectURL(url));
      };
    } else if (!productId) {
      setLocalPreviews([]);
    }
  }, [localFiles, productId]);

  const refreshImages = async () => {
    if (!productId) return;
    try {
      const updated = await ecommerceService.getProductImages(productId);
      setImages(updated);
      if (onImagesChange) {
        onImagesChange(updated);
      }
    } catch (err) {
      console.error('Failed to reload images:', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.current?.show({
        severity: 'error',
        summary: 'Format Tidak Didukung',
        detail: 'Hanya format JPG, PNG, dan WEBP yang diperbolehkan.',
        life: 3500,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({
        severity: 'error',
        summary: 'Ukuran Melebihi Batas',
        detail: 'Ukuran file gambar maksimal adalah 5 MB.',
        life: 3500,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // If product exists, upload immediately to backend API
    if (productId) {
      setIsUploading(true);
      try {
        await ecommerceService.uploadProductImage(productId, file, {
          alt_text: altText.trim() || undefined,
          is_primary: isPrimaryCheck,
        });

        toast.current?.show({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'Gambar produk berhasil diunggah.',
          life: 3000,
        });

        setAltText('');
        setIsPrimaryCheck(false);
        await refreshImages();
      } catch (err) {
        toast.current?.show({
          severity: 'error',
          summary: 'Gagal Unggah Gambar',
          detail: extractErrorMessage(err),
          life: 4000,
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      // Create mode: stage file in state
      const updated = [...localFiles, file];
      setLocalFiles(updated);
      if (onStagedFilesChange) {
        onStagedFilesChange(updated);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteRemote = async (imageId: number) => {
    if (!productId) return;
    try {
      await ecommerceService.deleteProductImage(productId, imageId);
      toast.current?.show({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Gambar telah dihapus.',
        life: 2500,
      });
      setDeleteImageId(null);
      await refreshImages();
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Menghapus',
        detail: extractErrorMessage(err),
        life: 3500,
      });
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!productId) return;
    try {
      await ecommerceService.setPrimaryProductImage(productId, imageId);
      toast.current?.show({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Gambar utama telah diperbarui.',
        life: 2500,
      });
      await refreshImages();
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal Set Gambar Utama',
        detail: extractErrorMessage(err),
        life: 3500,
      });
    }
  };

  const handleRemoveLocalFile = (index: number) => {
    const updated = localFiles.filter((_, i) => i !== index);
    setLocalFiles(updated);
    if (onStagedFilesChange) {
      onStagedFilesChange(updated);
    }
  };

  return (
    <div className="surface-card border-round p-3 mb-3 border-1 surface-border">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-2">
          <LucideImage size={18} style={{ color: '#D96C91' }} />
          <div>
            <h4 className="m-0 text-base font-bold" style={{ color: '#272329' }}>
              Galeri Gambar Produk ({productId ? images.length : localFiles.length})
            </h4>
            <span className="text-xs text-gray-500">
              Format didukung: JPG, PNG, WEBP &bull; Maks. 5 MB per gambar
            </span>
          </div>
        </div>

        {!readOnly && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              id="product-image-file-input"
              disabled={isUploading}
            />
            <Button
              type="button"
              label={isUploading ? 'Mengunggah...' : 'Unggah Foto'}
              icon={
                isUploading ? (
                  <ProgressSpinner
                    style={{ width: '14px', height: '14px' }}
                    strokeWidth="4"
                    className="mr-1"
                  />
                ) : (
                  <Upload size={14} className="mr-1" />
                )
              }
              className="p-button-sm font-semibold"
              style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            />
          </div>
        )}
      </div>

      {/* Upload metadata options (Alt text) if editing */}
      {!readOnly && productId && (
        <div className="grid align-items-center mb-3 p-2 surface-50 border-round">
          <div className="col-12 md:col-8">
            <InputText
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Deskripsi / Alt Text Gambar (Opsional)"
              className="p-inputtext-sm w-full"
            />
          </div>
          <div className="col-12 md:col-4 flex align-items-center gap-2">
            <input
              type="checkbox"
              id="set-primary-check"
              checked={isPrimaryCheck}
              onChange={(e) => setIsPrimaryCheck(e.target.checked)}
              className="cursor-pointer"
            />
            <label
              htmlFor="set-primary-check"
              className="text-xs font-semibold cursor-pointer text-gray-700 m-0"
            >
              Jadikan Gambar Utama
            </label>
          </div>
        </div>
      )}

      {/* Remote Images (Edit Mode) */}
      {productId && images.length > 0 && (
        <div className="grid">
          {images.map((img) => (
            <div key={img.id} className="col-6 sm:col-4 md:col-3">
              <div
                className="border-1 surface-border border-round overflow-hidden position-relative surface-50 flex flex-column"
                style={{
                  border: img.is_primary ? '2px solid #D96C91' : '1px solid #E5E7EB',
                }}
              >
                {/* Primary Tag */}
                {img.is_primary && (
                  <div
                    className="position-absolute top-0 left-0 px-2 py-1 text-xs font-bold text-white z-1 flex align-items-center gap-1 border-round-bottom-right"
                    style={{ backgroundColor: '#D96C91' }}
                  >
                    <Star size={11} fill="white" />
                    <span>Utama</span>
                  </div>
                )}

                {/* Image Container */}
                <div
                  className="w-full overflow-hidden flex align-items-center justify-content-center cursor-pointer bg-white"
                  style={{ height: '130px' }}
                  onClick={() => setPreviewUrl(getImageUrl(img.image_url))}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(img.image_url)}
                    alt={img.alt_text || 'Produk'}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>

                {/* Actions */}
                {!readOnly && (
                  <div className="p-2 flex justify-content-between align-items-center border-top-1 surface-border surface-0">
                    {!img.is_primary ? (
                      <Button
                        type="button"
                        label="Utamakan"
                        icon={<Star size={12} className="mr-1" />}
                        className="p-button-text p-button-sm p-0 text-xs"
                        style={{ color: '#D96C91' }}
                        onClick={() => handleSetPrimary(img.id)}
                      />
                    ) : (
                      <span className="text-xs text-green-600 font-semibold flex align-items-center gap-1">
                        <Star size={12} fill="#16A34A" /> Cover
                      </span>
                    )}

                    <div className="flex gap-1">
                      <Button
                        type="button"
                        icon={<Eye size={12} />}
                        className="p-button-text p-button-sm p-0 p-button-secondary"
                        style={{ width: '24px', height: '24px' }}
                        onClick={() => setPreviewUrl(getImageUrl(img.image_url))}
                        tooltip="Lihat Full"
                      />
                      <Button
                        type="button"
                        icon={<Trash2 size={12} />}
                        className="p-button-text p-button-sm p-0 p-button-danger"
                        style={{ width: '24px', height: '24px' }}
                        onClick={() => setDeleteImageId(img.id)}
                        tooltip="Hapus"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Local Files (Create Mode) */}
      {!productId && localPreviews.length > 0 && (
        <div className="grid">
          {localPreviews.map((preview, idx) => (
            <div key={idx} className="col-6 sm:col-4 md:col-3">
              <div
                className="border-1 surface-border border-round overflow-hidden position-relative surface-50 flex flex-column"
                style={{
                  border: idx === 0 ? '2px solid #D96C91' : '1px solid #E5E7EB',
                }}
              >
                {idx === 0 && (
                  <div
                    className="position-absolute top-0 left-0 px-2 py-1 text-xs font-bold text-white z-1 flex align-items-center gap-1 border-round-bottom-right"
                    style={{ backgroundColor: '#D96C91' }}
                  >
                    <Star size={11} fill="white" />
                    <span>Utama</span>
                  </div>
                )}

                <div
                  className="w-full overflow-hidden flex align-items-center justify-content-center bg-white"
                  style={{ height: '130px' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Pratinjau"
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>

                <div className="p-2 flex justify-content-between align-items-center border-top-1 surface-border surface-0">
                  <span className="text-xs text-gray-500 truncate" style={{ maxWidth: '100px' }}>
                    {localFiles[idx]?.name}
                  </span>
                  <Button
                    type="button"
                    icon={<Trash2 size={12} />}
                    className="p-button-text p-button-sm p-0 p-button-danger"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => handleRemoveLocalFile(idx)}
                    tooltip="Hapus"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((productId && images.length === 0) || (!productId && localFiles.length === 0)) && (
        <div className="p-4 text-center surface-50 border-round border-dashed surface-border">
          <LucideImage size={32} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 m-0 font-medium">Belum ada foto produk.</p>
          <span className="text-xs text-gray-400">
            {productId
              ? 'Klik tombol "Unggah Foto" untuk mengunggah gambar produk ke server.'
              : 'Pilih foto sekarang, foto akan otomatis diunggah saat produk disimpan.'}
          </span>
        </div>
      )}

      {/* Image Preview Lightbox Dialog */}
      <Dialog
        header="Pratinjau Gambar"
        visible={!!previewUrl}
        style={{ width: '90vw', maxWidth: '650px' }}
        onHide={() => setPreviewUrl(null)}
      >
        {previewUrl && (
          <div className="flex justify-content-center align-items-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau Besar"
              className="border-round max-w-full"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header="Konfirmasi Hapus Gambar"
        visible={deleteImageId !== null}
        style={{ width: '90vw', maxWidth: '420px' }}
        onHide={() => setDeleteImageId(null)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Batal"
              icon="pi pi-times"
              className="p-button-text p-button-sm"
              onClick={() => setDeleteImageId(null)}
            />
            <Button
              type="button"
              label="Hapus Gambar"
              icon="pi pi-trash"
              className="p-button-danger p-button-sm"
              onClick={() => {
                if (deleteImageId !== null) handleDeleteRemote(deleteImageId);
              }}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3 py-2">
          <AlertCircle size={28} className="text-red-500 flex-shrink-0" />
          <p className="m-0 text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus gambar ini dari server produk?
          </p>
        </div>
      </Dialog>
    </div>
  );
};
