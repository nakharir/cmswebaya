'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import DataTableWithCRUD from '@/app/(full-page)/component/datatableprofile/datableprofile';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

const CMSProfileSekolah = () => {
    const [dataList, setDataList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API_ENDPOINTS.GETProfileSekolah);
            setDataList(res.data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal ambil data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (section: string, judul: string, konten: string, gambar: File | null, email?: string, alamat?: string, no_telp?: string) => {
        const formData = new FormData();
        formData.append('section', section);
        formData.append('judul', judul);
        formData.append('konten', konten);
        if (email) formData.append('email', email);
        if (alamat) formData.append('alamat', alamat);
        if (no_telp) formData.append('no_telp', no_telp);
        if (gambar) formData.append('gambar', gambar);

        try {
            setIsLoading(true);
            await axios.post(API_ENDPOINTS.TAMBAHProfileSekolah, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil ditambahkan' });
            fetchData();
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal menambah data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (id: string, section: string, judul: string, konten: string, gambar: File | null, email?: string, alamat?: string, no_telp?: string) => {
        const formData = new FormData();
        if (section) formData.append('section', section);
        if (judul) formData.append('judul', judul);
        if (konten) formData.append('konten', konten);
        if (email) formData.append('email', email);
        if (alamat) formData.append('alamat', alamat);
        if (no_telp) formData.append('no_telp', no_telp);
        if (gambar) formData.append('gambar', gambar);
        formData.append('_method', 'PUT');

        try {
            setIsLoading(true);
            await axios.post(API_ENDPOINTS.UPDATEProfileSekolah(id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil diperbarui' });
            fetchData();
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal update data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await axios.delete(API_ENDPOINTS.DELETEProfileSekolah(id));
            toast.current?.show({ severity: 'success', summary: 'Sukses', detail: 'Data dihapus' });
            fetchData();
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal hapus data' });
        } finally {
            setIsLoading(false);
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
                <DataTableWithCRUD
                    data={dataList}
                    loading={isLoading}
                    columns={[
                        { field: 'section', header: 'Section' },
                        { field: 'judul', header: 'Judul' },
                        { field: 'konten', header: 'Konten' },
                        { field: 'gambar', header: 'Gambar' },
                        { field: 'email', header: 'Email' },
                        { field: 'alamat', header: 'Alamat' },
                        { field: 'no_telp', header: 'No Telp' },
                    ]}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    nameField="section"
                    nameField2="judul"
                    nameField3="konten"
                    inputLabel="Section"
                    inputLabel2="Judul"
                    inputLabel3="Konten"
                />
            )}
        </>
    );
};

export default CMSProfileSekolah;
