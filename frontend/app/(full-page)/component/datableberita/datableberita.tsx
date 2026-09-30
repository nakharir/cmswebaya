'use client';
import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';

interface DataTableWithCRUDProps {
    data: any[];
    loading: boolean;
    columns: { field: string; header: string }[];
    onAdd: (judul: string, deskripsi: string, gambar: File | null) => void;
    onUpdate: (id: string, judul: string, deskripsi: string, gambar: File | null) => void;
    onDelete: (id: string) => void;
    nameField: string;
    nameField2: string;
    nameField3: string;
    inputLabel: string;
    inputLabel2: string;
    inputLabel3: string;
}

const DataTableWithCRUD: React.FC<DataTableWithCRUDProps> = ({
    data,
    loading,
    columns,
    onAdd,
    onUpdate,
    onDelete,
    nameField,
    nameField2,
    nameField3,
    inputLabel,
    inputLabel2,
    inputLabel3
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [judul, setJudul] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [gambar, setGambar] = useState<File | null>(null);
    const toast = useRef<Toast>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteId, setDeleteId] = useState<string | null>(null);


    // === Dialog Add ===
    const openAddDialog = () => {
        setJudul('');
        setDeskripsi('');
        setGambar(null);
        setShowDialog(true);
           setUploadStatus(null); // 🟢 Tambahkan ini
    };
     const handleUpload = () => {
        setUploadStatus("success");

        toast.current?.show({
            severity: "success",
            summary: "Berhasil Upload",
            detail: "Gambar berhasil diunggah.",
            life: 2500,
        });
    };

    // === Dialog Edit ===
    const openEditDialog = (rowData: any) => {
        setSelectedData(rowData);
        setJudul(rowData.judul || '');
        setDeskripsi(rowData.deskripsi || '');
        setGambar(null);
        setShowEditDialog(true);
           setUploadStatus(null); // 🟢 Tambahkan ini
    };

    // === File Upload Handler ===
    const handleFileSelect = (e: FileUploadSelectEvent) => {
        const file = e.files[0];
        setGambar(file);
    };

    // === Add ===
    const handleAddData = () => {
        if (!judul || !deskripsi) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Peringatan',
                detail: 'Judul dan Deskripsi wajib diisi',
                life: 3000
            });
            return;
        }
        onAdd(judul, deskripsi, gambar);
        setShowDialog(false);
    };

    // === Update ===
    const handleUpdateData = () => {
        if (!selectedData?.id) return;
        onUpdate(selectedData.id, judul, deskripsi, gambar);
        setShowEditDialog(false);
    };

    // === Delete ===
    const handleDeleteData = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
};


    // === Tampilkan path gambar sebagai teks ===
    const imageBodyTemplate = (rowData: any) => {
        // Gunakan G besar sesuai field backend
        const path = rowData.Gambar || rowData.gambar;
        return (
            <span className="text-gray-700">
                {path ? path : 'Tidak ada gambar'}
            </span>
        );
    };

    // === Tombol aksi ===
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

            <div className="card">
                <div className="flex justify-between align-items-center mb-3">
                    <h2 className="text-xl font-bold"></h2>
                    <Button label="Tambah Data" icon="pi pi-plus" onClick={openAddDialog} />
                </div>

                <DataTable
                    value={data}
                    loading={loading}
                    paginator
                    rows={10}
                    responsiveLayout="scroll"
                >
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
                header="Tambah Data"
                visible={showDialog}
                style={{ width: '35rem' }}
                modal
                onHide={() => setShowDialog(false)}
                footer={dialogFooter}
            >
                <div className="field mb-3">
                    <label htmlFor={nameField}>{inputLabel}</label>
                    <InputText id={nameField} value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full" />
                </div>
                <div className="field mb-3">
                    <label htmlFor={nameField2}>{inputLabel2}</label>
                    <InputText id={nameField2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full" />
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
                header="Edit Data"
                visible={showEditDialog}
                style={{ width: '35rem' }}
                modal
                onHide={() => setShowEditDialog(false)}
                footer={editDialogFooter}
            >
                <div className="field mb-3">
                    <label htmlFor={nameField}>{inputLabel}</label>
                    <InputText id={nameField} value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full" />
                </div>
                <div className="field mb-3">
                    <label htmlFor={nameField2}>{inputLabel2}</label>
                    <InputText id={nameField2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full" />
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

            {/* === Delete Dialog === */}
<Dialog
    header="Konfirmasi Hapus"
    visible={showDeleteDialog}
    style={{ width: '25rem' }}
    modal
    onHide={() => setShowDeleteDialog(false)}
>
    <p className="mb-4 text-gray-700">
        Apakah Anda yakin ingin menghapus data ini?
    </p>

    <div className="flex justify-end gap-2">
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

export default DataTableWithCRUD;
