'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';
import DataTableWithCRUD from '@/app/(full-page)/component/datableberita/datableberita';
import { ProgressSpinner } from 'primereact/progressspinner';

const CMSBerita = () => {
    const [beritaList, setBeritaList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useRef<Toast>(null);

    // === Ambil data saat komponen dimuat ===
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_ENDPOINTS.GETBerita);
            setBeritaList(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal mengambil data', life: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    // === Tambah data ===
    const handleAdd = async (judul: string, deskripsi: string, gambar: File | null) => {
        const formData = new FormData();
        formData.append('judul', judul);
        formData.append('deskripsi', deskripsi);
        if (gambar instanceof File) {
            formData.append('gambar', gambar);
        }

        try {
            setIsLoading(true);
            const response = await axios.post(API_ENDPOINTS.TAMBAHBerita, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.message) {
                toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil ditambahkan', life: 3000 });
            }
            fetchData();
        } catch (error) {
            console.error('Gagal menambah data:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal menambah data', life: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    // === Update data ===
    const handleUpdate = async (id: string, judul: string, deskripsi: string, gambar: File | null) => {
        const formData = new FormData();
        if (judul) formData.append('judul', judul);
        if (deskripsi) formData.append('deskripsi', deskripsi);
        if (gambar instanceof File) formData.append('gambar', gambar);

        formData.append('_method', 'PUT'); // agar Laravel kenali PUT

        try {
            setIsLoading(true);
            await axios.post(API_ENDPOINTS.UPDATEBerita(id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil diupdate', life: 3000 });
            fetchData();
        } catch (error) {
            console.error('Gagal update data:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal update data', life: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    // === Hapus data ===
    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await axios.delete(API_ENDPOINTS.DELETEBerita(id));
            toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil dihapus', life: 3000 });
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal hapus data', life: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            {isLoading ? (
                <div className="flex justify-content-center align-items-center h-40">
                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="6" />
                </div>
            ) : (
                <DataTableWithCRUD
                    data={beritaList}
                    loading={isLoading}
                    
                    columns={[
                        { field: 'judul', header: 'Judul' },
                        { field: 'deskripsi', header: 'Deskripsi' },
                        { field: 'gambar', header: 'Gambar' },
                        { field: 'created_at', header: 'Dibuat Pada' },
                        { field: 'updated_at', header: 'Diperbarui Pada' },
                    ]}
                    onAdd={(judul: string, deskripsi: string, gambar: File | null) =>
                        handleAdd(judul, deskripsi, gambar)
                    }
                    onUpdate={(id: string, judul: string, deskripsi: string, gambar: File | null) =>
                        handleUpdate(id, judul, deskripsi, gambar)
                    }
                    onDelete={handleDelete}
                    nameField="judul"
                    nameField2="deskripsi"
                    nameField3="gambar"
                    inputLabel="Judul"
                    inputLabel2="Deskripsi"
                    inputLabel3="Upload Gambar"
                />
            )}
        </>
    );
};

export default CMSBerita;
