import { getSession } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

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
    let resumes: any[] = [];
    try {
        const resumesData = await api.get('/resumes/');
        resumes = Array.isArray(resumesData) ? resumesData : [];
    } catch (error) {
        console.error('Failed to fetch resumes from FastAPI:', error);
        resumes = [];
    }

    return <DashboardClient resumes={resumes} user={user} />;
}
