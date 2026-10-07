'use server'

import { getSession } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function saveResume(data: any, resumeId?: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const title = data.personalInfo?.fullName ? `${data.personalInfo.fullName}'s Resume` : "Untitled Resume";

    if (resumeId) {
        // UPDATE existing resume via FastAPI
        await api.patch(`/resumes/${resumeId}`, {
            title,
            content: data,
        });

        revalidatePath('/dashboard');
        return { success: true };
    } else {
        // CREATE new resume via FastAPI (Kota denetimi ve KVKK temizliği FastAPI içinde)
        const created = await api.post('/resumes/', {
            title,
            content: data,
        });

        revalidatePath('/dashboard');
        return { success: true, newId: created.id };
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
