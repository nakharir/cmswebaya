# KREZOEMA Frontend (Next.js)

## Setup Setelah Clone

```bash
# 1. Install dependencies
npm install

# 2. Buat file environment dari template
cp .env.example .env.local      # Linux/Mac
# copy .env.example .env.local  # Windows

# 3. Edit .env.local jika URL backend berbeda dari default:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

> **Catatan Logo**: File `public/logo-krezoema.png` yang ada di repository adalah
> placeholder 1×1 pixel transparan. Ganti dengan file logo KREZOEMA yang asli.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## Dokumentasi

-   [Next.js Documentation](https://nextjs.org/docs)
-   [Setup lengkap project (root README)](../README.md)
