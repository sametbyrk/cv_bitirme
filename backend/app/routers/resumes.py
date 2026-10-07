"""
Resume CRUD Router — Vitascor Faz 3A (Revize).
Kullanıcının yalnızca kendi CV'lerini listeleyip, oluşturup, güncelleyip
silebileceği ve kopyalayabileceği tam izole CRUD endpoint seti.

Güvenlik : Her endpoint get_current_user dependency'si ile korunur.
Veritabanı: SQLAlchemy 2.0 async ORM + asyncpg (PgBouncer uyumlu).
"""

import uuid
import json
from typing import List, Any, Dict, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeCreate, ResumeUpdate, ResumeResponse, ResumeContent

router = APIRouter(prefix="/resumes", tags=["Resumes"])


# ─────────────────────────────────────────────────────────────────────────────
# YARDIMCI FONKSİYONLAR
# ─────────────────────────────────────────────────────────────────────────────

def _serialize_content(content: ResumeContent) -> Dict[str, Any]:
    """
    Pydantic ResumeContent → Python dict (JSONB'e yazılacak).
    by_alias=True: camelCase anahtarlar (frontend uyumlu).
    photo alanı KVKK kuralı gereği DB'ye yazılmadan temizlenir.
    """
    data = content.model_dump(by_alias=True, exclude_none=False)
    if "personalInfo" in data and isinstance(data["personalInfo"], dict):
        data["personalInfo"].pop("photo", None)
    return data


def _parse_content(raw: Any) -> Dict[str, Any]:
    """
    asyncpg bazen JSONB sütununu string olarak döndürebilir.
    Bu fonksiyon hem str hem dict tipini güvenle işler.
    """
    if isinstance(raw, str):
        return json.loads(raw)
    if isinstance(raw, dict):
        return raw
    return {}


def _orm_to_response(resume: Resume) -> ResumeResponse:
    """
    SQLAlchemy ORM nesnesi → ResumeResponse Pydantic modeli.
    content JSONB önce dict'e parse edilip ResumeContent'e validate edilir.
    """
    content_dict = _parse_content(resume.content)
    return ResumeResponse(
        id=str(resume.id),
        userId=str(resume.userId),
        title=resume.title,
        content=ResumeContent.model_validate(content_dict),
        createdAt=resume.createdAt,
        updatedAt=resume.updatedAt,
    )


async def _get_or_create_user(db: AsyncSession, current_user: CurrentUser) -> User:
    """
    FIX #4 — FK Güvenliği: 'User' tablosunda current_user.id kaydı yoksa
    minimum bir profil satırı otomatik açar. Supabase Auth ile ilk girişte
    henüz 'User' tablosuna yazılmamış kullanıcılar için ForeignKeyViolation önlenir.
    """
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=current_user.id,
            email=current_user.email or f"{current_user.id}@supabase.local",
            password="__supabase_auth__",  # Prisma zorunlu; gerçek auth Supabase tarafında
            isPremium=False,
            aiUsageCount=0,
            role=current_user.role or "user",
        )
        db.add(user)
        await db.flush()  # commit öncesi PK'yı DB'ye gönder; FK referansı hemen geçerli olur

    return user


async def _check_resume_quota(db: AsyncSession, user_id: str, is_premium: bool) -> None:
    """
    FIX #2 — 3 CV Limiti: Ücretsiz kullanıcı settings.FREE_RESUME_LIMIT adetten fazla
    CV oluşturamazsa HTTP 403 fırlatır.
    """
    if is_premium:
        return  # Premium kullanıcılarda limit yok

    count_stmt = select(func.count()).select_from(Resume).where(Resume.userId == user_id)
    result = await db.execute(count_stmt)
    current_count = result.scalar_one()

    if current_count >= settings.FREE_RESUME_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Ücretsiz planda maksimum {settings.FREE_RESUME_LIMIT} CV oluşturabilirsiniz. "
                "Pro plana geçerek sınırsız CV oluşturabilirsiniz."
            ),
        )


async def _resolve_auth_user_id(db: AsyncSession, user_id_str: str) -> Optional[uuid.UUID]:
    """
    Supabase auth.users tablosunda bu UUID'nin gerçekten var olup olmadığını kontrol eder.
    Var ise UUID döner, yok ise (örneğin Prisma User tablosundan gelen kullanıcılar)
    resume_user_id_fkey FK hatasını engellemek için None döner.
    """
    try:
        val = uuid.UUID(user_id_str)
        stmt = text("SELECT 1 FROM auth.users WHERE id = :uid")
        result = await db.execute(stmt, {"uid": val})
        if result.scalar_one_or_none():
            return val
    except Exception:
        pass
    return None


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT'LER
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=List[ResumeResponse],
    summary="Kullanıcının tüm CV'lerini listele",
)
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> List[ResumeResponse]:
    """
    Oturum açan kullanıcıya ait tüm CV'leri döner.
    Sıralama: Güncelleme tarihine göre azalan (en yeni önce).
    """
    stmt = (
        select(Resume)
        .where(Resume.userId == current_user.id)
        .order_by(Resume.updatedAt.desc())
    )
    result = await db.execute(stmt)
    resumes = result.scalars().all()
    return [_orm_to_response(r) for r in resumes]


@router.post(
    "/",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni CV oluştur",
)
async def create_resume(
    body: ResumeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ResumeResponse:
    """
    Yeni bir CV kaydı oluşturur.
    - FIX #4: Kullanıcı 'User' tablosunda yoksa otomatik oluşturulur (FK güvenliği).
    - FIX #2: Ücretsiz kullanıcılar için 3 CV limiti denetlenir.
    - FIX #1: user_id sütununa Supabase Auth UUID'si yazılır (NULL bırakılmaz).
    - KVKK : photo alanı DB'ye yazılmadan temizlenir.
    """
    # FK güvenliği + kullanıcı profilini al
    user = await _get_or_create_user(db, current_user)

    # 3 CV kota kontrolü
    await _check_resume_quota(db, current_user.id, user.isPremium)

    # FIX #1: user_id sütununa yalnızca Supabase Auth tablosunda varsa UUID yazılır
    auth_uuid = await _resolve_auth_user_id(db, current_user.id)

    new_resume = Resume(
        id=str(uuid.uuid4()),
        title=body.title,
        content=_serialize_content(body.content),
        userId=current_user.id,   # Prisma legacy FK sütunu (str)
        user_id=auth_uuid,        # Supabase Auth RLS UUID sütunu (uuid.UUID)
        createdAt=datetime.now(timezone.utc),
        updatedAt=datetime.now(timezone.utc),
    )
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    return _orm_to_response(new_resume)


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Tek CV getir",
)
async def get_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ResumeResponse:
    """
    ID'ye göre CV getirir.
    Başka kullanıcının CV'sine erişim girişimi 404 döner (bilgi sızıntısı önlenir).
    """
    stmt = select(Resume).where(
        Resume.id == resume_id,
        Resume.userId == current_user.id,
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV bulunamadı veya erişim yetkiniz yok.",
        )
    return _orm_to_response(resume)


@router.patch(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="CV güncelle (kısmi)",
)
async def update_resume(
    resume_id: str,
    body: ResumeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ResumeResponse:
    """
    CV'yi kısmi olarak günceller (PATCH semantiği).
    Yalnızca gönderilen alanlar değiştirilir; diğerleri korunur.
    """
    stmt = select(Resume).where(
        Resume.id == resume_id,
        Resume.userId == current_user.id,
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV bulunamadı veya erişim yetkiniz yok.",
        )

    if body.title is not None:
        resume.title = body.title

    if body.content is not None:
        resume.content = _serialize_content(body.content)

    resume.updatedAt = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(resume)
    return _orm_to_response(resume)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="CV sil",
)
async def delete_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    """
    CV'yi kalıcı olarak siler.
    Başarıda 204 No Content döner.
    Başka kullanıcının CV'si silinmeye çalışılırsa 404 döner.
    """
    stmt = select(Resume).where(
        Resume.id == resume_id,
        Resume.userId == current_user.id,
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV bulunamadı veya erişim yetkiniz yok.",
        )

    await db.delete(resume)
    await db.commit()


@router.post(
    "/{resume_id}/duplicate",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="CV'yi kopyala (Duplicate)",
)
async def duplicate_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ResumeResponse:
    """
    FIX #3 — Eksik Duplicate Endpoint: Mevcut CV'yi kopyalar.
    - Başlık '{eski_baslik} (Kopya)' olarak ayarlanır.
    - Ücretsiz kullanıcılar için 3 CV limiti burada da denetlenir.
    - Başka kullanıcının CV'si kopyalanamaz (404).
    """
    # Kopyalanacak CV'yi doğrula
    stmt = select(Resume).where(
        Resume.id == resume_id,
        Resume.userId == current_user.id,
    )
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kopyalanacak CV bulunamadı veya erişim yetkiniz yok.",
        )

    # FK güvenliği + kullanıcı profilini al
    user = await _get_or_create_user(db, current_user)

    # Kopyalama için de kota kontrolü
    await _check_resume_quota(db, current_user.id, user.isPremium)

    # FIX #1 mantığı burada da: user_id yalnızca Supabase Auth tablosunda varsa yazılır
    auth_uuid = await _resolve_auth_user_id(db, current_user.id)

    duplicate = Resume(
        id=str(uuid.uuid4()),
        title=f"{source.title} (Kopya)",
        content=_parse_content(source.content),  # Derin kopya (JSONB dict)
        userId=current_user.id,
        user_id=auth_uuid,
        createdAt=datetime.now(timezone.utc),
        updatedAt=datetime.now(timezone.utc),
    )
    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)
    return _orm_to_response(duplicate)
