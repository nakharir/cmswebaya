'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import DataTableWithCRUD from '@/app/(full-page)/component/datablefasilitas/datablefasilitas';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

const CMSFasilitas = () => {
    const [fasilitasList, setFasilitasList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useRef<Toast>(null);

    // Ambil data saat komponen dimuat
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_ENDPOINTS.GETFasilitas);
            setFasilitasList(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal mengambil data',
                life: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Tambah data
    const handleAdd = async (judul: string, deskripsi: string, Gambar: File | null) => {
        try {
            const formData = new FormData();
            formData.append('judul', judul);
            formData.append('deskripsi', deskripsi);
            if (Gambar) formData.append('Gambar', Gambar);

            await axios.post(API_ENDPOINTS.TAMBAHFasilitas, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Data berhasil ditambahkan',
                life: 2500
            });
            fetchData();
        } catch (error) {
            console.error('Error adding data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal menambahkan data',
                life: 3000
            });
        }
    };

    // Update data
    const handleUpdate = async (id: string, judul: string, deskripsi: string, Gambar: File | null) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      if (judul) formData.append('judul', judul);
      if (deskripsi) formData.append('deskripsi', deskripsi);
      if (Gambar instanceof File) formData.append('Gambar', Gambar);
      formData.append('_method', 'PUT');

      await axios.post(API_ENDPOINTS.UPDATEFasilitas(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Sukses',
        detail: 'Data ekstrakurikuler berhasil diupdate',
        life: 3000,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Gagal update data ekstrakurikuler',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
    // Hapus data
    const handleDelete = async (id: string) => {
        try {
            await axios.delete(API_ENDPOINTS.DELETEFasilitas(id));
            toast.current?.show({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Data berhasil dihapus',
                life: 2500
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Gagal menghapus data',
                life: 3000
            });
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <h1 className="text-2xl font-bold mb-4">CMS Fasilitas</h1>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <ProgressSpinner />
                </div>
            ) : (
                <DataTableWithCRUD
                    data={fasilitasList}
                    loading={isLoading}
                    columns={[
                        { field: 'judul', header: 'Judul' },
                        { field: 'deskripsi', header: 'Deskripsi' },
                        { field: 'Gambar', header: 'Gambar' }
                    ]}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    nameField="judul"
                    nameField2="judul"
                    nameField3="deskripsi"
                    inputLabel="Judul"
                    inputLabel2="Judul"
                    inputLabel3="Deskripsi"
                />
            )}
        </div>
    );
};

export default CMSFasilitas;