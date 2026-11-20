"""Short-transaction AI quota reservations; provider calls never hold user row locks."""

import uuid
import calendar
import logging
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta, timezone
from typing import TypeVar

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

T = TypeVar("T")
logger = logging.getLogger(__name__)


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _next_month(value: datetime) -> datetime:
    month = value.month + 1
    year = value.year
    if month == 13:
        year += 1
        month = 1
    return value.replace(year=year, month=month, day=min(value.day, calendar.monthrange(year, month)[1]))


async def reserve_ai_usage(db: AsyncSession, user_id: str) -> str:
    reservation_id = str(uuid.uuid4())
    try:
        async with db.begin():
            row = (await db.execute(text('SELECT "isPremium", "aiUsageCount", "aiUsageResetDate" FROM "User" WHERE id=:uid FOR UPDATE'), {"uid": user_id})).mappings().first()
            if row is None:
                raise HTTPException(404, detail={"code":"USER_NOT_FOUND","message":"Kullanıcı profili bulunamadı."})
            now = datetime.now(timezone.utc)
            reset_at = _utc(row["aiUsageResetDate"])
            if reset_at and reset_at <= now:
                await db.execute(text('UPDATE "User" SET "aiUsageCount"=0, "aiUsageResetDate"=NULL WHERE id=:uid'), {"uid": user_id})
                row = {**row, "aiUsageCount": 0}
                reset_at = None
            elif reset_at is None and row["aiUsageCount"]:
                # Legacy counters had no reset window; clear them once on monthly-quota rollout.
                await db.execute(text('UPDATE "User" SET "aiUsageCount"=0 WHERE id=:uid'), {"uid": user_id})
                row = {**row, "aiUsageCount": 0}
            await db.execute(text("UPDATE public.ai_usage_reservation SET status='released', completed_at=NOW() WHERE user_id=:uid AND status='reserved' AND expires_at <= NOW()"), {"uid": user_id})
            pending = (await db.execute(text("SELECT count(*) FROM public.ai_usage_reservation WHERE user_id=:uid AND status='reserved' AND expires_at > NOW()"), {"uid": user_id})).scalar_one()
            quota_code = "AI_QUOTA_EXCEEDED"
            quota_message = ""
            quota_reset_at = reset_at
            if row["isPremium"]:
                premium_usage = (await db.execute(text("""
                    SELECT count(*) AS used, min(completed_at) AS oldest
                    FROM public.ai_usage_reservation
                    WHERE user_id=:uid AND status='consumed'
                      AND completed_at > NOW() - INTERVAL '24 hours'
                """), {"uid": user_id})).mappings().one()
                if premium_usage["used"] + pending >= settings.PREMIUM_AI_DAILY_LIMIT:
                    quota_code = "PREMIUM_AI_QUOTA_EXCEEDED"
                    quota_message = "Premium AI kullanım sınırınız doldu. Daha sonra tekrar deneyin."
                    quota_reset_at = _utc(premium_usage["oldest"]) + timedelta(hours=24) if premium_usage["oldest"] else None
            elif row["aiUsageCount"] + pending >= settings.FREE_AI_LIMIT:
                quota_message = "Aylık ücretsiz AI kullanım kotanız dolmuştur."
            if quota_message:
                raise HTTPException(429, detail={
                    "code": quota_code,
                    "message": quota_message,
                    "resetAt": quota_reset_at.isoformat() if quota_reset_at else None,
                })
            # Bound the quota ledger while preserving the rolling 24-hour window.
            await db.execute(text("DELETE FROM public.ai_usage_reservation WHERE user_id=:uid AND status <> 'reserved' AND completed_at < NOW() - INTERVAL '48 hours'"), {"uid": user_id})
            await db.execute(text("INSERT INTO public.ai_usage_reservation(id,user_id,status,created_at,expires_at) VALUES(:id,:uid,'reserved',NOW(),NOW()+INTERVAL '3 minutes')"), {"id": uuid.UUID(reservation_id), "uid": user_id})
        return reservation_id
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(503, detail={"code":"QUOTA_UNAVAILABLE","message":"AI kullanım kotası şu anda doğrulanamıyor."}) from exc


async def finalize_ai_usage(db: AsyncSession, reservation_id: str, *, success: bool) -> None:
    try:
        async with db.begin():
            reservation_uuid = uuid.UUID(reservation_id)
            identity = (await db.execute(
                text("SELECT user_id FROM public.ai_usage_reservation WHERE id=:id"),
                {"id": reservation_uuid},
            )).mappings().first()
            if not identity:
                return
            # Keep lock ordering consistent with reserve_ai_usage: User, then reservation.
            user = (await db.execute(
                text('SELECT "isPremium", "aiUsageCount", "aiUsageResetDate" FROM "User" WHERE id=:uid FOR UPDATE'),
                {"uid": identity["user_id"]},
            )).mappings().first()
            row = (await db.execute(
                text("SELECT user_id,status FROM public.ai_usage_reservation WHERE id=:id FOR UPDATE"),
                {"id": reservation_uuid},
            )).mappings().first()
            if not row or row["status"] != "reserved":
                return
            if success:
                if user is None:
                    raise HTTPException(404, detail={"code":"USER_NOT_FOUND","message":"Kullanıcı profili bulunamadı."})
                if not user["isPremium"]:
                    now = datetime.now(timezone.utc)
                    reset_at = _utc(user["aiUsageResetDate"])
                    count = user["aiUsageCount"]
                    if reset_at and reset_at <= now:
                        count = 0
                        reset_at = None
                    reset_at = reset_at or _next_month(now)
                    await db.execute(
                        text('UPDATE "User" SET "aiUsageCount"=:count, "aiUsageResetDate"=:reset WHERE id=:uid'),
                        {"count": count + 1, "reset": reset_at, "uid": row["user_id"]},
                    )
            await db.execute(text("UPDATE public.ai_usage_reservation SET status=:status, completed_at=NOW() WHERE id=:id"), {"status": "consumed" if success else "released", "id": uuid.UUID(reservation_id)})
    except Exception as exc:
        raise HTTPException(503, detail={"code":"QUOTA_FINALIZATION_FAILED","message":"AI kullanım kaydı tamamlanamadı."}) from exc


async def run_with_ai_reservation(
    db: AsyncSession, user_id: str, operation: Callable[[], Awaitable[T]]
) -> T:
    """Reserve briefly, run provider work without a row lock, and settle once."""
    reservation_id = await reserve_ai_usage(db, user_id)
    try:
        result = await operation()
    except BaseException:
        await finalize_ai_usage(db, reservation_id, success=False)
        raise
    try:
        await finalize_ai_usage(db, reservation_id, success=True)
    except HTTPException:
        # The operation has already completed (and may have persisted its result).
        # Do not turn a successful AI result into a client-visible failure; leave the
        # short reservation lease to expire, and log only opaque identifiers/error code.
        logger.exception("AI quota finalization failed after successful operation (reservation_id=%s)", reservation_id)
    return result
