export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=Google_Auth_Failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=No_Code', request.url));
    }

    // CSRF Check
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!state || !storedState || state !== storedState) {
        console.error("CSRF Mismatch: ", { state, storedState });
        return NextResponse.redirect(new URL('/login?error=Invalid_State_Refresh_Try_Again', request.url));
    }

    // Clear state cookie
    cookieStore.delete('oauth_state');

    try {
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

        // 1. Exchange Code for Tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Google Token Error:', tokens);
            throw new Error(tokens.error_description || 'Failed to get tokens');
        }

        // 2. Get User Info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            throw new Error('No email found in Google profile');
        }

        // 3. Find or Create User in DB
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            // Generate a random password for OAuth users (they won't use it likely)
            // But we HASH it for security best practices.
            const randomPassword = uuidv4();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    password: hashedPassword,
                },
            });
        }

        // 4. Create Session (Cookie)
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name || '', role: user.role } });

        const cookieStore = await cookies();
        cookieStore.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (err: any) {
        console.error('Google Callback Error:', err);
        return NextResponse.redirect(new URL(`/login?error=Login_Error: ${err.message}`, request.url));
    }
}
