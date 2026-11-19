'use server';

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function upgradeToPremium() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    // DISABLED FOR SECURITY UNTIL PAYMENT INTEGRATION
    throw new Error("Manual upgrade disabled. Please wait for payment integration.");

    revalidatePath('/dashboard');
    revalidatePath('/editor');
    
    redirect('/dashboard?upgraded=true');
}
