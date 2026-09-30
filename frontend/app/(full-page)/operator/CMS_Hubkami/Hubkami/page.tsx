'use client';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import DataTableHubungiKami from '@/app/(full-page)/component/datatablehubkami/datablehubkami';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

export default function CMSHubungiKami() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const columns = [
    { field: 'id', header: 'ID' },
    { field: 'judul', header: 'Judul' },
    { field: 'no_telp', header: 'No. Telp' },
    { field: 'email', header: 'Email' },
    { field: 'alamat', header: 'Alamat' },
  ];

  const getData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GETHubungiKami);
      setData(res.data);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengambil data!' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleAdd = async (form: any) => {
    try {
      await axios.post(API_ENDPOINTS.TAMBAHHubungiKami, form);
      toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil ditambahkan!' });
      getData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Gagal', detail: 'Gagal menambahkan data!' });
    }
  };

  const handleUpdate = async (id: string, form: any) => {
    try {
      await axios.put(API_ENDPOINTS.UPDATEHubungiKami(id), form);
      toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil diperbarui!' });
      getData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui data!' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETEHubungiKami(id));
      toast.current?.show({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil dihapus!' });
      getData();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data!' });
    }
  };

  return (
    <div className="p-5">
      <Toast ref={toast} />
     
      <DataTableHubungiKami
        data={data}
        loading={loading}
        columns={columns}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
