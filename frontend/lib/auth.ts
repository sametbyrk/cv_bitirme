import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { JWTPayload } from 'jose'

export type SessionUser = {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
};

export type SessionPayload = JWTPayload & { user: SessionUser };

const secretKey = process.env.APP_AUTH_JWT_SECRET!;
if (!secretKey) {
    throw new Error('APP_AUTH_JWT_SECRET is not defined in environment variables');
}
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        })
        const user = payload.user;
        if (typeof user !== 'object' || user === null || Array.isArray(user)) return null;
        const sessionUser = user as Record<string, unknown>;
        if (typeof sessionUser.id !== 'string' || typeof sessionUser.email !== 'string') return null;
        return {
            ...payload,
            user: {
                id: sessionUser.id,
                email: sessionUser.email,
                name: typeof sessionUser.name === 'string' ? sessionUser.name : null,
                role: typeof sessionUser.role === 'string' ? sessionUser.role : undefined,
            },
        };
    } catch {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null
    return await decrypt(session)
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value
    if (!session) return

    const parsed = await decrypt(session)
    if (!parsed) return;

    const res = NextResponse.next()
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    })
    return res
}
