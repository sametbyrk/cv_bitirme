import { getSession } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { ResumeSummary } from '@/lib/app-types';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
    // 1. Get Session
    const session = await getSession();

    // 2. Protect Route
    if (!session || !session.user) {
        redirect('/login');
    }

    const { user } = session;

    // 3. Fetch Resumes from FastAPI Backend
    let resumes: ResumeSummary[] = [];
    let resumeLoadFailed = false;
    try {
        resumes = (await api.get<ResumeSummary[]>('/resumes/')) ?? [];
    } catch (error) {
        console.error('Failed to fetch resumes from FastAPI:', error);
        resumeLoadFailed = true;
    }

    return <DashboardClient resumes={resumes} user={user} resumeLoadFailed={resumeLoadFailed} />;
}
