import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';
import { BRANDING_ASSETS } from '@/layout/branding';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

// Metadata halaman KREZOEMA
export const metadata: Metadata = {
    title: 'KREZOEMA — Admin/Operator',
    description: 'KREZOEMA — Creative Craft & Handmade Accessories Admin Dashboard',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'KREZOEMA — Admin/Operator Dashboard',
        url: 'https://krezoema.com',
        description: 'Creative Craft & Handmade Accessories Admin Panel',
        images: [BRANDING_ASSETS.logo],
        ttl: 604800
    },
    icons: {
        icon: BRANDING_ASSETS.favicon
    }
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            {/* Sidebar konfigurasi */}
            <AppConfig simple />
        </React.Fragment>
    );
}
