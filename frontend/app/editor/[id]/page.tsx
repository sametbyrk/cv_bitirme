import { getSession } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import { ResumeProvider, type ResumeData } from '@/context/ResumeContext';
import { ResumeEditor } from '@/components/ResumeEditor';
import type { ResumeRecord, UserProfile } from '@/lib/app-types';

function EditorClientWrapper({
    initialData,
    isPremium,
    resumeId,
    userId,
}: {
    initialData: ResumeData;
    isPremium: boolean;
    resumeId: string;
    userId: string;
}) {
    return (
        <ResumeProvider initialData={initialData} userId={userId} resumeId={resumeId}>
            <ResumeEditor isPremium={isPremium} resumeId={resumeId} />
        </ResumeProvider>
    );
}

export const dynamic = 'force-dynamic';

type EditorPageState =
    | { kind: 'loaded'; resumeData: ResumeData; isPremium: boolean }
    | { kind: 'not-found' }
    | { kind: 'error'; message: string };

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Access denied';
}

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) redirect('/login');

    const { id } = await params;
    let pageState: EditorPageState;

    try {
        const [resume, userProfile] = await Promise.all([
            api.get<ResumeRecord>(`/resumes/${id}`),
            api.get<UserProfile>('/users/me').catch(() => ({ isPremium: false })),
        ]);

        if (!resume) {
            pageState = { kind: 'not-found' };
        } else {
            const parsedContent: unknown = typeof resume.content === 'string'
                ? JSON.parse(resume.content)
                : resume.content;
            if (typeof parsedContent !== 'object' || parsedContent === null || Array.isArray(parsedContent)) {
                throw new Error('CV içeriği geçersiz.');
            }
            pageState = {
                kind: 'loaded',
                resumeData: parsedContent as ResumeData,
                isPremium: userProfile?.isPremium ?? false,
            };
        }
    } catch (error: unknown) {
        console.error('Failed to load resume from FastAPI:', error);
        pageState = { kind: 'error', message: getErrorMessage(error) };
    }

    if (pageState.kind === 'not-found') {
        return <div className="p-8 text-center text-red-600 font-medium">Resume not found or you do not have permission to access it.</div>;
    }
    if (pageState.kind === 'error') {
        return <div className="p-8 text-center text-red-600 font-medium">An error occurred while loading the resume: {pageState.message}</div>;
    }

    return (
        <EditorClientWrapper
            initialData={pageState.resumeData}
            isPremium={pageState.isPremium}
            resumeId={id}
            userId={session.user.id}
        />
    );
}
