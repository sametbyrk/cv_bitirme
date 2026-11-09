'use server';

import { getSession } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function renameResume(resumeId: string, newTitle: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    if (!newTitle.trim()) {
        throw new Error("Title cannot be empty");
    }

    await api.patch<unknown>(`/resumes/${resumeId}`, {
        title: newTitle.trim(),
    });

    revalidatePath('/dashboard');
    return { success: true };
}

export async function duplicateResume(resumeId: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    // FastAPI duplicate endpoint'i kota denetimi ve kopyalamayı tek adımda yürütür
    await api.post<unknown>(`/resumes/${resumeId}/duplicate`);

    revalidatePath('/dashboard');
    return { success: true };
}
