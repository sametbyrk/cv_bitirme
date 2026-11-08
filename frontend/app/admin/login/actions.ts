'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { checkRateLimit, getAuthRateLimitKeys } from '@/lib/ratelimit'

function redirectWithError(error: string): never {
    redirect(`/admin/login?error=${error}`)
}

export async function adminLogin(formData: FormData) {
    const emailValue = formData.get('email')
    const passwordValue = formData.get('password')
    const email = typeof emailValue === 'string' ? emailValue.trim().slice(0, 254) : ''
    const password = typeof passwordValue === 'string' ? passwordValue : ''

    if (!email || !password) {
        redirectWithError('missing-fields')
    }

    const requestHeaders = await headers()
    const limitStatus = await checkRateLimit(
        getAuthRateLimitKeys('admin-login', email, requestHeaders),
    )
    if (!limitStatus.success) {
        redirectWithError(limitStatus.reason === 'unavailable' ? 'unavailable' : 'rate-limited')
    }

    let user: User | null = null
    try {
        user = await prisma.user.findUnique({ where: { email } })
    } catch (error) {
        console.error('Admin login lookup failed:', error)
        redirectWithError('unavailable')
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
        redirectWithError('invalid-credentials')
    }

    // Read the current database role; never grant admin access from form data or a stale cookie claim.
    if (user.role !== 'admin') {
        redirectWithError('invalid-credentials')
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({
        user: {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
        },
    })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    })

    redirect('/admin')
}
