"""Input safety checks and per-user AI quota management."""

from datetime import datetime, timezone
import re

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User


class GuardService:
    _INJECTION_PATTERNS = (
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"(reveal|show|print|expose)\s+(the\s+)?(system\s+)?prompt",
        r"system\s+prompt",
        r"\b(jailbreak|bypass)\b",
        r"<\s*script\b",
    )

    @classmethod
    def check_prompt_injection(cls, text: str) -> None:
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in cls._INJECTION_PATTERNS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Güvenlik kuralı ihlali: Geçersiz metin girdisi.",
            )

    @staticmethod
    async def lock_and_check_quota(db: AsyncSession, user_id: str) -> User:
        result = await db.execute(
            select(User).where(User.id == user_id).with_for_update()
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="Kullanıcı profili bulunamadı.")
        reset_at = user.aiUsageResetDate
        if reset_at is not None:
            if reset_at.tzinfo is None:
                reset_at = reset_at.replace(tzinfo=timezone.utc)
            if reset_at <= datetime.now(timezone.utc):
                user.aiUsageCount = 0
                user.aiUsageResetDate = None
        if not user.isPremium and user.aiUsageCount >= settings.FREE_AI_LIMIT:
            raise HTTPException(status_code=403, detail="Aylık ücretsiz AI kullanım kotanız dolmuştur.")
        return user


guard_service = GuardService()
