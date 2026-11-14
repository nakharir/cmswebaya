import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const userInfo = request.cookies.get('user-info')?.value;

    if (!userInfo) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
        const user = JSON.parse(userInfo);
        const role = user.role;

        const isAdmin = role === 'admin' || role === 'super_admin';
        const isOperator = role === 'operator';
        const isCustomer = role === 'customer';

        // Arahkan pengguna sesuai role saat membuka halaman utama
        if (path === '/') {
            if (isAdmin) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }

            if (isOperator) {
                return NextResponse.redirect(new URL('/operator', request.url));
            }

            if (isCustomer) {
                return NextResponse.redirect(new URL('/customer/produk', request.url));
            }

            return NextResponse.redirect(new URL('/auth/access', request.url));
        }

        // Halaman admin hanya untuk admin dan super admin
        if (path.startsWith('/admin')) {
            if (isAdmin) {
                return NextResponse.next();
            }

            return NextResponse.redirect(new URL('/auth/access', request.url));
        }

                // Halaman operator dan CMS
        if (path.startsWith('/operator')) {
            const isAdminCmsPage = [
                '/operator/CMS_Landing',
                '/operator/CMS_Profile',
                '/operator/CMS_berita',
                '/operator/CMS_Hubkami',
            ].some((cmsPath) => path.startsWith(cmsPath));

            if (isOperator || (isAdmin && isAdminCmsPage)) {
                return NextResponse.next();
            }

            return NextResponse.redirect(new URL('/auth/access', request.url));
        }

        // Halaman customer hanya untuk customer
        if (path.startsWith('/customer')) {
            if (isCustomer) {
                return NextResponse.next();
            }

            return NextResponse.redirect(new URL('/auth/access', request.url));
        }

        return NextResponse.next();

    } catch {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('user-info');
        return response;
    }
}

export const config = {
    matcher: [
        '/',
        '/admin/:path*',
        '/operator/:path*',
        '/customer/:path*',
    ]
};