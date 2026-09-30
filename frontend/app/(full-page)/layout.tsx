import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';

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
        images: ['/logo-krezoema.png'],
        ttl: 604800
    },
    icons: {
        icon: '/logo-krezoema.png'
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
