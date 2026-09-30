import axios from 'axios';
import { BASE_API_URL } from './api';

/**
 * Membaca nilai cookie berdasarkan nama.
 * Digunakan untuk mengambil 'auth-token' yang disimpan saat login.
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
}

/**
 * Axios instance dengan base URL dan interceptor Bearer token otomatis.
 * Gunakan `axiosInstance` ini di seluruh aplikasi menggantikan `axios` langsung.
 */
const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// Interceptor: sisipkan Bearer token sebelum setiap request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getCookie('auth-token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: handle 401 (token expired/invalid) → redirect ke login
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 && typeof window !== 'undefined') {
            // Hapus cookies dan redirect ke halaman login
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'user-info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
