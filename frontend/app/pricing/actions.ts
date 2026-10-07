'use server';

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function upgradeToPremium() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    // Use raw SQL to bypass stale Prisma Client types (no restart needed for this query)
    // await prisma.$executeRaw`UPDATE "User" SET "isPremium" = true WHERE "id" = ${session.user.id}`;

    // DISABLED FOR SECURITY UNTIL PAYMENT INTEGRATION
    throw new Error("Manual upgrade disabled. Please wait for payment integration.");

    revalidatePath('/dashboard');
    revalidatePath('/editor');
    
    redirect('/dashboard?upgraded=true');
}
