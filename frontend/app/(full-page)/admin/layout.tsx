import { Metadata } from 'next';
import Layout from '../../../layout/layout';
import { BRANDING_ASSETS } from '@/layout/branding';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'KREZOEMA — Admin/Operator',
    description: 'KREZOEMA — Creative Craft & Handmade Accessories Admin Dashboard',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'KREZOEMA — Admin Dashboard',
        url: 'https://krezoema.com',
        description: 'Creative Craft & Handmade Accessories Admin Panel',
        images: [BRANDING_ASSETS.logo],
        ttl: 604800
    },
    icons: {
        icon: BRANDING_ASSETS.favicon
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
