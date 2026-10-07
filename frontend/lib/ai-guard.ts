import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/ratelimit';

export async function checkAiUsageAndGetUser(userId: string) {
    // 1. Fetch user (using type-safe findUnique)
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        return {
            allowed: false,
            errorResponse: NextResponse.json({ error: 'User not found' }, { status: 404 })
        };
    }

    const currentUser = user as any;

    // 2. Short-term Rate Limiting (Abuse Protection)
    // Limit: Max 10 requests per 1 minute
    const rateLimitStatus = await checkRateLimit(`ai_${userId}`, 60 * 1000, 10);
    if (!rateLimitStatus.success) {
        const remainingSeconds = Math.ceil((rateLimitStatus.resetMs || 0) / 1000);
        return {
            allowed: false,
            errorResponse: NextResponse.json({
                error: `Too many AI requests. Please wait ${remainingSeconds} seconds.`,
                limitType: 'rate_limit',
                resetSeconds: remainingSeconds
            }, { status: 429 })
        };
    }

    // 3. Premium Users Daily Counter Reset
    if (currentUser.isPremium) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = currentUser.aiUsageResetDate ? new Date(currentUser.aiUsageResetDate) : null;

        if (!lastReset || lastReset < today) {
            // Reset counter for new day
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { aiUsageCount: 0, aiUsageResetDate: new Date() } as any
            });
            currentUser.aiUsageCount = 0;
            currentUser.aiUsageResetDate = updatedUser.aiUsageResetDate;
        }
    }

    const usageCount = currentUser.aiUsageCount || 0;

    // 4. Free limit check: 3 total lifetime requests (never resets)
    if (!currentUser.isPremium && usageCount >= 3) {
        return {
            allowed: false,
            errorResponse: NextResponse.json({
                error: 'AI limit reached (3 requests). Upgrade to Premium for more!',
                limitType: 'quota'
            }, { status: 403 })
        };
    }

    // 5. Premium fair usage limit check: 50 requests per day
    if (currentUser.isPremium && usageCount >= 50) {
        return {
            allowed: false,
            errorResponse: NextResponse.json({
                error: 'Daily limit reached (50/day). Resets tomorrow!',
                limitType: 'quota'
            }, { status: 403 })
        };
    }

    return {
        allowed: true,
        user: currentUser
    };
}
