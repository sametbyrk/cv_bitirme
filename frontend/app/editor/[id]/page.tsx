import { getSession } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { redirect } from "next/navigation";
import { ResumeProvider } from "@/context/ResumeContext";
import { ResumeEditor } from "@/components/ResumeEditor";
import React from 'react';

function EditorClientWrapper({ initialData, isPremium, resumeId, userId }: { initialData: any, isPremium: boolean, resumeId: string, userId: string }) {
    return (
        <ResumeProvider initialData={initialData} userId={userId} resumeId={resumeId}>
            <ResumeEditor isPremium={isPremium} resumeId={resumeId} />
        </ResumeProvider>
    );
}

export const dynamic = 'force-dynamic';

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }

    const { id } = await params;

    try {
        // FastAPI'den CV verisini ve kullanıcı profilini çek
        const [resume, userProfile] = await Promise.all([
            api.get(`/resumes/${id}`),
            api.get('/users/me').catch(() => ({ isPremium: false })),
        ]);

        if (!resume) {
            return <div className="p-8 text-center text-red-600 font-medium">Özgeçmiş bulunamadı veya erişim yetkiniz yok.</div>;
        }

        const isPremium = userProfile?.isPremium || false;
        const parsedContent = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {});

        return (
            <EditorClientWrapper
                initialData={parsedContent}
                isPremium={isPremium}
                resumeId={id}
                userId={session.user.id}
            />
        );
    } catch (error: any) {
        console.error("Failed to load resume from FastAPI:", error);
        return <div className="p-8 text-center text-red-600 font-medium">Özgeçmiş yüklenirken bir hata oluştu: {error?.message || 'Erişim reddedildi'}</div>;
    }
}
