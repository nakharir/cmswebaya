'use client';
import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';

interface HubungiKami {
  id: string;
  judul: string;
  no_telp: string;
  email: string;
  alamat: string;
}

export default function DataTableHubungiKami({
  data,
  loading,
  columns,
  onAdd,
  onUpdate,
  onDelete,
}: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<HubungiKami | null>(null);

  const [errorNoTelp, setErrorNoTelp] = useState('');
  const [errorEmail, setErrorEmail] = useState('');

  const [judul, setJudul] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [email, setEmail] = useState('');
  const [alamat, setAlamat] = useState('');

  const toast = useRef<Toast>(null);

  // VALIDASI NOMOR TELEPON
  const handleNoTelpChange = (e: any) => {
    const value = e.target.value;
    if (/^[0-9]*$/.test(value)) {
      setNoTelp(value);
      setErrorNoTelp('');
    } else {
      setErrorNoTelp('Nomor telepon hanya boleh angka');
    }
  };

  // VALIDASI EMAIL
  const handleEmailChange = (e: any) => {
    const value = e.target.value;
    setEmail(value);

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(value)) {
      setErrorEmail('Format email tidak valid (harus ada @ dan domain)');
    } else {
      setErrorEmail('');
    }
  };

  // === Tambah ===
  const openAddDialog = () => {
    setJudul('');
    setNoTelp('');
    setEmail('');
    setAlamat('');
    setErrorNoTelp('');
    setErrorEmail('');
    setShowDialog(true);
  };

  const handleAddData = () => {
    if (!judul) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Peringatan',
        detail: 'Judul wajib diisi',
        life: 3000,
      });
      return;
    }

    if (!/^[0-9]+$/.test(noTelp)) {
      setErrorNoTelp('Nomor telepon hanya boleh angka');
      return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      setErrorEmail('Format email tidak valid');
      return;
    }

    onAdd({ judul, no_telp: noTelp, email, alamat });
    setShowDialog(false);
  };

  // === Edit ===
  const openEditDialog = (rowData: HubungiKami) => {
    setSelected(rowData);
    setJudul(rowData.judul);
    setNoTelp(rowData.no_telp);
    setEmail(rowData.email);
    setAlamat(rowData.alamat);
    setErrorNoTelp('');
    setErrorEmail('');
    setShowEditDialog(true);
  };

  const handleUpdateData = () => {
    if (!selected?.id) return;

    if (!/^[0-9]+$/.test(noTelp)) {
      setErrorNoTelp('Nomor telepon hanya boleh angka');
      return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      setErrorEmail('Format email tidak valid');
      return;
    }

    onUpdate(selected.id, { judul, no_telp: noTelp, email, alamat });
    setShowEditDialog(false);
  };

  // === Hapus ===
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) onDelete(deleteId);
    setDeleteDialogVisible(false);
  };

  const actionBodyTemplate = (rowData: HubungiKami) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-info"
        onClick={() => openEditDialog(rowData)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => confirmDelete(rowData.id)}
      />
    </div>
  );

  const dialogFooter = (isEdit = false) => (
    <div className="flex justify-end gap-2">
      <Button
        label="Batal"
        icon="pi pi-times"
        onClick={() => (isEdit ? setShowEditDialog(false) : setShowDialog(false))}
        className="p-button-text"
      />
      <Button
        label={isEdit ? 'Update' : 'Simpan'}
        icon="pi pi-check"
        onClick={isEdit ? handleUpdateData : handleAddData}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <div className="card">
        <div className="flex justify-end mb-3">
          <Button
            label="Tambah Data"
            icon="pi pi-plus"
            className="p-button-primary"
            onClick={openAddDialog}
          />
        </div>

        <DataTable value={data} loading={loading} paginator rows={10} responsiveLayout="scroll">
          {columns
            .filter((col: any) => col.field !== 'id')
            .map((col: any, i: number) => (
              <Column key={i} field={col.field} header={col.header} sortable={false} />
            ))}
          <Column header="Aksi" body={actionBodyTemplate} />
        </DataTable>
      </div>

      {/* === Dialog Tambah === */}
      <Dialog
        header="Tambah Data Hubungi Kami"
        visible={showDialog}
        style={{ width: '35rem' }}
        modal
        onHide={() => setShowDialog(false)}
        footer={dialogFooter()}
      >
        <div className="field mb-3">
          <label htmlFor="judul">Judul</label>
          <InputText
            id="judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full"
            placeholder="Masukkan judul"
          />
        </div>

        <div className="field mb-1">
          <label htmlFor="no_telp">Nomor Telepon</label>
          <InputText
            id="no_telp"
            value={noTelp}
            onChange={handleNoTelpChange}
            className="w-full"
            placeholder="Masukkan nomor telepon"
          />
          {errorNoTelp && <small className="p-error">{errorNoTelp}</small>}
        </div>

        <div className="field mb-3">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full"
            placeholder="Masukkan email"
          />
          {errorEmail && <small className="p-error">{errorEmail}</small>}
        </div>

        <div className="field mb-3">
          <label htmlFor="alamat">Alamat</label>
          <InputTextarea
            id="alamat"
            rows={3}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full"
            placeholder="Masukkan alamat"
          />
        </div>
      </Dialog>

      {/* === Dialog Edit === */}
      <Dialog
        header="Edit Data Hubungi Kami"
        visible={showEditDialog}
        style={{ width: '35rem' }}
        modal
        onHide={() => setShowEditDialog(false)}
        footer={dialogFooter(true)}
      >
        <div className="field mb-3">
          <label htmlFor="judul">Judul</label>
          <InputText
            id="judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="no_telp">Nomor Telepon</label>
          <InputText
            id="no_telp"
            value={noTelp}
            onChange={handleNoTelpChange}
            className="w-full"
          />
          {errorNoTelp && <small className="p-error">{errorNoTelp}</small>}
        </div>

        <div className="field mb-3">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full"
          />
          {errorEmail && <small className="p-error">{errorEmail}</small>}
        </div>

        <div className="field mb-3">
          <label htmlFor="alamat">Alamat</label>
          <InputTextarea
            id="alamat"
            rows={3}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full"
          />
        </div>
      </Dialog>

      {/* === Dialog Konfirmasi Hapus === */}
      <Dialog
        header="Konfirmasi Hapus"
        visible={deleteDialogVisible}
        style={{ width: '25rem' }}
        modal
        closable={false}
        className="flex flex-col items-center justify-center text-center"
        onHide={() => setDeleteDialogVisible(false)}
        footer={
          <div className="flex justify-center gap-3 mt-3">
            <Button
              label="Batal"
              icon="pi pi-times"
              onClick={() => setDeleteDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Hapus"
              icon="pi pi-trash"
              severity="danger"
              onClick={handleDeleteConfirm}
            />
          </div>
        }
      >
        <i className="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p className="text-lg font-medium text-gray-700">
          Apakah Anda yakin ingin menghapus data ini?
        </p>
      </Dialog>
    </>
  );
}
