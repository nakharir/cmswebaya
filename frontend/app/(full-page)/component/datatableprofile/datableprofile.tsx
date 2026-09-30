'use client';
import React, { useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

interface DataTableWithCRUDProps {
    data: any[];
    loading: boolean;
    columns: { field: string; header: string }[];
    onAdd: (
        section: string,
        judul: string,
        konten: string,
        gambar: File | null,
        email?: string,
        alamat?: string,
        no_telp?: string
    ) => void;
    onUpdate: (
        id: string,
        section: string,
        judul: string,
        konten: string,
        gambar: File | null,
        email?: string,
        alamat?: string,
        no_telp?: string
    ) => void;
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
    nameField2,
    nameField3,
    inputLabel2,
    inputLabel3,
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [section, setSection] = useState('');
    const [judul, setJudul] = useState('');
    const [konten, setKonten] = useState('');
    const [gambar, setGambar] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [alamat, setAlamat] = useState('');
    const [noTelp, setNoTelp] = useState('');

    const toast = useRef<Toast>(null);
    const [filterSection, setFilterSection] = useState<string>('');

    const sectionOptions = [
        { label: 'Semua Section', value: '' },
        { label: 'Sejarah', value: 'sejarah' },
        { label: 'Program', value: 'program' },
        { label: 'Akreditasi', value: 'akreditasi' },
        { label: 'Kontak', value: 'kontak' },
    ];

    // === Filter Data ===
    const filteredData = useMemo(() => {
        if (!filterSection) return data;
        return data.filter((item) => item.section === filterSection);
    }, [data, filterSection]);

    // === File Upload ===
    const handleFileSelect = (e: FileUploadSelectEvent) => {
        const file = e.files[0];
        setGambar(file);
    };

    const handleUpload = () => {
        toast.current?.show({
            severity: "success",
            summary: "Berhasil Upload",
            detail: "Gambar berhasil diunggah.",
            life: 2500,
        });
    };

    // === Tambah ===
    const openAddDialog = () => {
        setSection('');
        setJudul('');
        setKonten('');
        setGambar(null);
        setEmail('');
        setAlamat('');
        setNoTelp('');
        setShowDialog(true);
    };

    const handleAddData = () => {
        onAdd(section, judul, konten, gambar, email, alamat, noTelp);
        setShowDialog(false);
    };

    // === Edit ===
    const openEditDialog = (rowData: any) => {
        setSelectedData(rowData);
        setSection(rowData.section || '');
        setJudul(rowData.judul || '');
        setKonten(rowData.konten || '');
        setEmail(rowData.email || '');
        setAlamat(rowData.alamat || '');
        setNoTelp(rowData.no_telp || '');
        setGambar(null);
        setShowEditDialog(true);
    };

    const handleUpdateData = () => {
        if (!selectedData?.id) return;
        onUpdate(selectedData.id, section, judul, konten, gambar, email, alamat, noTelp);
        setShowEditDialog(false);
    };

    // === Hapus ===
    const handleDeleteData = (id: string) => {
        setDeleteId(id);
        setShowDeleteDialog(true);
    };

    // === Template Gambar ===
    const imageBodyTemplate = (rowData: any) => {
        const path = rowData.gambar;
        return path ? (
            <span className="text-gray-800">{path}</span>
        ) : (
            <span className="text-gray-500 italic">Tidak ada gambar</span>
        );
    };

    // === Tombol Aksi ===
    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-info" onClick={() => openEditDialog(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => handleDeleteData(rowData.id)} />
        </div>
    );

    // === Dialog Footer ===
    const dialogFooter = (
        <div className="flex justify-end gap-2">
            <Button label="Batal" icon="pi pi-times" onClick={() => setShowDialog(false)} className="p-button-text" />
            <Button label="Simpan" icon="pi pi-check" onClick={handleAddData} />
        </div>
    );

    const editDialogFooter = (
        <div className="flex justify-end gap-2">
            <Button label="Batal" icon="pi pi-times" onClick={() => setShowEditDialog(false)} className="p-button-text" />
            <Button label="Update" icon="pi pi-check" onClick={handleUpdateData} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            {/* === Header Table === */}
            <div className="card">
                <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
                    <h2 className="text-xl font-bold">Daftar Profil KREZOEMA</h2>
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

                {/* === Table === */}
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

            {/* =========================== */}
            {/* === Dialog Tambah Data === */}
            {/* =========================== */}
            <Dialog header="Tambah Profil KREZOEMA" visible={showDialog} style={{ width: '40rem' }} modal onHide={() => setShowDialog(false)} footer={dialogFooter}>

                <div className="field mb-3">
                    <label>Section</label>
                    <Dropdown value={section} options={sectionOptions.slice(1)} onChange={(e) => setSection(e.value)} className="w-full" placeholder="Pilih Section" />
                </div>

                <div className="field mb-3">
                    <label>{inputLabel2}</label>
                    <InputText value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full" />
                </div>

                <div className="field mb-3">
                    <label>{inputLabel3}</label>
                    <InputTextarea rows={4} value={konten} onChange={(e) => setKonten(e.target.value)} className="w-full" />
                </div>

                {/* === Tambah Kontak === */}
                {section === 'kontak' && (
                    <>
                        <div className="field mb-3">
                            <label>Email</label>
                            <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
                        </div>

                        <div className="field mb-3">
                            <label>Alamat</label>
                            <InputTextarea rows={2} value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full" />
                        </div>

                        <div className="field mb-3">
                            <label>No. Telepon</label>
                           <InputText
    type="number"
    value={noTelp}
    onChange={(e) => setNoTelp(e.target.value)}
    className="w-full"
/>

                        </div>
                    </>
                )}

                {/* === Upload Gambar — disembunyikan untuk kontak === */}
                {section !== 'kontak' && (
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
                        />
                    </fieldset>
                )}

            </Dialog>

            {/* ======================== */}
            {/* === Dialog Edit Data === */}
            {/* ======================== */}
            <Dialog header="Edit Profil KREZOEMA" visible={showEditDialog} style={{ width: '40rem' }} modal onHide={() => setShowEditDialog(false)} footer={editDialogFooter}>

                <div className="field mb-3">
                    <label>Section</label>
                    <Dropdown value={section} options={sectionOptions.slice(1)} onChange={(e) => setSection(e.value)} className="w-full" />
                </div>

                <div className="field mb-3">
                    <label>{inputLabel2}</label>
                    <InputText value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full" />
                </div>

                <div className="field mb-3">
                    <label>{inputLabel3}</label>
                    <InputTextarea rows={4} value={konten} onChange={(e) => setKonten(e.target.value)} className="w-full" />
                </div>

                {/* === Edit Kontak === */}
                {section === 'kontak' && (
                    <>
                        <div className="field mb-3">
                            <label>Email</label>
                            <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
                        </div>

                        <div className="field mb-3">
                            <label>Alamat</label>
                            <InputTextarea rows={2} value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full" />
                        </div>

                        <div className="field mb-3">
                            <label>No. Telepon</label>
                         <InputText
    type="number"
    value={noTelp}
    onChange={(e) => setNoTelp(e.target.value)}
    className="w-full"
/>

                        </div>
                    </>
                )}

                {/* === Upload Gambar Edit (disembunyikan jika kontak) === */}
                {section !== 'kontak' && (
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
                        />
                    </fieldset>
                )}

            </Dialog>

            {/* === Konfirmasi Hapus === */}
            <Dialog header="Konfirmasi Hapus" visible={showDeleteDialog} style={{ width: '25rem' }} modal onHide={() => setShowDeleteDialog(false)}>
                <p className="mb-4">Apakah Anda yakin ingin menghapus data ini?</p>
                <div className="flex justify-end gap-2">
                    <Button label="Batal" className="p-button-text" onClick={() => setShowDeleteDialog(false)} />
                    <Button label="Hapus" className="p-button-danger" onClick={() => { if (deleteId) onDelete(deleteId); setShowDeleteDialog(false); }} />
                </div>
            </Dialog>

        </>
    );
};

export default DataTableWithCRUD;
