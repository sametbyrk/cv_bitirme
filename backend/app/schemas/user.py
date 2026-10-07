"""
User and Quota Pydantic v2 Models for Vitascor Platform.
Synchronized with prisma/schema.prisma and Supabase Auth.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class UserProfile(BaseModel):
    """
    Kullanıcı profili modeli.
    SQLAlchemy ORM nesnelerinden doğrudan dönüşüm için from_attributes=True aktif.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    email: str
    name: Optional[str] = None
    role: str = Field(default="user")
    is_premium: bool = Field(
        default=False, 
        alias="isPremium", 
        validation_alias=AliasChoices("isPremium", "is_premium")
    )
    created_at: Optional[datetime] = Field(
        default=None, 
        alias="createdAt", 
        validation_alias=AliasChoices("createdAt", "created_at")
    )


class UserUsageStatus(BaseModel):
    """
    Kullanıcının AI istek ve kota durumu.
    SQLAlchemy ORM nesnelerinden doğrudan dönüşüm için from_attributes=True aktif.
    User tablosunda id sütunu bulunduğundan validation_alias ile hem userId hem id kabul edilir.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    user_id: str = Field(
        alias="userId", 
        validation_alias=AliasChoices("userId", "user_id", "id")
    )
    ai_usage_count: int = Field(
        default=0, 
        alias="aiUsageCount", 
        validation_alias=AliasChoices("aiUsageCount", "ai_usage_count")
    )
    is_premium: bool = Field(
        default=False, 
        alias="isPremium", 
        validation_alias=AliasChoices("isPremium", "is_premium")
    )
    ai_usage_reset_date: Optional[datetime] = Field(
        default=None, 
        alias="aiUsageResetDate", 
        validation_alias=AliasChoices("aiUsageResetDate", "ai_usage_reset_date")
    )
    remaining_credits: Optional[int] = Field(
        default=None, 
        alias="remainingCredits", 
        description="Hesaplanan kalan AI kullanım hakkı"
    )
