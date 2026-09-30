'use client';

import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { UploadCloud, CheckCircle2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { EcommerceOrder } from '@/types/ecommerce';
import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import { extractErrorMessage } from '@/app/api/ecommerce/client';

interface TransferProofUploadProps {
  order: EcommerceOrder;
  onUploaded: (updated: EcommerceOrder) => void;
}

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const TransferProofUpload: React.FC<TransferProofUploadProps> = ({ order, onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUpload =
    order.payment_status === 'unpaid' || order.payment_status === 'rejected';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Format file tidak valid. Gunakan JPG, JPEG, atau PNG.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Ukuran file terlalu besar. Maksimal ${MAX_SIZE_MB} MB.`);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await ecommerceService.uploadTransferProof(order.id, selectedFile);
      setSuccess('Bukti transfer berhasil diupload. Status pembayaran diperbarui ke Menunggu Verifikasi.');
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded(updated);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Show existing proof even when canUpload = false
  const existingProofUrl = order.transfer_proof_url;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
        <UploadCloud className="w-4 h-4 text-pink-600" />
        <span>Bukti Transfer</span>
      </div>

      {/* Existing proof thumbnail */}
      {existingProofUrl && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Bukti yang sudah diupload:</p>
          <a href={existingProofUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingProofUrl}
              alt="Bukti transfer"
              className="max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
        </div>
      )}

      {/* Already paid — no more uploads */}
      {order.payment_status === 'paid' && (
        <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span className="font-semibold">Pembayaran sudah diverifikasi. Upload tidak diperlukan.</span>
        </div>
      )}

      {/* Waiting — show info, still allow re-upload (rejected path not needed here) */}
      {order.payment_status === 'waiting_verification' && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center gap-2">
          <ImageIcon className="w-4 h-4 shrink-0 text-blue-500" />
          <span>Bukti transfer sedang ditinjau oleh admin.</span>
        </div>
      )}

      {/* Rejected — show rejection notice */}
      {order.payment_status === 'rejected' && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-semibold">Bukti transfer ditolak. Silakan upload ulang bukti transfer yang valid.</span>
        </div>
      )}

      {/* Upload area — only when canUpload */}
      {canUpload && (
        <div className="space-y-3">
          {/* Preview */}
          {preview && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview bukti transfer"
                className="max-h-40 rounded-lg border border-pink-200 object-contain"
              />
              <button
                onClick={handleClearFile}
                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 hover:bg-red-50 transition-colors"
                title="Hapus file"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {/* File input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id={`proof-upload-${order.id}`}
            />
            <label
              htmlFor={`proof-upload-${order.id}`}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {selectedFile ? 'Ganti File' : 'Pilih File (JPG/PNG, maks 2 MB)'}
            </label>
            {selectedFile && (
              <span className="ml-2 text-xs text-gray-500 truncate max-w-[200px] inline-block align-middle">
                {selectedFile.name}
              </span>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Upload Button */}
          <Button
            label={isUploading ? 'Mengupload...' : 'Upload Bukti Transfer'}
            icon={isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-pink-600 hover:bg-pink-700 border-none text-xs h-9"
          />
        </div>
      )}
    </div>
  );
};
