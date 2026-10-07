import { Ratelimit, Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
const limitersCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
    if (redis) return redis;
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
}

export async function checkRateLimit(
    identifier: string,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    maxAttempts: number = 5 // 5 attempts per window
): Promise<{ success: boolean; reset?: number; resetMs?: number }> {
    const redisClient = getRedis();
    if (!redisClient) {
        console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Rate limiting is bypassed.");
        return { success: true };
    }

    const cacheKey = `${windowMs}_${maxAttempts}`;
    let limiter = limitersCache.get(cacheKey);

    if (!limiter) {
        // Using Duration type from Upstash to ensure correct type safety
        const durationStr = `${windowMs} ms` as Duration;
        limiter = new Ratelimit({
            redis: redisClient,
            limiter: Ratelimit.slidingWindow(maxAttempts, durationStr),
            analytics: true,
            prefix: '@upstash/ratelimit',
        });
        limitersCache.set(cacheKey, limiter);
    }

    try {
        const result = await limiter.limit(identifier);
        
        // remaining time in ms
        const remainingMs = result.reset - Date.now();

        return {
            success: result.success,
            reset: Math.max(0, Math.ceil(remainingMs / 1000 / 60)), // in minutes (backward compatibility)
            resetMs: Math.max(0, remainingMs)
        };
    } catch (error) {
        console.error("Upstash rate limiting failed:", error);
        
        /**
         * [THESIS NOTE: FAIL-OPEN MECHANISM]
         * In case of a Redis timeout or connection failure, we intentionally return success: true.
         * This is a "Fail-Open" trade-off. 
         * 
         * Why Fail-Open?
         * - UX Priority: We prefer letting users continue using the AI generator even if rate limiting 
         *   is temporarily down, rather than completely breaking the core functionality (Fail-Closed).
         * - Risk Mitigation: Since AI features are critical to this application's value proposition,
         *   system availability outweighs the temporary risk of API abuse during a Redis outage.
         */
        return { success: true };
    }
}
