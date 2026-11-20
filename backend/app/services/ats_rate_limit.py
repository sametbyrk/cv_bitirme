"""PostgreSQL-backed abuse limits for ATS matching requests."""

import hashlib
import ipaddress
from datetime import datetime, timezone

from fastapi import HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _client_ip(request: Request) -> str | None:
    """Use X-Forwarded-For only when explicitly configured for a trusted proxy."""
    hops = settings.TRUSTED_PROXY_HOPS
    if hops > 0:
        chain = [part.strip() for part in request.headers.get("x-forwarded-for", "").split(",") if part.strip()]
        # Walk back from the socket-facing trusted proxy; ignore client-prepended values.
        index = len(chain) - hops
        if index >= 0:
            try:
                return str(ipaddress.ip_address(chain[index]))
            except ValueError:
                pass
    # The socket peer is trustworthy even when no forwarding proxy is configured.
    try:
        return str(ipaddress.ip_address(request.client.host)) if request.client else None
    except ValueError:
        return None


async def enforce_ats_rate_limit(db: AsyncSession, request: Request, user_id: str) -> None:
    keys = [f"ats:account:{_digest(user_id)}"]
    ip = _client_ip(request)
    if ip:
        keys.append(f"ats:ip:{_digest(ip)}")
    limits = (("minute", 60_000, 10), ("day", 86_400_000, 100))
    try:
        denied = None
        for key in keys:
            for window, window_ms, maximum in limits:
                bucket_id = f"rl:{_digest(f'{key}:{window}') }"
                result = await db.execute(text("""
                        INSERT INTO public.rate_limit_bucket (id, count, reset_at, updated_at)
                        VALUES (:id, 1, NOW() + (:window_ms * INTERVAL '1 millisecond'), NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            count = CASE WHEN public.rate_limit_bucket.reset_at <= NOW() THEN 1
                                         ELSE public.rate_limit_bucket.count + 1 END,
                            reset_at = CASE WHEN public.rate_limit_bucket.reset_at <= NOW()
                                THEN NOW() + (:window_ms * INTERVAL '1 millisecond')
                                ELSE public.rate_limit_bucket.reset_at END,
                            updated_at = NOW()
                        RETURNING count, reset_at
                    """), {"id": bucket_id, "window_ms": window_ms})
                row = result.one()
                if row.count > maximum:
                    reset = row.reset_at
                    if reset.tzinfo is None:
                        reset = reset.replace(tzinfo=timezone.utc)
                    retry_after = max(1, int((reset - datetime.now(timezone.utc)).total_seconds()))
                    denied = max(denied or 0, retry_after)
        await db.commit()
        if denied is not None:
            raise HTTPException(status_code=429, detail={"code":"RATE_LIMITED","message":"ATS isteği sınırına ulaşıldı."}, headers={"Retry-After": str(denied)})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail={"code":"RATE_LIMIT_UNAVAILABLE","message":"İstek sınırlandırma servisi kullanılamıyor."}) from exc
