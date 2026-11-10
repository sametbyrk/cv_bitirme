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
        const currentResume = body.currentResume && typeof body.currentResume === 'object'
            ? { ...body.currentResume }
            : body.currentResume;
        if (currentResume?.personalInfo && typeof currentResume.personalInfo === 'object') {
            currentResume.personalInfo = { ...currentResume.personalInfo, photo: null };
        }
        const result = await api.post('/ai/tailor', {
            jobDescription: body.jobDescription,
            resumeContent: currentResume,
            targetLanguage: body.targetLanguage,
            userFeedback: body.userFeedback,
            previousTailoredContent: body.previousTailoredContent,
            iterationCount: body.iterationCount ?? 0,
        });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.data || { detail: error.message }, { status: error.status });
        }
        console.error('Auto-Tailor proxy failed:', error);
        return NextResponse.json({ error: 'AI service request failed.' }, { status: 502 });
    }
}
