import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '@/types/ecommerce';

// Base API configuration from environment variable
export const BASE_BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

export const API_URL = `${BASE_BACKEND_URL}/api`;

/**
 * Get Bearer token from cookies or localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try reading from cookie 'auth-token' directly
    const cookies = document.cookie.split(';');
    const authTokenCookie = cookies.find((c) => c.trim().startsWith('auth-token='));
    if (authTokenCookie) {
      const val = authTokenCookie.split('=')[1];
      if (val) return decodeURIComponent(val);
    }

    // 2. Try reading from cookie 'user-info'
    const userInfoCookie = cookies.find((c) => c.trim().startsWith('user-info='));
    if (userInfoCookie) {
      const value = userInfoCookie.split('=')[1];
      const parsed = JSON.parse(decodeURIComponent(value));
      if (parsed?.token) return parsed.token;
      if (parsed?.access_token) return parsed.access_token;
      if (parsed?.plainTextToken) return parsed.plainTextToken;
    }

    // 2. Try reading from localStorage as fallback
    const localUser = localStorage.getItem('user-info');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      if (parsed?.token) return parsed.token;
      if (parsed?.access_token) return parsed.access_token;
    }

    const directToken = localStorage.getItem('token');
    if (directToken) return directToken;
  } catch (err) {
    console.error('Error retrieving auth token:', err);
  }

  return null;
}

/**
 * Centralized Axios Instance for KREZOEMA Ecommerce API
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // User is unauthorized
      console.warn('Unauthorized API request (401).');
    }
    return Promise.reject(error);
  }
);

/**
 * Extract human-readable error message from backend response
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.errors) {
      const firstField = Object.keys(data.errors)[0];
      if (firstField && data.errors[firstField]?.length) {
        return data.errors[firstField][0];
      }
    }
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 404) {
      return 'Data tidak ditemukan (404).';
    }
    if (error.response?.status === 403) {
      return 'Anda tidak memiliki akses untuk tindakan ini (403).';
    }
    if (error.response?.status === 401) {
      return 'Sesi login telah berakhir, silakan login kembali.';
    }
    if (error.response?.status === 500) {
      return 'Terjadi kesalahan pada server (500).';
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Terjadi kesalahan jaringan atau sistem. Silakan coba beberapa saat lagi.';
}

/**
 * Extract detailed field validation errors
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.errors) {
      Object.entries(data.errors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          result[field] = messages[0];
        }
      });
    }
  }
  return result;
}

/**
 * Format relative image URL to full backend URL
 */
export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_BACKEND_URL}${cleanPath}`;
}

/**
 * Format currency in IDR (Rupiah)
 */
export function formatRupiah(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(val));
}
