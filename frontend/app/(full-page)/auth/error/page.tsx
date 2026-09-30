/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from 'primereact/button';

const ErrorPage = () => {
    const router = useRouter();

    return (
        <div className="flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden" style={{ backgroundColor: '#FAF8F5' }}>
            <div className="flex flex-column align-items-center justify-content-center p-4">
                <img src="/logo-krezoema.png" alt="KREZOEMA" className="mb-4" style={{ height: '4rem', width: 'auto' }} />
                <div
                    className="card p-6 flex flex-column align-items-center text-center"
                    style={{
                        maxWidth: '480px',
                        border: '1px solid #F8E4EB',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                >
                    <div className="flex justify-content-center align-items-center border-circle mb-4" style={{ height: '3.5rem', width: '3.5rem', backgroundColor: '#FEE2E2' }}>
                        <i className="pi pi-fw pi-exclamation-triangle text-3xl" style={{ color: '#EF4444' }}></i>
                    </div>
                    <h1 className="font-bold text-3xl mb-2" style={{ color: '#272329' }}>Terjadi Kesalahan</h1>
                    <p className="mb-5 text-sm" style={{ color: '#6B7280' }}>
                        Terjadi kendala saat memproses permintaan Anda. Silakan coba kembali atau hubungi administrator.
                    </p>
                    <Button
                        icon="pi pi-arrow-left"
                        label="Kembali ke Dashboard"
                        className="p-button-outlined"
                        style={{ color: '#D96C91', borderColor: '#D96C91' }}
                        onClick={() => router.push('/admin')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
