import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    
    // Ambil data user dari cookies
    const userInfo = request.cookies.get('user-info')?.value
    
    if (!userInfo) {
        // Jika tidak ada user info, redirect ke login
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    try {
        const user = JSON.parse(userInfo)
        
        // Cek role/akses berdasarkan path
        if (path === '/') {
            if (user.status === 2 || user.status === 3) {
                return NextResponse.redirect(new URL('/operator', request.url))
            } else if (user.status === 1) {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
        }

        // Admin hanya boleh akses /admin
        if (path.startsWith('/admin')) {
            if (user.status === 1) {
                return NextResponse.next()
            }
            // Bukan admin, tolak akses
            return NextResponse.redirect(new URL('/auth/access', request.url))
        }

        // Operator hanya boleh akses /operator
        if (path.startsWith('/operator')) {
            if (user.status === 2 || user.status === 3) {
                return NextResponse.next()
            }
            // Bukan operator, tolak akses
            return NextResponse.redirect(new URL('/auth/access', request.url))
        }

        return NextResponse.next()
        
    } catch (error) {
        // Jika terjadi error parsing JSON, hapus cookie dan redirect ke login
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('user-info')
        return response
    }
}

export const config = {
    matcher: [
        '/',
        '/admin/:path*',
        '/operator/:path*',
    ]
}

