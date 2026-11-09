import type { ResumeData } from '@/context/ResumeContext';
export type { SessionUser } from '@/lib/auth';

export type ResumeSummary = {
    id: string;
    title: string;
    createdAt?: string | Date | null;
};

export type ResumeRecord = ResumeSummary & {
    content?: ResumeData | string | null;
};

export type UserProfile = {
    isPremium?: boolean;
};
