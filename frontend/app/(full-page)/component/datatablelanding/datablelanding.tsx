'use client';
import React, { useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';

interface DataTableLandingProps {
  data: any[];
  loading: boolean;
  columns: { field: string; header: string }[];
  onAdd: (
    section: string,
    judul: string,
    deskripsi: string,
    Gambar: File | null,
    nama?: string,
    jml_siswa_laki?: number,
    jml_siswa_perempuan?: number,
    total_siswa?: number
  ) => void;
  onUpdate: (
    id: string,
    section: string,
    judul: string,
    deskripsi: string,
    Gambar: File | null,
    nama?: string,
    jml_siswa_laki?: number,
    jml_siswa_perempuan?: number,
    total_siswa?: number
  ) => void;
  onDelete: (id: string) => void;
}

const DataTableLanding: React.FC<DataTableLandingProps> = ({
  data,
  loading,
  columns,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [section, setSection] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [Gambar, setGambar] = useState<File | null>(null);
  const [nama, setNama] = useState('');
  const [jmlLaki, setJmlLaki] = useState<number | undefined>(undefined);
  const [jmlPerempuan, setJmlPerempuan] = useState<number | undefined>(undefined);
  const [totalSiswa, setTotalSiswa] = useState<number | undefined>(undefined);
  const [filterSection, setFilterSection] = useState<string>('');
  const toast = useRef<Toast>(null);
   const [uploadStatus, setUploadStatus] = useState<string | null>(null);

     const handleUpload = () => {
        setUploadStatus("success");

        toast.current?.show({
            severity: "success",
            summary: "Berhasil Upload",
            detail: "Gambar berhasil diunggah.",
            life: 2500,
        });
    };

  // 🔢 Pilihan section
  const sectionOptions = [
    { label: 'Semua Section', value: '' },
    { label: 'Section 1', value: '1' },
    { label: 'Section 2', value: '2' },
    { label: 'Section 3', value: '3' },
    { label: 'Section 4', value: '4' },
  ];

  // 🔍 Filter berdasarkan section
  const filteredData = useMemo(() => {
    if (!filterSection) return data;
    return data.filter((item) => item.section === filterSection);
  }, [data, filterSection]);

  // 📁 Upload file
  const handleFileSelect = (e: FileUploadSelectEvent) => {
    setGambar(e.files[0]);
  };

  // ➕ Tambah
  const openAddDialog = () => {
    setSection('');
    setJudul('');
    setDeskripsi('');
    setNama('');
    setJmlLaki(undefined);
    setJmlPerempuan(undefined);
    setTotalSiswa(undefined);
    setGambar(null);
    setShowDialog(true);
        setUploadStatus(null); // 🟢 Tambahkan ini
  };

  const handleAdd = () => {
    if (!section || !judul || !deskripsi) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Peringatan',
        detail: 'Section, judul, dan deskripsi wajib diisi',
      });
      return;
    }
    onAdd(section, judul, deskripsi, Gambar, nama, jmlLaki, jmlPerempuan, totalSiswa);
    setShowDialog(false);
  };

  // ✏️ Edit
  const openEditDialog = (rowData: any) => {
    setSelectedData(rowData);
    setSection(rowData.section);
    setJudul(rowData.judul);
    setDeskripsi(rowData.deskripsi);
    setNama(rowData.nama || '');
    setJmlLaki(rowData.jml_siswa_laki || undefined);
    setJmlPerempuan(rowData.jml_siswa_perempuan || undefined);
    setTotalSiswa(rowData.total_siswa || undefined);
    setGambar(null);
    setShowEditDialog(true);
        setUploadStatus(null); // 🟢 Tambahkan ini
  };

  const handleUpdate = () => {
    if (!selectedData?.id) return;
    onUpdate(selectedData.id, section, judul, deskripsi, Gambar, nama, jmlLaki, jmlPerempuan, totalSiswa);
    setShowEditDialog(false);
  };

  // 🗑️ Hapus
const handleDelete = (id: string) => {
  setDeleteId(id);
  setShowDeleteDialog(true);
};



  // 🖼️ Template gambar (seperti DataTable Profile)
const imageBodyTemplate = (rowData: any) => {
  const path = rowData.Gambar || rowData.Gambar;
  return path ? (
    <span className="text-gray-800">{path}</span>
  ) : (
    <span className="text-gray-500 italic">Tidak ada gambar</span>
  );
};

  // ⚙️ Tombol aksi
  const actionBodyTemplate = (rowData: any) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-info" onClick={() => openEditDialog(rowData)} />
      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => handleDelete(rowData.id)} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <div className="card">
        <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
          <h2 className="text-xl font-bold">CMS Landing Page</h2>
          <div className="flex gap-2 items-center">
            <Dropdown
              value={filterSection}
              options={sectionOptions}
              onChange={(e) => setFilterSection(e.value)}
              placeholder="Filter Section"
              className="w-48"
            />
            <Button label="Tambah Data" icon="pi pi-plus" onClick={openAddDialog} />
          </div>
        </div>

        <DataTable value={filteredData} loading={loading} paginator rows={10} responsiveLayout="scroll">
  {columns.map((col, i) => (
    <Column
      key={i}
      field={col.field}
      header={col.header}
      body={col.field.toLowerCase() === 'gambar' ? imageBodyTemplate : undefined}
    />
  ))}
  <Column header="Aksi" body={actionBodyTemplate} />
</DataTable>
      </div>

      {/* 🔹 Dialog Tambah / Edit */}
      <Dialog
        header={showEditDialog ? 'Edit Data' : 'Tambah Data'}
        visible={showDialog || showEditDialog}
        style={{ width: '40rem' }}
        modal
        onHide={() => {
          setShowDialog(false);
          setShowEditDialog(false);
        }}
      >
        <div className="field mb-3">
          <label>Section</label>
          <Dropdown
            value={section}
            options={sectionOptions.slice(1)}
            onChange={(e) => setSection(e.value)}
            className="w-full"
            placeholder="Pilih Section"
          />
        </div>

        <div className="field mb-3">
          <label>Judul</label>
          <InputText value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full" />
        </div>

        <div className="field mb-3">
          <label>Deskripsi</label>
          <InputTextarea value={deskripsi} rows={3} onChange={(e) => setDeskripsi(e.target.value)} className="w-full" />
        </div>

        {section === '2' && (
          <div className="field mb-3">
            <label>Nama</label>
            <InputText value={nama} onChange={(e) => setNama(e.target.value)} className="w-full" />
          </div>
        )}

        {section === '3' && (
  <>
    <div className="field mb-3">
      <label>Jumlah Siswa Laki-laki</label>
      <InputText
        type="number"
        value={jmlLaki?.toString() || ''}
        onChange={(e) => {
          const val = Number(e.target.value);
          setJmlLaki(val);
          setTotalSiswa(val + (jmlPerempuan || 0)); // otomatis update total
        }}
        className="w-full"
      />
    </div>

    <div className="field mb-3">
      <label>Jumlah Siswa Perempuan</label>
      <InputText
        type="number"
        value={jmlPerempuan?.toString() || ''}
        onChange={(e) => {
          const val = Number(e.target.value);
          setJmlPerempuan(val);
          setTotalSiswa((jmlLaki || 0) + val); // otomatis update total
        }}
        className="w-full"
      />
    </div>

    <div className="field mb-3">
      <label>Total Siswa</label>
      <InputText
        type="number"
        value={totalSiswa?.toString() || ''}
        readOnly
        className="w-full bg-gray-100 cursor-not-allowed"
      />
    </div>
  </>
)}

        {section !== '3' && (
  <fieldset className="p-3 border-round border-1 border-gray-300">
    <legend className="text-sm font-semibold">Upload Gambar</legend>
   <FileUpload
                           mode="advanced"
                           accept="image/*"
                           customUpload
                           chooseLabel="Pilih File"
                           uploadLabel="Upload"
                           cancelLabel="Batal"
                           onSelect={handleFileSelect}
                           uploadHandler={handleUpload}
                           emptyTemplate={<p className="m-0 text-sm text-gray-500">Seret file ke sini atau klik untuk memilih.</p>}
                           itemTemplate={(file: any) => {
                               const objectURL = file?.objectURL ?? URL.createObjectURL(file);
   
                               return (
                                   <div className="p-fileupload-row flex items-center gap-3 py-2">
                                       <img src={objectURL} alt={file.name} className="w-5 h-5 object-cover rounded border" />
                                       <span className="text-sm">{file.name}</span>
                                   </div>
                               );
                           }}
                       />
  </fieldset>
)}


        <div className="flex justify-end gap-2 mt-4">
          <Button label="Batal" icon="pi pi-times" onClick={() => { setShowDialog(false); setShowEditDialog(false); }} className="p-button-text" />
          <Button label="Simpan" icon="pi pi-check" onClick={showEditDialog ? handleUpdate : handleAdd} />
        </div>
      </Dialog>

      {/* 🔴 Dialog Konfirmasi Hapus */}
<Dialog
  header="Konfirmasi Hapus"
  visible={showDeleteDialog}
  modal
  style={{ width: "25rem" }}
  onHide={() => setShowDeleteDialog(false)}
>
  <p className="m-0">
    Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.
  </p>

  <div className="flex justify-end gap-2 mt-4">
    <Button
      label="Batal"
      icon="pi pi-times"
      className="p-button-text"
      onClick={() => setShowDeleteDialog(false)}
    />
    <Button
      label="Hapus"
      icon="pi pi-trash"
      className="p-button-danger"
      onClick={() => {
        if (deleteId) onDelete(deleteId);
        setShowDeleteDialog(false);
      }}
    />
  </div>
</Dialog>

    </>
  );
};

export default DataTableLanding;
