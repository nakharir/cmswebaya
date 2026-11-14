/**
 * KREZOEMA CMS — Centralized Branding Assets Configuration
 *
 * Lokasi aset logo terpusat: public/images/branding/
 * File gambar ditempatkan secara manual oleh pengguna:
 * - logo.png      : Logo utama (default / background terang)
 * - logo-dark.png : Logo alternatif untuk background gelap / kontras khusus
 * - favicon.png   : Favicon website
 */
export const BRANDING_ASSETS = {
    logo: '/images/branding/logo.png',
    logoDark: '/images/branding/logo-dark.png',
    favicon: '/images/branding/favicon.png',
} as const;

export type BrandingAssets = typeof BRANDING_ASSETS;
