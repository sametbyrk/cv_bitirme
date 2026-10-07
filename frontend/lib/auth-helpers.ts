import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getCurrentUserRole = cache(async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });
    return user?.role ?? null;
});
