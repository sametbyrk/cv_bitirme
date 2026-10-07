"""
SQLAlchemy ORM Model for Resume table.
Synchronized with prisma/schema.prisma (@@map("resume")) and Supabase Auth RLS policies.
"""

import uuid
from datetime import datetime
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Resume(Base):
    __tablename__ = "resume"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(
        String,
        default="Basliksiz Ozgecmis",
        nullable=False
    )
    # PostgreSQL JSONB sütunu (CV detayları, kişisel bilgiler, deneyim vb.)
    content: Mapped[Any] = mapped_column(
        JSONB,
        nullable=False,
        default=dict
    )
    
    # 1. Supabase Auth RLS kurallarının ('Kullanıcılar kendi CV'lerini yönetebilir')
    # denetlediği auth.users.id ile eşleşen ASIL UUID sütunu
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        "user_id",
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # 2. Prisma legacy ilişki sütunu ('User' tablosuna bağlı)
    userId: Mapped[str] = mapped_column(
        "userId",
        String,
        ForeignKey("User.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # PostgreSQL case-sensitivity koruması için açıkça çift tırnaklı Prisma eşleştirmeleri
    createdAt: Mapped[Optional[datetime]] = mapped_column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=True
    )
    updatedAt: Mapped[Optional[datetime]] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True
    )

    # Ters ilişki
    user: Mapped["User"] = relationship("User", back_populates="resumes", foreign_keys=[userId])
