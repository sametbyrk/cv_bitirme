import { NextResponse } from 'next/server';
import { api, ApiError } from '@/lib/api-client';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        return NextResponse.json(await api.get('/ai/match/history'));
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.data || { detail: error.message }, { status: error.status });
        }
        console.error('ATS history proxy failed:', error);
        return NextResponse.json({ error: 'ATS history could not be loaded.' }, { status: 502 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json() as { id?: unknown };
        if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) {
            return NextResponse.json({ detail: { code: 'INVALID_HISTORY_ID' } }, { status: 422 });
        }
        await api.delete(`/ai/match/history/${encodeURIComponent(body.id)}`);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.data || { detail: error.message }, { status: error.status });
        }
        console.error('ATS history delete proxy failed:', error);
        return NextResponse.json({ error: 'ATS history could not be deleted.' }, { status: 502 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json() as {
            jobDescription?: unknown;
            resumeId?: unknown;
            currentResume?: unknown;
            targetLanguage?: unknown;
        };
        const hasSavedResume = typeof body.resumeId === 'string' && body.resumeId.length > 0;
        const hasDraft = !!body.currentResume && typeof body.currentResume === 'object' && !Array.isArray(body.currentResume);
        if (typeof body.jobDescription !== 'string' || hasSavedResume === hasDraft) {
            return NextResponse.json({ detail: { code: 'INVALID_REQUEST', message: 'İlan metni ile kayıtlı CV veya taslak CV gereklidir.' } }, { status: 422 });
        }
        let currentResume: Record<string, unknown> | undefined;
        if (hasDraft) {
            currentResume = { ...(body.currentResume as Record<string, unknown>) };
            const personalInfo = currentResume.personalInfo;
            if (personalInfo && typeof personalInfo === 'object' && !Array.isArray(personalInfo)) {
                currentResume.personalInfo = { ...(personalInfo as Record<string, unknown>), photo: null };
            }
        }

        const result = await api.post('/ai/match', {
            jobDescription: body.jobDescription,
            ...(hasSavedResume ? { resumeId: body.resumeId } : { currentResume }),
            targetLanguage: typeof body.targetLanguage === 'string' ? body.targetLanguage : 'en',
        });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            const headers = new Headers();
            if (error.retryAfter) headers.set('Retry-After', error.retryAfter);
            return NextResponse.json(error.data || { detail: error.message }, { status: error.status, headers });
        }
        console.error('ATS match proxy failed:', error);
        return NextResponse.json({ error: 'ATS matching request failed.' }, { status: 502 });
    }
}
