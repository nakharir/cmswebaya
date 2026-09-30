/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';
import axios from 'axios';

interface User {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    status: number;
}

const SignupPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<User>({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        status: 1
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prevData => ({
            ...prevData,
            password: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(API_ENDPOINTS.REGISTER, formData);
            router.push('/auth/login');
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-column md:flex-row min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
            <div className="w-full md:w-6 flex flex-column justify-content-center align-items-center p-6 md:p-8" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="w-full" style={{ maxWidth: '440px' }}>
                    <div className="mb-4 flex align-items-center gap-3">
                        <img src="/logo-krezoema.png" alt="KREZOEMA" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                        <div>
                            <h2 className="m-0 text-xl font-bold" style={{ color: '#272329' }}>KREZOEMA</h2>
                            <p className="m-0 text-xs font-semibold" style={{ color: '#B94F76' }}>Creative Craft &amp; Handmade Accessories</p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#272329' }}>Daftar Akun Baru</h1>
                    <p className="text-sm text-gray-600 mb-4">Registrasi akun admin &amp; operator KREZOEMA</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="block text-sm font-semibold mb-1" style={{ color: '#272329' }}>Nama Lengkap</label>
                            <InputText id="name" type="text" placeholder="Nama lengkap" className="w-full p-3 border-round" value={formData.name} onChange={handleInputChange} required />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: '#272329' }}>Email</label>
                            <InputText id="email" type="email" placeholder="Alamat email" className="w-full p-3 border-round" value={formData.email} onChange={handleInputChange} required />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="block text-sm font-semibold mb-1" style={{ color: '#272329' }}>Password</label>
                            <Password inputId="password" placeholder="Password" toggleMask className="w-full" inputClassName="w-full p-3 border-round" value={formData.password} onChange={handlePasswordChange} required />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="phone" className="block text-sm font-semibold mb-1" style={{ color: '#272329' }}>No. Handphone</label>
                            <InputText id="phone" type="text" placeholder="Nomor telepon aktif" className="w-full p-3 border-round" value={formData.phone} onChange={handleInputChange} />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="address" className="block text-sm font-semibold mb-1" style={{ color: '#272329' }}>Alamat</label>
                            <InputText id="address" type="text" placeholder="Alamat domisili" className="w-full p-3 border-round" value={formData.address} onChange={handleInputChange} />
                        </div>

                        <Button
                            type="submit"
                            label={isLoading ? 'Mendaftarkan...' : 'Daftar Akun'}
                            className="w-full p-3 text-base font-bold border-none border-round transition-colors"
                            style={{ backgroundColor: '#D96C91', color: '#FFFFFF' }}
                            disabled={isLoading}
                        />
                    </form>

                    <div className="mt-4 text-center">
                        <span className="text-sm text-gray-600">Sudah punya akun? </span>
                        <Link href="/auth/login" className="font-semibold" style={{ color: '#B94F76' }}>
                            Masuk di sini
                        </Link>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex md:w-6 flex-column align-items-center justify-content-center p-8 text-center" style={{ backgroundColor: '#FAF8F5', borderLeft: '1px solid #F0ECE6' }}>
                <div style={{ maxWidth: '420px' }}>
                    <img src="/logo-krezoema.png" alt="KREZOEMA" className="mb-4" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                    <h2 className="text-2xl font-extrabold m-0 mb-2" style={{ color: '#272329' }}>KREZOEMA</h2>
                    <blockquote className="m-0 p-3 border-round text-sm italic font-medium" style={{ borderLeft: '3px solid #D96C91', backgroundColor: '#FFFFFF', color: '#4B5563' }}>
                        &ldquo;Dari kreativitas menjadi karya, dari karya menjadi identitas.&rdquo;
                    </blockquote>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
