'use client';
import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';

interface DataTableWithCRUDGuruProps {
    data: any[];
    loading: boolean;
    columns: { field: string; header: string }[];
    onAdd: (kategori: string, nama: string, jabatan: string, gambar: File | null) => void;
    onUpdate: (id: string, kategori: string, nama: string, jabatan: string, gambar: File | null) => void;
    onDelete: (id: string) => void;
}

const DataTableWithCRUDGuru: React.FC<DataTableWithCRUDGuruProps> = ({
    data,
    loading,
    columns,
    onAdd,
    onUpdate,
    onDelete,
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);

    const [kategori, setKategori] = useState('');
    const [nama, setNama] = useState('');
    const [jabatan, setJabatan] = useState('');
    const [gambar, setGambar] = useState<File | null>(null);
    const toast = useRef<Toast>(null);
       const [uploadStatus, setUploadStatus] = useState<string | null>(null);
       const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteId, setDeleteId] = useState<string | null>(null);
// Tambahkan di bagian atas component, bersama state lainnya
const [filterKategori, setFilterKategori] = useState<string>('');

// Tambahkan opsi "Semua Kategori" untuk dropdown filter
const kategoriOptionsFilter = [
    { label: 'Semua Kategori', value: '' },
    { label: 'Kepala Sekolah', value: 'Kepala Sekolah' },
    { label: 'Guru Mapel', value: 'Guru Mapel' },
    { label: 'Guru Kelas', value: 'Guru Kelas' },
    { label: 'Karyawan', value: 'Karyawan' },
];

// Filter data sebelum tampil di DataTable
const filteredData = filterKategori
    ? data.filter(item => item.kategori === filterKategori)
    : data;



    const handleUpload = () => {
        setUploadStatus("success");
        

        toast.current?.show({
            severity: "success",
            summary: "Berhasil Upload",
            detail: "Gambar berhasil diunggah.",
            life: 2500,
        });
    };

    // === Opsi dropdown kategori ===
    const kategoriOptions = [
        { label: 'Kepala Sekolah', value: 'Kepala Sekolah' },
        { label: 'Guru Mapel', value: 'Guru Mapel' },
        { label: 'Guru Kelas', value: 'Guru Kelas' },
        { label: 'Karyawan', value: 'Karyawan' },
    ];

    // === Dialog Add ===
    const openAddDialog = () => {
        setKategori('');
        setNama('');
        setJabatan('');
        setGambar(null);
        setShowDialog(true);
    };

    // === Dialog Edit ===
    const openEditDialog = (rowData: any) => {
        setSelectedData(rowData);
        setKategori(rowData.kategori || '');
        setNama(rowData.nama || '');
        setJabatan(rowData.jabatan || '');
        setGambar(null);
        setShowEditDialog(true);
    };

    // === File Upload ===
    const handleFileSelect = (e: FileUploadSelectEvent) => {
    const file = e.files[0];

    console.log("File diterima:", file);
    console.log("Tipe file:", file.type);

    // validasi tipe MIME
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
        toast.current?.show({
            severity: "error",
            summary: "Format tidak valid",
            detail: "Gunakan file JPG, PNG, atau GIF.",
            life: 3000,
        });
        return;
    }

    // simpan ke state untuk dikirim ke server
    setGambar(file);
};

    // === Add Data ===
    const handleAddData = () => {
        if (!kategori || !nama || !jabatan) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Peringatan',
                detail: 'Semua field wajib diisi',
                life: 3000,
            });
            return;
        }
        onAdd(kategori, nama, jabatan, gambar);
        setShowDialog(false);
    };

    // === Update Data ===
    const handleUpdateData = () => {
        if (!selectedData?.id) return;
        onUpdate(selectedData.id, kategori, nama, jabatan, gambar);
        setShowEditDialog(false);
    };

    // === Delete Data ===
    const handleDeleteData = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
};


    // === Template Gambar ===
    const imageBodyTemplate = (rowData: any) => {
        const path = rowData.gambar;
        return <span className="text-gray-700">{path ? path : 'Tidak ada gambar'}</span>;
    };

    // === Tombol Aksi ===
    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-info"
                onClick={() => openEditDialog(rowData)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger"
                onClick={() => handleDeleteData(rowData.id)}
            />
        </div>
    );

    // === Footer Dialog ===
    const dialogFooter = (
        <div className="flex justify-end gap-2">
            <Button label="Batal" icon="pi pi-times" onClick={() => setShowDialog(false)} className="p-button-text" />
            <Button label="Simpan" icon="pi pi-check" onClick={handleAddData} autoFocus />
        </div>
    );

    const editDialogFooter = (
        <div className="flex justify-end gap-2">
            <Button label="Batal" icon="pi pi-times" onClick={() => setShowEditDialog(false)} className="p-button-text" />
            <Button label="Update" icon="pi pi-check" onClick={handleUpdateData} autoFocus />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <div className="flex justify-between items-center mb-3 gap-3">
    <Dropdown
        value={filterKategori}
        options={kategoriOptionsFilter}
        onChange={(e) => setFilterKategori(e.value)}
        placeholder="Filter Kategori"
        className="w-48"
    />
    <Button label="Tambah Data" icon="pi pi-plus" onClick={openAddDialog} />
</div>


          <div className="card">
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


            {/* === Tambah Data === */}
            <Dialog
                header="Tambah Guru"
                visible={showDialog}
                style={{ width: '35rem' }}
                modal
                onHide={() => setShowDialog(false)}
                footer={dialogFooter}
            >
                <div className="field mb-3">
                    <label htmlFor="kategori">Kategori</label>
                    <Dropdown
                        id="kategori"
                        value={kategori}
                        onChange={(e) => setKategori(e.value)}
                        options={kategoriOptions}
                        placeholder="Pilih Kategori"
                        className="w-full"
                    />
                </div>
                <div className="field mb-3">
                    <label htmlFor="nama">Nama</label>
                    <InputText id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full" />
                </div>
                <div className="field mb-3">
                    <label htmlFor="jabatan">Jabatan</label>
                    <InputText id="jabatan" value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="w-full" />
                </div>
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
            </Dialog>

            {/* === Edit Data === */}
            <Dialog
                header="Edit Guru"
                visible={showEditDialog}
                style={{ width: '35rem' }}
                modal
                onHide={() => setShowEditDialog(false)}
                footer={editDialogFooter}
            >
                <div className="field mb-3">
                    <label htmlFor="kategori">Kategori</label>
                    <Dropdown
                        id="kategori"
                        value={kategori}
                        onChange={(e) => setKategori(e.value)}
                        options={kategoriOptions}
                        placeholder="Pilih Kategori"
                        className="w-full"
                    />
                </div>
                <div className="field mb-3">
                    <label htmlFor="nama">Nama</label>
                    <InputText id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full" />
                </div>
                <div className="field mb-3">
                    <label htmlFor="jabatan">Jabatan</label>
                    <InputText id="jabatan" value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="w-full" />
                </div>
                <fieldset className="p-3 border-round border-1 border-gray-300">
                    <legend className="text-sm font-semibold">Ganti Gambar (opsional)</legend>
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
            </Dialog>

            {/* === Dialog Konfirmasi Hapus === */}
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

export default DataTableWithCRUDGuru;