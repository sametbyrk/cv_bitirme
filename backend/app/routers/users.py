"""
Users Router — Vitascor Faz 3A.
Kullanıcı profili ve AI kota bilgilerini dönen endpoint'ler.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.user import User
from app.schemas.user import UserProfile, UserUsageStatus

router = APIRouter(prefix="/users", tags=["Users"])


async def _get_or_create_user(db: AsyncSession, current_user: CurrentUser) -> User:
    """
    Kullanıcı 'User' tablosunda yoksa profil satırını otomatik oluşturur.
    Supabase Auth ile gelen ilk girişlerde 404 veya FK hatalarını önler.
    """
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
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
        await db.commit()
        await db.refresh(user)

    return user


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Oturum açan kullanıcının profilini getir",
)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> UserProfile:
    """
    JWT'den elde edilen kullanıcı ID'siyle DB'deki profili getirir.
    Kullanıcı DB'de henüz yoksa profil otomatik oluşturulur.
    """
    user = await _get_or_create_user(db, current_user)

    return UserProfile(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        isPremium=user.isPremium,
        createdAt=user.createdAt,
    )


@router.get(
    "/me/usage",
    response_model=UserUsageStatus,
    summary="Kullanıcının AI kota durumunu getir",
)
async def get_usage_status(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> UserUsageStatus:
    """
    Kullanıcının AI kullanım sayısı ve kalan kredi bilgisini döner.
    Ücretsiz kullanıcılar için limit settings.FREE_AI_LIMIT üzerinden hesaplanır.
    Premium kullanıcılar için limit sınırsızdır (remaining_credits=None).
    """
    user = await _get_or_create_user(db, current_user)

    # Premium kullanıcı için kalan kredi sınırsız
    remaining = None
    if not user.isPremium:
        remaining = max(0, settings.FREE_AI_LIMIT - user.aiUsageCount)

    return UserUsageStatus(
        userId=str(user.id),
        aiUsageCount=user.aiUsageCount,
        isPremium=user.isPremium,
        aiUsageResetDate=user.aiUsageResetDate,
        remaining_credits=remaining,
    )
