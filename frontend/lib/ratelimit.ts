import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { prisma } from '@/lib/prisma';

type RateLimitReason = 'limited' | 'unavailable';
type RateLimitResult = {
    success: boolean;
    reason?: RateLimitReason;
    reset?: number;
    resetMs?: number;
};
type RateLimitRow = { count: number; reset_at: Date };
type LocalBucket = { count: number; resetAt: number };

const localBuckets = new Map<string, LocalBucket>();
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

function getTrustedClientIp(requestHeaders: Headers): string | null {
    const trustedHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS || '0', 10);
    if (!Number.isInteger(trustedHops) || trustedHops < 1) return null;

    const forwardedFor = requestHeaders.get('x-forwarded-for');
    if (!forwardedFor) return null;

    const chain = forwardedFor.split(',').map(value => value.trim()).filter(Boolean);
    const clientIndex = chain.length - trustedHops - 1;
    if (clientIndex < 0) return null;

    const candidate = chain[clientIndex];
    return isIP(candidate) ? candidate : null;
}

/**
 * Build opaque account and trusted-proxy identifiers for login/signup limits.
 * Account keys keep a useful per-account limit even when no trusted proxy is configured.
 */
export function getAuthRateLimitKeys(
    scope: string,
    email: string,
    requestHeaders: Headers,
): string[] {
    const normalizedEmail = email.trim().toLowerCase();
    const keys: string[] = [];

    if (normalizedEmail) {
        keys.push(`auth:${scope}:account:${sha256(normalizedEmail)}`);
    }

    const clientIp = getTrustedClientIp(requestHeaders);
    if (clientIp) {
        keys.push(`auth:${scope}:ip:${sha256(clientIp)}`);
    }

    return keys;
}

function checkLocalRateLimit(
    identifiers: string[],
    windowMs: number,
    maxAttempts: number,
): RateLimitResult {
    const now = Date.now();
    for (const [key, bucket] of localBuckets) {
        if (bucket.resetAt <= now) localBuckets.delete(key);
    }
    if (localBuckets.size > 10_000) {
        const keysToRemove = localBuckets.size - 10_000;
        let removed = 0;
        for (const key of localBuckets.keys()) {
            localBuckets.delete(key);
            removed += 1;
            if (removed >= keysToRemove) break;
        }
    }

    let latestReset = 0;
    let limited = false;
    for (const identifier of identifiers) {
        const key = sha256(identifier);
        const existing = localBuckets.get(key);
        const bucket = !existing || existing.resetAt <= now
            ? { count: 1, resetAt: now + windowMs }
            : { count: existing.count + 1, resetAt: existing.resetAt };
        localBuckets.set(key, bucket);
        if (bucket.count > maxAttempts) {
            limited = true;
            latestReset = Math.max(latestReset, bucket.resetAt);
        }
    }

    if (!limited) return { success: true };
    const resetMs = Math.max(0, latestReset - now);
    return {
        success: false,
        reason: 'limited',
        resetMs,
        reset: Math.ceil(resetMs / 60_000),
    };
}

/**
 * Atomically increment PostgreSQL rate-limit buckets. Production fails closed if
 * the database-backed limiter is unavailable; local development uses memory only.
 */
export async function checkRateLimit(
    identifiers: string | readonly string[],
    windowMs = DEFAULT_WINDOW_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
): Promise<RateLimitResult> {
    const keys = [...new Set(typeof identifiers === 'string' ? [identifiers] : identifiers)]
        .filter(identifier => identifier.trim().length > 0);
    if (!keys.length || windowMs <= 0 || maxAttempts < 1) {
        return { success: false, reason: 'unavailable' };
    }

    if (process.env.NODE_ENV !== 'production') {
        try {
            const rows = await prisma.$transaction(async transaction => Promise.all(
                keys.map(async identifier => {
                    const id = `rl:${sha256(identifier)}`;
                    const rows = await transaction.$queryRaw<RateLimitRow[]>`
                        INSERT INTO public.rate_limit_bucket (id, count, reset_at, updated_at)
                        VALUES (${id}, 1, NOW() + (${windowMs} * INTERVAL '1 millisecond'), NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            count = CASE
                                WHEN public.rate_limit_bucket.reset_at <= NOW() THEN 1
                                ELSE public.rate_limit_bucket.count + 1
                            END,
                            reset_at = CASE
                                WHEN public.rate_limit_bucket.reset_at <= NOW()
                                    THEN NOW() + (${windowMs} * INTERVAL '1 millisecond')
                                ELSE public.rate_limit_bucket.reset_at
                            END,
                            updated_at = NOW()
                        RETURNING count, reset_at
                    `;
                    return rows[0];
                }),
            ));

            const now = Date.now();
            const denied = rows.filter(row => row.count > maxAttempts);
            if (!denied.length) return { success: true };

            const resetMs = Math.max(...denied.map(row => row.reset_at.getTime() - now), 0);
            return {
                success: false,
                reason: 'limited',
                resetMs,
                reset: Math.ceil(resetMs / 60_000),
            };
        } catch (error) {
            console.error('PostgreSQL rate limiter unavailable:', error instanceof Error ? error.message : 'Unknown error');
            return checkLocalRateLimit(keys, windowMs, maxAttempts);
        }
    }

    try {
        const rows = await prisma.$transaction(async transaction => Promise.all(
            keys.map(async identifier => {
                const id = `rl:${sha256(identifier)}`;
                const rows = await transaction.$queryRaw<RateLimitRow[]>`
                    INSERT INTO public.rate_limit_bucket (id, count, reset_at, updated_at)
                    VALUES (${id}, 1, NOW() + (${windowMs} * INTERVAL '1 millisecond'), NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        count = CASE
                            WHEN public.rate_limit_bucket.reset_at <= NOW() THEN 1
                            ELSE public.rate_limit_bucket.count + 1
                        END,
                        reset_at = CASE
                            WHEN public.rate_limit_bucket.reset_at <= NOW()
                                THEN NOW() + (${windowMs} * INTERVAL '1 millisecond')
                            ELSE public.rate_limit_bucket.reset_at
                        END,
                        updated_at = NOW()
                    RETURNING count, reset_at
                `;
                return rows[0];
            }),
        ));

        const now = Date.now();
        const denied = rows.filter(row => row.count > maxAttempts);
        if (!denied.length) return { success: true };

        const resetMs = Math.max(...denied.map(row => row.reset_at.getTime() - now), 0);
        return {
            success: false,
            reason: 'limited',
            resetMs,
            reset: Math.ceil(resetMs / 60_000),
        };
    } catch (error) {
        console.error('PostgreSQL rate limiter unavailable:', error instanceof Error ? error.message : 'Unknown error');
        return { success: false, reason: 'unavailable' };
    }
}
