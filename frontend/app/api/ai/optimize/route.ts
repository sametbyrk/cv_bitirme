import { NextResponse } from 'next/server';
import { api, ApiError } from '@/lib/api-client';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const result = await api.post('/ai/optimize-field', {
            text: body.text,
            type: body.type,
            targetLanguage: body.targetLanguage,
        });
        // Usage is charged only after the user accepts the preview.
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.data || { detail: error.message }, { status: error.status });
        }
        console.error('AI rewrite proxy failed:', error);
        return NextResponse.json({ error: 'AI service request failed.' }, { status: 502 });
    }
}
