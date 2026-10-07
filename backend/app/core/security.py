"""
Security and Supabase JWT Authentication Dependency.
Extracts and verifies Bearer JWT token from Authorization header.
"""

from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.core.config import settings

# HTTP Bearer şeması (Swagger UI'da 'Authorize' butonu ekler)
security_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """Doğrulanmış oturum kullanıcısı veri modeli."""
    id: str
    email: Optional[str] = None
    role: str = "user"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> CurrentUser:
    """
    FastAPI Dependency:
    İstek başlığındaki 'Authorization: Bearer <token>' değerini okur.
    Supabase JWT Secret ile imza doğrulaması yapar ve doğrulanmış kullanıcıyı döner.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulama başlığı eksik (Authorization: Bearer <token> bekleniyor).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Supabase JWT doğrulaması (HS256 algoritması)
        # options={"verify_aud": False} ile audience uyuşmazlığı esnetilir
        payload: Dict[str, Any] = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )

        # Supabase JWT standartlarında kullanıcı ID 'sub' alanında bulunur
        user_id = payload.get("sub") or payload.get("id")
        
        # Eğer custom JWT payload nested 'user' içeriyorsa
        if not user_id and isinstance(payload.get("user"), dict):
            user_id = payload["user"].get("id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token içerisinde geçerli bir kullanıcı kimliği (sub/id) bulunamadı.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        email = payload.get("email")
        if not email and isinstance(payload.get("user"), dict):
            email = payload["user"].get("email")

        role = payload.get("role", "user")

        return CurrentUser(
            id=str(user_id),
            email=email,
            role=role
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum süresi dolmuş. Lütfen tekrar giriş yapınız.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Geçersiz güvenlik token'ı: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
