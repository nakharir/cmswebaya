'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import DataTableWithCRUD from '@/app/(full-page)/component/datableekstra/datableekstra';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

const EkskulPage = () => {
  const [ekskul, setEkskul] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Ambil semua data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GETEkskul);
      setEkskul(res.data);
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

  // 🔹 Tambah data (1 data per kali)
 const handleAdd = async (judul: string, deskripsi: string, Gambar: File | null) => {
        try {
            const formData = new FormData();
            formData.append('judul', judul);
            formData.append('deskripsi', deskripsi);
            if (Gambar) formData.append('Gambar', Gambar);

            await axios.post(API_ENDPOINTS.TAMBAHEkskul, formData, {
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

  // 🔹 Update data
  const handleUpdate = async (id: string, judul: string, deskripsi: string, Gambar: File | null) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      if (judul) formData.append('judul', judul);
      if (deskripsi) formData.append('deskripsi', deskripsi);
      if (Gambar instanceof File) formData.append('Gambar', Gambar);
      formData.append('_method', 'PUT');

      await axios.post(API_ENDPOINTS.UPDATEEkskul(id), formData, {
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

  // 🔹 Hapus data
  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await axios.delete(API_ENDPOINTS.DELETEEkskul(id));
      toast.current?.show({
        severity: 'success',
        summary: 'Sukses',
        detail: 'Data ekstrakurikuler berhasil dihapus',
        life: 3000,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Gagal hapus data ekstrakurikuler',
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
        <div className="flex justify-content-center align-items-center h-40">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="6" />
        </div>
      ) : (
        <DataTableWithCRUD
          data={ekskul}
          loading={isLoading}
          columns={[
            { field: 'judul', header: 'Judul' },
            { field: 'deskripsi', header: 'Deskripsi' },
            { field: 'Gambar', header: 'Gambar' },
          ]}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          nameField="judul"
          nameField2="deskripsi"
          nameField3="Gambar"
          inputLabel="Judul"
          inputLabel2="Deskripsi"
          inputLabel3="Gambar"
        />
      )}
    </>
  );
};

export default EkskulPage;
