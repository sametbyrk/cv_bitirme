"""Authenticated AI endpoints for field editing and Auto-Tailor (month 2 scope)."""

import json
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.ai import (
    JobMatchRequest,
    JobMatchResponse,
    AtsMatchHistoryItem,
    OptimizeRequest,
    OptimizeResponse,
    SingleFieldOptimizeRequest,
    SingleFieldOptimizeResponse,
)
from app.schemas.resume import ResumeContent, validate_resume_json_size
from app.services.ai_service import ai_service
from app.services.ats_service import ats_service
from app.services.guard_service import guard_service
from app.services.ats_rate_limit import enforce_ats_rate_limit
from app.services.ai_quota_reservations import run_with_ai_reservation

router = APIRouter(prefix="/ai", tags=["AI"])
ATS_HISTORY_LIMIT = 50
ATS_HISTORY_RETENTION_DAYS = 90


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


def _parse_content(raw: Any) -> Dict[str, Any]:
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail="CV içeriği okunamadı.") from exc
        return parsed if isinstance(parsed, dict) else {}
    return raw if isinstance(raw, dict) else {}


def _check_resume_text_inputs(value: Any) -> None:
    """Run the prompt-injection heuristic on every free-text CV value."""
    if isinstance(value, str):
        guard_service.check_prompt_injection(value)
    elif isinstance(value, dict):
        for nested in value.values():
            _check_resume_text_inputs(nested)
    elif isinstance(value, list):
        for nested in value:
            _check_resume_text_inputs(nested)


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
    await _get_or_create_user(db, current_user)
    await db.commit()
    return await run_with_ai_reservation(
        db, current_user.id, lambda: ai_service.optimize_single_field(body)
    )


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
    if body.user_feedback:
        guard_service.check_prompt_injection(body.user_feedback)
    if body.previous_tailored_content is not None:
        guard_service.check_prompt_injection(
            json.dumps(body.previous_tailored_content, ensure_ascii=False)
        )
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

    _check_resume_text_inputs(content)

    try:
        normalized = ResumeContent.model_validate(content).model_dump(
            by_alias=True, mode="json", exclude_none=False
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail="CV içeriği geçersiz.") from exc

    service_request = OptimizeRequest(
        resumeContent=normalized,
        jobDescription=body.job_description,
        targetLanguage=body.target_language,
        userFeedback=body.user_feedback,
        previousTailoredContent=body.previous_tailored_content,
        iterationCount=body.iteration_count,
    )
    await db.commit()
    await _get_or_create_user(db, current_user)
    await db.commit()
    return await run_with_ai_reservation(
        db, current_user.id, lambda: ai_service.auto_tailor_resume(service_request)
    )


@router.post(
    "/match",
    response_model=JobMatchResponse,
    summary="CV kanıtlarını iş ilanıyla eşleştir ve hibrit ATS skoru üret",
)
async def match_resume_to_job(
    body: JobMatchRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> JobMatchResponse:
    # Reject cheap input errors before touching the rate-limit/quota stores or AI provider.
    if not body.job_description or not body.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail={"code": "JOB_EMPTY", "message": "İş ilanı boş olamaz."},
        )
    if len(body.job_description) > 20_000:
        raise HTTPException(
            status_code=413,
            detail={"code": "JOB_TOO_LONG", "message": "İş ilanı 20.000 karakter sınırını aşıyor."},
        )
    has_saved_resume = bool(body.resume_id)
    has_draft_resume = body.resume_content is not None
    if has_saved_resume == has_draft_resume:
        raise HTTPException(
            status_code=422,
            detail={"code": "INVALID_REQUEST", "message": "Tam olarak bir resumeId veya currentResume gönderilmelidir."},
        )
    await enforce_ats_rate_limit(db, request, current_user.id)
    guard_service.check_prompt_injection(body.job_description)
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

    personal_info = content.get("personalInfo")
    if isinstance(personal_info, dict):
        personal_info = {**personal_info, "photo": None}
        content = {**content, "personalInfo": personal_info}
    try:
        validate_resume_json_size(content)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "CV_TOO_LARGE", "message": "CV içeriği 150 KiB sınırını aşıyor."},
        ) from exc
    _check_resume_text_inputs(content)
    await _get_or_create_user(db, current_user)
    await db.commit()  # End resume-read transaction before the short quota reservation.

    async def match_and_store() -> JobMatchResponse:
        matched = await ats_service.match(body.job_description, content)
        history_id = uuid.uuid4()
        try:
            await db.execute(text("""
                DELETE FROM public.ats_match_history
                WHERE created_at < NOW() - (CAST(:retention_days AS INTEGER) * INTERVAL '1 day')
            """), {"retention_days": ATS_HISTORY_RETENTION_DAYS})
            await db.execute(
                text("""
                    INSERT INTO public.ats_match_history
                        (id, user_id, resume_id, job_description, result_json, created_at)
                    VALUES (:id, :user_id, :resume_id, :job_description, CAST(:result_json AS jsonb), NOW())
                """),
                {
                    "id": history_id,
                    "user_id": current_user.id,
                    "resume_id": body.resume_id,
                    "job_description": body.job_description,
                    "result_json": json.dumps(matched.model_dump(by_alias=True, mode="json"), ensure_ascii=False),
                },
            )
            # Keep a bounded, user-owned history instead of allowing unbounded growth.
            await db.execute(text("""
                DELETE FROM public.ats_match_history
                WHERE user_id = :user_id AND id IN (
                    SELECT id FROM public.ats_match_history
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC, id DESC
                    OFFSET :keep_count
                )
            """), {"user_id": current_user.id, "keep_count": ATS_HISTORY_LIMIT})
            await db.commit()
        except Exception:
            await db.rollback()
            raise HTTPException(
                status_code=503,
                detail={"code": "ATS_HISTORY_UNAVAILABLE", "message": "ATS analiz geçmişi kaydedilemedi."},
            )
        return matched

    return await run_with_ai_reservation(
        db, current_user.id, match_and_store
    )


@router.get("/match/history", response_model=list[AtsMatchHistoryItem])
async def list_ats_match_history(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[AtsMatchHistoryItem]:
    try:
        await db.execute(text("""
            DELETE FROM public.ats_match_history
            WHERE created_at < NOW() - (CAST(:retention_days AS INTEGER) * INTERVAL '1 day')
        """), {"retention_days": ATS_HISTORY_RETENTION_DAYS})
        result = await db.execute(text("""
            SELECT id, resume_id, job_description, result_json, created_at
            FROM public.ats_match_history
            WHERE user_id = :user_id
              AND created_at >= NOW() - (CAST(:retention_days AS INTEGER) * INTERVAL '1 day')
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
        """), {
            "user_id": current_user.id,
            "limit": ATS_HISTORY_LIMIT,
            "retention_days": ATS_HISTORY_RETENTION_DAYS,
        })
        await db.commit()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "ATS_HISTORY_UNAVAILABLE", "message": "ATS analiz geçmişi şu anda açılamıyor."},
        ) from exc
    return [
        AtsMatchHistoryItem(
            id=str(row["id"]),
            resumeId=row["resume_id"],
            jobDescription=row["job_description"],
            result=row["result_json"],
            createdAt=row["created_at"].isoformat(),
        )
        for row in result.mappings().all()
    ]


@router.delete("/match/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ats_match_history_item(
    history_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    try:
        await db.execute(text("""
            DELETE FROM public.ats_match_history
            WHERE id = :id AND user_id = :user_id
        """), {"id": history_id, "user_id": current_user.id})
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail={"code": "ATS_HISTORY_UNAVAILABLE", "message": "ATS analizi silinemedi."},
        ) from exc
