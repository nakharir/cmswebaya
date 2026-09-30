/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { API_ENDPOINTS } from '@/app/api/losbackend/api';

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState('Email atau password salah. Silakan coba lagi.');
    const { layoutConfig } = useContext(LayoutContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setShowAlert(false);
        setErrorMessage('Email atau password salah. Silakan coba lagi.');
        try {
            // Login langsung dengan Bearer token — tidak perlu CSRF cookie
            // karena backend menggunakan Sanctum token (createToken), bukan session cookie
            const response = await axios.post(
                API_ENDPOINTS.LOGIN,
                { email, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            console.log('Login response:', response.data);

            // Handle berbagai format response Laravel:
            // 1. Direct: { status: 1, token: '...' }
            // 2. Nested: { data: { status: 1, token: '...' } }
            const userData = response.data?.data ?? response.data;

            if (!userData || userData.status === undefined) {
                console.error('Format response tidak dikenali:', response.data);
                router.push('/auth/error');
                return;
            }

            // Simpan token Bearer ke cookie terpisah untuk digunakan di request API
            if (userData.token) {
                document.cookie = `auth-token=${userData.token}; path=/; SameSite=Lax`;
            }

            // Simpan user info ke cookie untuk middleware (proteksi route)
            document.cookie = `user-info=${JSON.stringify(userData)}; path=/; SameSite=Lax`;

            if (userData.status === 2 || userData.status === 3) {
                router.push('/operator/');
            } else if (userData.status === 1) {
                router.push('/admin/');
            } else {
                router.push('/auth/error');
            }
        } catch (error: any) {
            console.error('Terjadi kesalahan!', error);

            if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
                // Backend tidak dapat dijangkau
                setErrorMessage(
                    `Tidak dapat terhubung ke server (${process.env.NEXT_PUBLIC_API_URL}). ` +
                    'Pastikan backend Laravel sudah berjalan.'
                );
            } else if (error?.response?.status === 419) {
                // CSRF token mismatch — backend menolak karena tidak ada/salah CSRF token
                setErrorMessage(
                    'Sesi keamanan tidak valid (CSRF). Refresh halaman dan coba lagi, ' +
                    'atau pastikan CORS & Sanctum sudah dikonfigurasi di backend.'
                );
            } else if (error?.response?.status === 401 || error?.response?.status === 422) {
                // Kredensial salah
                setErrorMessage('Email atau password salah. Silakan coba lagi.');
            } else if (error?.response?.data?.message) {
                // Pesan error dari server
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
            }

            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-column md:flex-row min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
            {/* Bagian Kiri - Form Login */}
            <div
                className="w-full md:w-6 flex flex-column justify-content-center align-items-center p-6 md:p-8"
                style={{ backgroundColor: '#FFFFFF' }}
            >
                <div className="w-full" style={{ maxWidth: '420px' }}>
                    <div className="mb-5 flex align-items-center gap-3">
                        <img
                            src="/logo-krezoema.png"
                            alt="KREZOEMA Logo"
                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                        <div>
                            <h2 className="m-0 text-2xl font-bold" style={{ color: '#272329', letterSpacing: '0.03em' }}>
                                KREZOEMA
                            </h2>
                            <p className="m-0 text-xs font-semibold" style={{ color: '#B94F76' }}>
                                Creative Craft &amp; Handmade Accessories
                            </p>
                        </div>
                    </div>

                    <div className="mb-5">
                        <h1 className="text-2xl font-bold m-0 mb-1" style={{ color: '#272329' }}>
                            Masuk ke Dashboard
                        </h1>
                        <p className="text-sm m-0" style={{ color: '#6B7280' }}>
                            Panel Admin &amp; Operator KREZOEMA
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#272329' }}>
                                Email
                            </label>
                            <InputText
                                id="email"
                                type="email"
                                placeholder="Masukkan email terdaftar"
                                className="w-full p-3 border-round-md"
                                style={{ borderColor: '#E5E7EB' }}
                                value={email}
                                onChange={handleEmailChange}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#272329' }}>
                                Password
                            </label>
                            <Password
                                inputId="password"
                                placeholder="Masukkan password"
                                toggleMask
                                feedback={false}
                                className="w-full"
                                inputClassName="w-full p-3 border-round-md"
                                inputStyle={{ borderColor: '#E5E7EB' }}
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        {/* Alert Error Login */}
                        {showAlert && (
                            <div
                                className="p-3 mb-4 border-round text-sm font-medium flex align-items-center gap-2"
                                style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                            >
                                <i className="pi pi-exclamation-triangle"></i>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            label={isLoading ? 'Memproses...' : 'Masuk ke Akun'}
                            icon={isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
                            className="w-full p-3 text-base font-bold border-none border-round-md transition-colors"
                            style={{
                                backgroundColor: '#D96C91',
                                color: '#FFFFFF',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                            disabled={isLoading}
                        />
                    </form>

                    <div className="mt-5 pt-4 text-center border-top-1" style={{ borderColor: '#F0ECE6' }}>
                        <p className="text-xs m-0" style={{ color: '#9CA3AF' }}>
                            &copy; {new Date().getFullYear()} KREZOEMA. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bagian Kanan - Brand Visual Banner */}
            <div
                className="hidden md:flex md:w-6 flex-column align-items-center justify-content-center p-8 text-center"
                style={{
                    backgroundColor: '#FAF8F5',
                    borderLeft: '1px solid #F0ECE6'
                }}
            >
                <div style={{ maxWidth: '460px' }}>
                    <div
                        className="p-5 border-round-xl mb-5"
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #F8E4EB',
                            boxShadow: '0 4px 20px rgba(217, 108, 145, 0.08)'
                        }}
                    >
                        <img
                            src="/logo-krezoema.png"
                            alt="KREZOEMA"
                            className="mb-4"
                            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                        />
                        <h2 className="text-3xl font-extrabold m-0 mb-2" style={{ color: '#272329' }}>
                            KREZOEMA
                        </h2>
                        <span
                            className="inline-block px-3 py-1 border-round-md text-xs font-bold mb-4"
                            style={{ backgroundColor: '#F8E4EB', color: '#B94F76' }}
                        >
                            CREATIVE CRAFT &amp; HANDMADE ACCESSORIES
                        </span>
                        <blockquote
                            className="m-0 p-3 border-round-md text-sm italic font-medium"
                            style={{
                                borderLeft: '3px solid #D96C91',
                                backgroundColor: '#FAF8F5',
                                color: '#4B5563'
                            }}
                        >
                            &ldquo;Dari kreativitas menjadi karya, dari karya menjadi identitas.&rdquo;
                        </blockquote>
                    </div>

                    <div className="flex justify-content-center gap-4 text-xs font-semibold" style={{ color: '#6B7280' }}>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#D96C91' }}></i>
                            <span>Catalog Manager</span>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#D96C91' }}></i>
                            <span>Stock Monitor</span>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#D96C91' }}></i>
                            <span>Web CMS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
