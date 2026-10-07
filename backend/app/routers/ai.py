"""Authenticated AI endpoints for field editing and Auto-Tailor (month 2 scope)."""

import json
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.ai import (
    OptimizeRequest,
    OptimizeResponse,
    SingleFieldOptimizeRequest,
    SingleFieldOptimizeResponse,
)
from app.schemas.resume import ResumeContent
from app.services.ai_service import ai_service
from app.services.guard_service import guard_service

router = APIRouter(prefix="/ai", tags=["AI"])


async def _get_or_create_user(db: AsyncSession, current_user: CurrentUser) -> User:
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            id=current_user.id,
            email=current_user.email or f"{current_user.id}@supabase.local",
            password="__supabase_auth__",
            isPremium=False,
            aiUsageCount=0,
            role=current_user.role or "user",
        )
        db.add(user)
        await db.flush()
    return user


async def _reserve_ai_usage(db: AsyncSession, current_user: CurrentUser) -> None:
    user = await _get_or_create_user(db, current_user)
    await guard_service.check_and_increment_quota(db, current_user.id, user.isPremium)


def _parse_content(raw: Any) -> Dict[str, Any]:
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail="CV içeriği okunamadı.") from exc
        return parsed if isinstance(parsed, dict) else {}
    return raw if isinstance(raw, dict) else {}


@router.post(
    "/optimize-field",
    response_model=SingleFieldOptimizeResponse,
    summary="CV alanını AI ile iyileştir",
)
async def optimize_field(
    body: SingleFieldOptimizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SingleFieldOptimizeResponse:
    guard_service.check_prompt_injection(body.text)
    await _reserve_ai_usage(db, current_user)
    return await ai_service.optimize_single_field(body)


@router.post(
    "/tailor",
    response_model=OptimizeResponse,
    summary="CV'yi hedef ilana göre uyarla",
)
async def tailor_resume(
    body: OptimizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> OptimizeResponse:
    guard_service.check_prompt_injection(body.job_description)

    content: Dict[str, Any]
    if body.resume_id:
        result = await db.execute(
            select(Resume).where(
                Resume.id == body.resume_id,
                Resume.userId == current_user.id,
            )
        )
        resume = result.scalar_one_or_none()
        if resume is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CV bulunamadı veya erişim yetkiniz yok.",
            )
        content = _parse_content(resume.content)
    else:
        content = body.resume_content or {}

    try:
        normalized = ResumeContent.model_validate(content).model_dump(
            by_alias=True, mode="json", exclude_none=False
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail="CV içeriği geçersiz.") from exc

    await _reserve_ai_usage(db, current_user)
    service_request = OptimizeRequest(
        resumeContent=normalized,
        jobDescription=body.job_description,
        targetLanguage=body.target_language,
    )
    return await ai_service.auto_tailor_resume(service_request)
