'use client';
import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

interface DataTableVisiMisiProps {
    data: any[];
    loading: boolean;
    columns: { field: string; header: string }[];
    onAdd: (visiList: string[], misiList: string[]) => void;
    onUpdate: (id: string, visiList: string[], misiList: string[]) => void;
    onDelete: (id: string) => void;
}

const DataTableVisiMisi: React.FC<DataTableVisiMisiProps> = ({
    data,
    loading,
    columns,
    onAdd,
    onUpdate,
    onDelete,
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedData, setSelectedData] = useState<any>(null);

    const [visiList, setVisiList] = useState<string[]>(['']);
    const [misiList, setMisiList] = useState<string[]>(['']);

    const toast = useRef<Toast>(null);

    // === TAMBAH ===
    const openAddDialog = () => {
        setVisiList(['']);
        setMisiList(['']);
        setShowDialog(true);
    };

    const addVisiField = () => setVisiList([...visiList, '']);
    const addMisiField = () => setMisiList([...misiList, '']);

    const updateVisiField = (index: number, value: string) => {
        const updated = [...visiList];
        updated[index] = value;
        setVisiList(updated);
    };

    const updateMisiField = (index: number, value: string) => {
        const updated = [...misiList];
        updated[index] = value;
        setMisiList(updated);
    };

    const handleAddData = () => {
        const filteredVisi = visiList.filter(v => v.trim() !== '');
        const filteredMisi = misiList.filter(m => m.trim() !== '');

        if (!filteredVisi.length && !filteredMisi.length) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Peringatan',
                detail: 'Isi minimal satu visi atau misi!',
                life: 3000,
            });
            return;
        }

        onAdd(filteredVisi, filteredMisi);
        setShowDialog(false);
    };

    // === EDIT ===
    const openEditDialog = (rowData: any) => {
        setSelectedData(rowData);
        setVisiList(rowData.visi ? rowData.visi.split(',').map((v: string) => v.trim()) : ['']);
        setMisiList(rowData.misi ? rowData.misi.split(',').map((m: string) => m.trim()) : ['']);
        setShowEditDialog(true);
    };

    const handleUpdateData = () => {
        const filteredVisi = visiList.filter(v => v.trim() !== '');
        const filteredMisi = misiList.filter(m => m.trim() !== '');
        onUpdate(selectedData.id, filteredVisi, filteredMisi);
        setShowEditDialog(false);
    };

    // === HAPUS ===
    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setDeleteDialogVisible(true);
    };

    const handleDeleteConfirm = () => {
        if (deleteId) onDelete(deleteId);
        setDeleteDialogVisible(false);
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2 justify-center">
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

    // === FOOTERS ===
    const addDialogFooter = (
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

    const deleteDialogFooter = (
        <div className="flex justify-center gap-3 mt-3">
            <Button label="Batal" icon="pi pi-times" onClick={() => setDeleteDialogVisible(false)} className="p-button-text" />
            <Button label="Hapus" icon="pi pi-trash" severity="danger" onClick={handleDeleteConfirm} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <div className="card">
                <div className="flex justify-between align-items-center mb-3">
                    <Button label="Tambah Data" icon="pi pi-plus" onClick={openAddDialog} />
                </div>

                <DataTable
                    value={data}
                    loading={loading}
                    paginator
                    rows={10}
                    responsiveLayout="scroll"
                >
                    {/* Sembunyikan kolom id dan hilangkan panah sort */}
                    {columns
                        .filter(col => col.field !== 'id')
                        .map((col, i) => (
                            <Column key={i} field={col.field} header={col.header} sortable={false} />
                        ))}
                    <Column header="Aksi" body={actionBodyTemplate} />
                </DataTable>
            </div>

            {/* === Dialog Tambah === */}
            <Dialog
                header="Tambah Visi & Misi"
                visible={showDialog}
                style={{ width: '40rem' }}
                modal
                onHide={() => setShowDialog(false)}
                footer={addDialogFooter}
            >
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Visi</label>
                    {visiList.map((v, i) => (
                        <InputText
                            key={i}
                            value={v}
                            onChange={(e) => updateVisiField(i, e.target.value)}
                            className="w-full mb-2"
                            placeholder={`Visi ${i + 1}`}
                        />
                    ))}
                    <Button
                        label="+ Tambah Visi"
                        icon="pi pi-plus"
                        className="p-button-text text-blue-500"
                        onClick={addVisiField}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Misi</label>
                    {misiList.map((m, i) => (
                        <InputText
                            key={i}
                            value={m}
                            onChange={(e) => updateMisiField(i, e.target.value)}
                            className="w-full mb-2"
                            placeholder={`Misi ${i + 1}`}
                        />
                    ))}
                    <Button
                        label="+ Tambah Misi"
                        icon="pi pi-plus"
                        className="p-button-text text-blue-500"
                        onClick={addMisiField}
                    />
                </div>
            </Dialog>

            {/* === Dialog Edit === */}
            <Dialog
                header="Edit Visi & Misi"
                visible={showEditDialog}
                style={{ width: '40rem' }}
                modal
                onHide={() => setShowEditDialog(false)}
                footer={editDialogFooter}
            >
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Visi</label>
                    {visiList.map((v, i) => (
                        <InputText
                            key={i}
                            value={v}
                            onChange={(e) => updateVisiField(i, e.target.value)}
                            className="w-full mb-2"
                            placeholder={`Visi ${i + 1}`}
                        />
                    ))}
                    <Button
                        label="+ Tambah Visi"
                        icon="pi pi-plus"
                        className="p-button-text text-blue-500"
                        onClick={addVisiField}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Misi</label>
                    {misiList.map((m, i) => (
                        <InputText
                            key={i}
                            value={m}
                            onChange={(e) => updateMisiField(i, e.target.value)}
                            className="w-full mb-2"
                            placeholder={`Misi ${i + 1}`}
                        />
                    ))}
                    <Button
                        label="+ Tambah Misi"
                        icon="pi pi-plus"
                        className="p-button-text text-blue-500"
                        onClick={addMisiField}
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
                footer={deleteDialogFooter}
            >
                <i className="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p className="text-lg font-medium text-gray-700">
                    Apakah Anda yakin ingin menghapus data ini?
                </p>
            </Dialog>
        </>
    );
};

export default DataTableVisiMisi;
