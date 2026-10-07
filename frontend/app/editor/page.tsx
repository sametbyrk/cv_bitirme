

import React from 'react';
import { ResumeProvider } from '@/context/ResumeContext';
import { ResumeEditor } from '@/components/ResumeEditor';
import { getSession } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorPage() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    let isPremium = false;
    try {
        const userProfile = await api.get('/users/me');
        isPremium = userProfile?.isPremium || false;
    } catch {
        isPremium = false;
    }

    return (
        <ResumeProvider userId={session.user.id}>
            <ResumeEditor isPremium={isPremium} />
        </ResumeProvider>
    );
}
