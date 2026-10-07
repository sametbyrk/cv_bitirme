import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 saniye timeout

async function pingWithRetry(maxAttempts = 3, delayMs = 3000): Promise<{ success: boolean; attempts: number; error?: string }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Supabase'in bunu gerçek bir aktiflik olarak sayması için User tablosunu sorguluyoruz
            await prisma.user.count();
            return { success: true, attempts: attempt };
        } catch (err: any) {
            console.warn(`Ping attempt ${attempt}/${maxAttempts} failed:`, err?.message);
            if (attempt < maxAttempts) {
                // Supabase uyandırma süresi için bekle
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                return { success: false, attempts: attempt, error: err?.message };
            }
        }
    }
    return { success: false, attempts: maxAttempts };
}

export async function GET(request: Request) {
    // Vercel Cron güvenliği
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const result = await pingWithRetry(3, 4000);

    if (result.success) {
        console.log(`✅ Supabase pinged OK (attempt ${result.attempts})`);
        return NextResponse.json({
            status: 'ok',
            message: `Supabase is alive! (attempt ${result.attempts})`,
            timestamp: new Date().toISOString()
        });
    } else {
        console.error(`❌ Supabase ping failed after ${result.attempts} attempts:`, result.error);
        return NextResponse.json({
            status: 'error',
            message: `Failed after ${result.attempts} attempts`,
            error: result.error,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
