# KREZOEMA — CMS & Ecommerce

Project fullstack KREZOEMA menggunakan **Next.js** (frontend) + **Laravel** (backend).

---

## ⚠️ PENTING: Langkah Setup Wajib Setelah Clone

Lakukan langkah-langkah berikut **setiap kali** repository di-clone ke komputer baru.

---

### 1. Setup Backend (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Buat file .env dari template
cp .env.example .env   # atau: copy .env.example .env (Windows)

# Generate app key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate

# WAJIB: Buat symlink storage agar gambar produk dapat diakses
php artisan storage:link

# Jalankan backend
php artisan serve
```

> **Kenapa `storage:link` wajib?**
> Gambar produk disimpan di `backend/storage/app/public/ecommerce/products/`.
> Laravel membutuhkan symbolic link `backend/public/storage → backend/storage/app/public`
> agar gambar dapat diakses via URL `/storage/ecommerce/products/...`.
> Symlink ini **tidak bisa di-commit ke Git**, sehingga harus dibuat ulang setiap clone.

---

### 2. Setup Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Buat file environment
cp .env.example .env.local   # atau: copy .env.example .env.local (Windows)

# Edit .env.local jika URL backend berbeda:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Jalankan frontend
npm run dev
```

---

### 3. Logo KREZOEMA

> **Catatan**: File `frontend/public/logo-krezoema.png` yang ada di repository
> adalah file **placeholder 1×1 pixel transparan**. Logo KREZOEMA yang asli perlu
> Anda masukkan sendiri.
>
> Ganti file tersebut dengan logo asli Anda:
> - Path: `frontend/public/logo-krezoema.png`
> - Format: PNG, disarankan ukuran minimal 200×200 px
> - Setelah mengganti, jalankan: `git add frontend/public/logo-krezoema.png && git commit -m "chore: update logo krezoema"`

---

## Struktur Project

```
cmscobain/
├── frontend/       (Next.js — port 3000)
│   ├── app/        (halaman & API client)
│   ├── public/     (static assets — logo, theme images)
│   └── layout/     (komponen layout sidebar/topbar)
└── backend/        (Laravel — port 8000)
    ├── app/Http/Controllers/Ecommerce/
    ├── storage/app/public/ecommerce/products/  (gambar produk upload)
    └── public/storage  ← symlink (dibuat via `php artisan storage:link`)
```

---

## Troubleshooting Gambar

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Gambar produk tidak muncul (404) | Symlink storage belum dibuat | `php artisan storage:link` |
| Logo KREZOEMA tidak tampil | File placeholder, bukan logo asli | Ganti `frontend/public/logo-krezoema.png` |
| Gambar tampil di lokal tapi tidak setelah deploy | `NEXT_PUBLIC_API_URL` masih localhost | Update `.env.local` dengan URL produksi |
