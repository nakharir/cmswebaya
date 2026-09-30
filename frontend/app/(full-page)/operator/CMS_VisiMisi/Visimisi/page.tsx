'use client';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import DataTableVisiMisi from '@/app/(full-page)/component/datatablevisimisi/datablevisimisi';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

interface VisiMisi {
  id: string;
  visi: string;
  misi: string;
}

export default function CMSVisiMisi() {
  const [data, setData] = useState<VisiMisi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  const columns = [
    { field: 'id', header: 'ID' },
    { field: 'visi', header: 'Visi' },
    { field: 'misi', header: 'Misi' },
  ];

  const getData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.GETVisiMisi);
      setData(res.data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal',
        detail: 'Gagal mengambil data!',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleAddData = async (visiList: string[], misiList: string[]) => {
    try {
      await axios.post(API_ENDPOINTS.TAMBAHVisiMisi, {
        visi: visiList.join(', '),
        misi: misiList.join(', '),
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Data berhasil ditambahkan!',
        life: 3000,
      });
      getData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal',
        detail: 'Gagal menambahkan data!',
        life: 3000,
      });
    }
  };

  const handleUpdateData = async (id: string, visiList: string[], misiList: string[]) => {
    try {
      await axios.put(API_ENDPOINTS.UPDATEVisiMisi(id), {
        visi: visiList.join(', '),
        misi: misiList.join(', '),
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Data berhasil diperbarui!',
        life: 3000,
      });
      getData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal',
        detail: 'Gagal memperbarui data!',
        life: 3000,
      });
    }
  };

  const handleDeleteData = async (id: string) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETEVisiMisi(id));
      toast.current?.show({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Data berhasil dihapus!',
        life: 3000,
      });
      getData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Gagal',
        detail: 'Gagal menghapus data!',
        life: 3000,
      });
    }
  };

  return (
    <div className="p-5">
      <Toast ref={toast} />
      <h1 className="text-2xl font-bold mb-4">CMS Visi & Misi</h1>
      <DataTableVisiMisi
        data={data}
        loading={loading}
        columns={columns}
        onAdd={handleAddData}
        onUpdate={handleUpdateData}
        onDelete={handleDeleteData}
      />
    </div>
  );
}
