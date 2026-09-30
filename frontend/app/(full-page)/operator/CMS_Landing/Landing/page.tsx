'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import DataTableLanding from '@/app/(full-page)/component/datatablelanding/datablelanding';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

const CMSLandingPage = () => {
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GETSECTIONLanding);
      setDataList(res.data);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal mengambil data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (section: string, judul: string, deskripsi: string, Gambar: File | null, nama?: string, jmlLaki?: number, jmlPerempuan?: number, totalSiswa?: number) => {
    const formData = new FormData();
    formData.append('section', section);
    formData.append('judul', judul);
    formData.append('deskripsi', deskripsi);
    if (nama) formData.append('nama', nama);
    if (jmlLaki) formData.append('jml_siswa_laki', String(jmlLaki));
    if (jmlPerempuan) formData.append('jml_siswa_perempuan', String(jmlPerempuan));
    if (totalSiswa) formData.append('total_siswa', String(totalSiswa));
    if (Gambar) formData.append('Gambar', Gambar);

    try {
      await axios.post(API_ENDPOINTS.TAMBAHSECTIONLanding, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data ditambahkan' });
      fetchData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal menambah data' });
    }
  };

  const handleUpdate = async (id: string, section: string, judul: string, deskripsi: string, Gambar: File | null, nama?: string, jmlLaki?: number, jmlPerempuan?: number, totalSiswa?: number) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (section) formData.append('section', section);
    if (judul) formData.append('judul', judul);
    if (deskripsi) formData.append('deskripsi', deskripsi);
    if (nama) formData.append('nama', nama);
    if (jmlLaki) formData.append('jml_siswa_laki', String(jmlLaki));
    if (jmlPerempuan) formData.append('jml_siswa_perempuan', String(jmlPerempuan));
    if (totalSiswa) formData.append('total_siswa', String(totalSiswa));
    if (Gambar) formData.append('Gambar', Gambar);

    try {
      await axios.post(API_ENDPOINTS.UPDATESECTIONLanding(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data diperbarui' });
      fetchData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal update data' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETESECTIONLanding(id));
      toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data dihapus' });
      fetchData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal hapus data' });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      {isLoading ? (
        <div className="flex justify-content-center align-items-center h-40">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <DataTableLanding
          data={dataList}
          loading={isLoading}
          columns={[
            { field: 'section', header: 'Section' },
            { field: 'judul', header: 'Judul' },
            { field: 'deskripsi', header: 'Deskripsi' },
            { field: 'nama', header: 'Nama' },
            { field: 'jml_siswa_laki', header: 'Siswa Laki' },
            { field: 'jml_siswa_perempuan', header: 'Siswa Perempuan' },
            { field: 'total_siswa', header: 'Total Siswa' },
            { field: 'gambar', header: 'Gambar' },
          ]}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default CMSLandingPage;
