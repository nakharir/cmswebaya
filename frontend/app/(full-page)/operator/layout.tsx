import { Metadata } from 'next';
import Layout from '../../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'KREZOEMA — Admin/Operator',
    description: 'KREZOEMA — Creative Craft & Handmade Accessories Operator Dashboard',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'KREZOEMA — Operator Dashboard',
        url: 'https://krezoema.com',
        description: 'Creative Craft & Handmade Accessories Operator Panel',
        images: ['/logo-krezoema.png'],
        ttl: 604800
    },
    icons: {
        icon: '/logo-krezoema.png'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
