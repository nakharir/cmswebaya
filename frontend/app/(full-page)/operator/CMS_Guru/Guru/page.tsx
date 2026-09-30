'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';
import DataTableWithCRUDGuru from '@/app/(full-page)/component/datatableguru/datableguru'; // ✅ pakai versi GURU
import { ProgressSpinner } from 'primereact/progressspinner';

const CMSGuru = () => {
    const [guruList, setGuruList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useRef<Toast>(null);

    // === Ambil data saat komponen dimuat ===
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_ENDPOINTS.GETGuru);
            setGuruList(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal mengambil data',
                life: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // === Tambah data ===
    const handleAdd = async (kategori: string, nama: string, jabatan: string, gambar: File | null) => {
        const formData = new FormData();
        formData.append('kategori', kategori);
        formData.append('nama', nama);
        formData.append('jabatan', jabatan);
        if (gambar instanceof File) {
            formData.append('gambar', gambar);
        }

        try {
            setIsLoading(true);
            const response = await axios.post(API_ENDPOINTS.TAMBAHGuru, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.message) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sukses',
                    detail: 'Data guru berhasil ditambahkan',
                    life: 3000,
                });
            }
            fetchData();
        } catch (error) {
            console.error('Gagal menambah data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal menambah data',
                life: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // === Update data ===
    const handleUpdate = async (id: string, kategori: string, nama: string, jabatan: string, gambar: File | null) => {
        const formData = new FormData();
        if (kategori) formData.append('kategori', kategori);
        if (nama) formData.append('nama', nama);
        if (jabatan) formData.append('jabatan', jabatan);
        if (gambar instanceof File) formData.append('gambar', gambar);

        formData.append('_method', 'PUT'); // Laravel pakai ini untuk PUT

        try {
            setIsLoading(true);
            await axios.post(API_ENDPOINTS.UPDATEGuru(id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Sukses',
                detail: 'Data guru berhasil diupdate',
                life: 3000,
            });
            fetchData();
        } catch (error) {
            console.error('Gagal update data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal update data',
                life: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // === Hapus data ===
    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await axios.delete(API_ENDPOINTS.DELETEGuru(id));
            toast.current?.show({
                severity: 'success',
                summary: 'Sukses',
                detail: 'Data guru berhasil dihapus',
                life: 3000,
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal hapus data',
                life: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="6" />
                </div>
            ) : (
                <DataTableWithCRUDGuru
                    data={guruList}
                    loading={isLoading}
                    columns={[
                        { field: 'kategori', header: 'Kategori' },
                        { field: 'nama', header: 'Nama Guru' },
                        { field: 'jabatan', header: 'Jabatan' },
                        { field: 'gambar', header: 'Foto' },
                        { field: 'created_at', header: 'Dibuat Pada' },
                        { field: 'updated_at', header: 'Diperbarui Pada' },
                    ]}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
};

export default CMSGuru;