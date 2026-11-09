'use server'

import { getSession } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import type { ResumeData } from '@/context/ResumeContext';

export async function saveResume(data: ResumeData, resumeId?: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const title = data.personalInfo?.fullName ? `${data.personalInfo.fullName}'s Resume` : "Untitled Resume";

    if (resumeId) {
        // UPDATE existing resume via FastAPI
        await api.patch<unknown>(`/resumes/${resumeId}`, {
            title,
            content: data,
        });

        revalidatePath('/dashboard');
        return { success: true };
    } else {
        // CREATE new resume via FastAPI (Kota denetimi ve KVKK temizliği FastAPI içinde)
        const created = await api.post<{ id: string }>('/resumes/', {
            title,
            content: data,
        });

        revalidatePath('/dashboard');
        return { success: true, newId: created?.id };
    }
}

export async function deleteResume(resumeId: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    // DELETE via FastAPI
    await api.delete(`/resumes/${resumeId}`);

    revalidatePath('/dashboard');
}
