'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    // 1. Rate Limiting Check (Security - IP Based)
    const headersList = await headers();
    const ipIdentifier = headersList.get('x-forwarded-for') || 'unknown';
    const limitStatus = await checkRateLimit(ipIdentifier);

    if (!limitStatus.success) {
        return redirect(`/login?error=Too many attempts. Try again in ${limitStatus.reset} minutes.`)
    }

    if (!email || !password) {
        return redirect('/login?error=Email and password required')
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return redirect('/login?error=User already exists')
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        })

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })

        const cookieStore = await cookies()
        cookieStore.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Signup Error:', error.message) // Log only message
        return redirect(`/login?error=Signup failed`)
    }

    redirect('/dashboard')
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Rate Limiting Check (Security - IP Based)
    const headersList = await headers();
    const ipIdentifier = headersList.get('x-forwarded-for') || 'unknown';
    const limitStatus = await checkRateLimit(ipIdentifier);

    if (!limitStatus.success) {
        return redirect(`/login?error=Too many attempts. Try again in ${limitStatus.reset} minutes.`)
    }

    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return redirect('/login?error=Invalid credentials')
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return redirect('/login?error=Invalid credentials')
        }

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const userName = (user as any).name || ''
        const session = await encrypt({ user: { id: user.id, email: user.email, name: userName, role: user.role } })

        const cookieStore = await cookies()
        cookieStore.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Login Error:', error.message) // Sanitize log
        return redirect(`/login?error=Login failed`)
    }

    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0) })
    redirect('/login')
}
