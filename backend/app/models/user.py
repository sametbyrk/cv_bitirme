"""
SQLAlchemy ORM Model for User table.
Synchronized with prisma/schema.prisma (@@map("User")).
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.resume import Resume


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    
    # PostgreSQL case-sensitivity (Prisma camelCase) garantisi için açık sütun adları
    createdAt: Mapped[datetime] = mapped_column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    isPremium: Mapped[bool] = mapped_column(
        "isPremium",
        Boolean,
        default=False,
        nullable=False
    )
    aiUsageCount: Mapped[int] = mapped_column(
        "aiUsageCount",
        Integer,
        default=0,
        nullable=False
    )
    aiUsageResetDate: Mapped[Optional[datetime]] = mapped_column(
        "aiUsageResetDate",
        DateTime(timezone=True),
        nullable=True
    )
    role: Mapped[str] = mapped_column(String, default="user", nullable=False)

    # İlişki: Bir kullanıcının birden fazla CV'si olabilir
    resumes: Mapped[List["Resume"]] = relationship(
        "Resume",
        back_populates="user",
        foreign_keys="Resume.userId",
        cascade="all, delete-orphan"
    )
