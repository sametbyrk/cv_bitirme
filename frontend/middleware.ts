import { NextRequest, NextResponse } from 'next/server'
import { decrypt, updateSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Public paths where auth is not required
    // Add '/auth' for callback if needed, but we are local now
    if (path === '/login' || path === '/' || path.startsWith('/auth')) {
        return await updateSession(request) || NextResponse.next()
    }

    // Check for session
    const session = request.cookies.get('session')?.value
    console.log('Middleware: Path:', path, 'Session cookie:', session ? 'Present' : 'Missing')

    if (!session) {
        console.log('Middleware: Redirecting to login (No Session)')
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify session
    try {
        const payload = await decrypt(session)
        console.log('Middleware: Decrypt result:', payload ? 'Success' : 'Failed')

        if (!payload) {
            // Invalid token
            console.log('Middleware: Redirecting to login (Invalid Token)')
            return NextResponse.redirect(new URL('/login?error=Invalid_token', request.url))
        }
    } catch (err) {
        console.error('Middleware: Decrypt Error:', err)
        return NextResponse.redirect(new URL('/login?error=Token_error', request.url))
    }

    // Refresh session if valid
    return await updateSession(request) || NextResponse.next()
}

export const config = {
    matcher: [
        // Pattern to match protected routes
        '/dashboard/:path*',
        '/editor/:path*'
    ],
}
