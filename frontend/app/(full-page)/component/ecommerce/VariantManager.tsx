'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Plus, Edit2, Trash2, Layers, AlertCircle } from 'lucide-react';
import { EcommerceVariant } from '@/types/ecommerce';
import { formatRupiah } from '@/app/api/ecommerce/client';

interface VariantManagerProps {
  variants: EcommerceVariant[];
  onChange?: (variants: EcommerceVariant[]) => void;
  basePrice?: number;
  readOnly?: boolean;
}

export const VariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onChange,
  basePrice = 0,
  readOnly = false,
}) => {
  const [items, setItems] = useState<EcommerceVariant[]>(variants || []);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [optionKey, setOptionKey] = useState('');
  const [optionValue, setOptionValue] = useState('');
  const [optionsMap, setOptionsMap] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Sync state if props change
  React.useEffect(() => {
    setItems(variants || []);
  }, [variants]);

  const updateItems = (newItems: EcommerceVariant[]) => {
    setItems(newItems);
    if (onChange) {
      onChange(newItems);
    }
  };

  const openAddDialog = () => {
    setEditingIndex(null);
    setName('');
    setSku('');
    setPrice(null);
    setStock(10);
    setIsActive(true);
    setOptionsMap({});
    setOptionKey('');
    setOptionValue('');
    setFormError('');
    setShowDialog(true);
  };

  const openEditDialog = (index: number) => {
    const item = items[index];
    if (!item) return;

    setEditingIndex(index);
    setName(item.name || '');
    setSku(item.sku || '');
    setPrice(item.price !== null && item.price !== undefined ? Number(item.price) : null);
    setStock(Number(item.stock) || 0);
    setIsActive(item.is_active);

    if (item.options && typeof item.options === 'object' && !Array.isArray(item.options)) {
      setOptionsMap({ ...item.options });
    } else if (Array.isArray(item.options)) {
      const map: Record<string, string> = {};
      item.options.forEach((opt, idx) => {
        map[`Opsi ${idx + 1}`] = String(opt);
      });
      setOptionsMap(map);
    } else {
      setOptionsMap({});
    }

    setOptionKey('');
    setOptionValue('');
    setFormError('');
    setShowDialog(true);
  };

  const handleAddOption = () => {
    if (!optionKey.trim() || !optionValue.trim()) return;
    setOptionsMap((prev) => ({
      ...prev,
      [optionKey.trim()]: optionValue.trim(),
    }));
    setOptionKey('');
    setOptionValue('');
  };

  const handleRemoveOption = (key: string) => {
    setOptionsMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSaveVariant = () => {
    if (!name.trim()) {
      setFormError('Nama variant wajib diisi.');
      return;
    }

    const newVariant: EcommerceVariant = {
      ...(editingIndex !== null && items[editingIndex]?.id
        ? { id: items[editingIndex].id }
        : {}),
      name: name.trim(),
      sku: sku.trim() || null,
      price: price !== null ? price : null,
      effective_price: price !== null && price > 0 ? price : basePrice,
      stock: Number(stock) || 0,
      is_active: isActive,
      options: optionsMap,
    };

    let updated: EcommerceVariant[];
    if (editingIndex !== null) {
      updated = [...items];
      updated[editingIndex] = newVariant;
    } else {
      updated = [...items, newVariant];
    }

    updateItems(updated);
    setShowDialog(false);
  };

  const handleDeleteVariant = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    updateItems(updated);
  };

  // Render options tag/chips
  const renderOptions = (rowData: EcommerceVariant) => {
    if (!rowData.options) return <span className="text-gray-400 text-xs">-</span>;

    if (Array.isArray(rowData.options)) {
      return (
        <div className="flex flex-wrap gap-1">
          {rowData.options.map((opt, i) => (
            <span
              key={i}
              className="px-2 py-0 text-xs border-round font-medium"
              style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
            >
              {opt}
            </span>
          ))}
        </div>
      );
    }

    if (typeof rowData.options === 'object') {
      const entries = Object.entries(rowData.options);
      if (entries.length === 0) return <span className="text-gray-400 text-xs">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {entries.map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-0 text-xs border-round font-medium"
              style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
            >
              <strong>{k}:</strong> {String(v)}
            </span>
          ))}
        </div>
      );
    }

    return <span className="text-xs text-gray-700">{String(rowData.options)}</span>;
  };

  return (
    <div className="surface-card border-round p-3 mb-3 border-1 surface-border">
      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-2">
          <Layers size={18} style={{ color: '#D96C91' }} />
          <div>
            <h4 className="m-0 text-base font-bold" style={{ color: '#272329' }}>
              Varian Produk ({items.length})
            </h4>
            <span className="text-xs text-gray-500">
              Kelola kombinasi ukuran, warna, harga kustom, dan stok varian
            </span>
          </div>
        </div>

        {!readOnly && (
          <Button
            type="button"
            label="Tambah Varian"
            icon={<Plus size={14} className="mr-1" />}
            className="p-button-sm font-semibold"
            style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
            onClick={openAddDialog}
          />
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-4 text-center surface-50 border-round border-dashed surface-border">
          <Layers size={32} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 m-0 font-medium">
            Belum ada varian untuk produk ini.
          </p>
          <span className="text-xs text-gray-400">
            Produk akan menggunakan harga dasar dan stok tunggal jika tidak memiliki varian.
          </span>
        </div>
      ) : (
        <DataTable
          value={items}
          className="p-datatable-sm"
          responsiveLayout="scroll"
          emptyMessage="Tidak ada varian"
        >
          <Column
            header="No"
            body={(_, { rowIndex }) => <span className="text-xs">{rowIndex + 1}</span>}
            style={{ width: '45px' }}
          />
          <Column
            field="name"
            header="Nama Varian"
            body={(row) => (
              <div>
                <span className="font-semibold text-sm text-gray-900 block">{row.name}</span>
                {row.sku && (
                  <span className="text-xs text-gray-500 font-mono">SKU: {row.sku}</span>
                )}
              </div>
            )}
          />
          <Column header="Opsi / Atribut" body={renderOptions} />
          <Column
            header="Harga"
            body={(row: EcommerceVariant) => (
              <span className="text-sm font-medium text-gray-800">
                {row.price !== null && row.price !== undefined
                  ? formatRupiah(row.price)
                  : `${formatRupiah(basePrice)} (dasar)`}
              </span>
            )}
          />
          <Column
            header="Stok"
            body={(row: EcommerceVariant) => {
              const isZero = row.stock === 0;
              const isLow = row.stock > 0 && row.stock <= 5;
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
                  {row.stock} pcs
                </span>
              );
            }}
            style={{ width: '90px' }}
          />
          <Column
            header="Status"
            body={(row: EcommerceVariant) => (
              <Tag
                value={row.is_active ? 'Aktif' : 'Nonaktif'}
                severity={row.is_active ? 'success' : 'danger'}
                className="text-xs"
              />
            )}
            style={{ width: '85px' }}
          />
          {!readOnly && (
            <Column
              header="Aksi"
              body={(_, { rowIndex }) => (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    icon={<Edit2 size={13} />}
                    className="p-button-text p-button-sm p-button-info p-0 p-button-rounded"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => openEditDialog(rowIndex)}
                    tooltip="Edit Varian"
                  />
                  <Button
                    type="button"
                    icon={<Trash2 size={13} />}
                    className="p-button-text p-button-sm p-button-danger p-0 p-button-rounded"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handleDeleteVariant(rowIndex)}
                    tooltip="Hapus Varian"
                  />
                </div>
              )}
              style={{ width: '80px' }}
            />
          )}
        </DataTable>
      )}

      {/* Dialog Form Variant */}
      <Dialog
        header={editingIndex !== null ? 'Edit Varian Produk' : 'Tambah Varian Baru'}
        visible={showDialog}
        style={{ width: '95vw', maxWidth: '520px' }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              type="button"
              label="Batal"
              icon="pi pi-times"
              className="p-button-text p-button-sm"
              onClick={() => setShowDialog(false)}
            />
            <Button
              type="button"
              label="Simpan Varian"
              icon="pi pi-check"
              className="p-button-sm"
              style={{ backgroundColor: '#D96C91', borderColor: '#D96C91' }}
              onClick={handleSaveVariant}
            />
          </div>
        }
      >
        <div className="p-fluid flex flex-column gap-3 pt-2">
          {formError && (
            <div className="p-2 bg-red-100 text-red-700 text-xs border-round flex align-items-center gap-2">
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Nama Varian <span className="text-red-500">*</span>
            </label>
            <InputText
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Merah / 6mm, Pink Pastel / Size M"
              className="p-inputtext-sm"
            />
          </div>

          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="text-xs font-bold text-gray-700 block mb-1">SKU (Opsional)</label>
              <InputText
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: KZ-VAR-01"
                className="p-inputtext-sm font-mono"
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="text-xs font-bold text-gray-700 block mb-1">Status Varian</label>
              <Dropdown
                value={isActive}
                options={[
                  { label: 'Aktif', value: true },
                  { label: 'Nonaktif', value: false },
                ]}
                onChange={(e) => setIsActive(e.value)}
                className="p-inputtext-sm"
              />
            </div>
          </div>

          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Harga Khusus (Rp)
              </label>
              <InputNumber
                value={price}
                onValueChange={(e) => setPrice(e.value ?? null)}
                placeholder={`Dasar: ${formatRupiah(basePrice)}`}
                mode="currency"
                currency="IDR"
                locale="id-ID"
                className="p-inputtext-sm"
              />
              <span className="text-xs text-gray-500">Kosongkan jika mengikuti harga dasar</span>
            </div>
            <div className="col-12 md:col-6">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Stok Varian <span className="text-red-500">*</span>
              </label>
              <InputNumber
                value={stock}
                onValueChange={(e) => setStock(e.value ?? 0)}
                min={0}
                className="p-inputtext-sm"
              />
            </div>
          </div>

          {/* Opsi / Atribut Key-Value */}
          <div className="border-1 surface-border border-round p-3 surface-50">
            <label className="text-xs font-bold text-gray-700 block mb-2">
              Atribut / Pilihan (Warna, Ukuran, dsb.)
            </label>

            <div className="flex gap-2 mb-2">
              <InputText
                value={optionKey}
                onChange={(e) => setOptionKey(e.target.value)}
                placeholder="Nama (cth: Warna)"
                className="p-inputtext-sm flex-1"
              />
              <InputText
                value={optionValue}
                onChange={(e) => setOptionValue(e.target.value)}
                placeholder="Nilai (cth: Pink Aurora)"
                className="p-inputtext-sm flex-1"
              />
              <Button
                type="button"
                icon={<Plus size={14} />}
                className="p-button-sm"
                style={{ backgroundColor: '#B94F76', borderColor: '#B94F76' }}
                onClick={handleAddOption}
                tooltip="Tambahkan Opsi"
              />
            </div>

            {Object.keys(optionsMap).length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(optionsMap).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-1 text-xs border-round flex align-items-center gap-1 bg-white border-1 surface-border"
                  >
                    <strong>{k}:</strong> {v}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(k)}
                      className="border-none bg-transparent p-0 cursor-pointer text-red-500 font-bold ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">Belum ada atribut khusus yang ditambahkan.</span>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};
