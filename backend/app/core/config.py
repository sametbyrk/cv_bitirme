"""
Application Configuration and Environment Settings for Vitascor.
Reads from .env using pydantic-settings.
"""

from typing import List, Optional
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Vitascor API Ayarları ve Ortam Değişkenleri."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Genel Proje Bilgileri
    PROJECT_NAME: str = "Vitascor API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Veritabanı (PostgreSQL / Supabase)
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/postgres",
        description="PostgreSQL bağlantı dizesi"
    )

    # Supabase Ayarları & Kimlik Doğrulama
    SUPABASE_URL: str = "https://placeholder-project.supabase.co"
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    APP_AUTH_JWT_SECRET: str = Field(
        min_length=32,
        description="Frontend ve backend uygulama oturum JWT'leri için ortak gizli anahtar"
    )

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    # Upstash Redis (Dağıtık Rate Limiting için)
    UPSTASH_REDIS_REST_URL: Optional[str] = None
    UPSTASH_REDIS_REST_TOKEN: Optional[str] = None

    # CORS İzin Verilen Kaynaklar
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # Ücretsiz Plan Kota Limitleri
    FREE_RESUME_LIMIT: int = Field(
        default=3,
        description="Ücretsiz kullanıcıların oluşturabileceği maksimum CV sayısı."
    )
    FREE_AI_LIMIT: int = Field(
        default=5,
        description="Ücretsiz kullanıcıların aylık kullanabileceği AI isteği sayısı."
    )
    PREMIUM_AI_DAILY_LIMIT: int = Field(
        default=50,
        gt=0,
        description="Premium kullanıcıların kayan 24 saat içinde kullanabileceği AI isteği sayısı."
    )
    AI_GENERATION_TIMEOUT_SECONDS: int = Field(default=20, gt=0, le=120)

    # Initial hybrid-ATS parameters; calibrate them with the labeled evaluation set.
    REQUIRED_SKILL_WEIGHT: float = Field(
        default=1.0,
        gt=0,
        description="Zorunlu yetkinlik katsayısı"
    )
    PREFERRED_SKILL_WEIGHT: float = Field(
        default=0.5,
        gt=0,
        description="Tercih edilen yetkinlik katsayısı"
    )
    ATS_TAU_LOW: float = Field(default=0.55, ge=0.0, le=1.0)
    ATS_TAU_HIGH: float = Field(default=0.80, ge=0.0, le=1.0)
    ATS_BETA: float = Field(default=0.6, ge=0.0, le=1.0)
    TRUSTED_PROXY_HOPS: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Güvenilir ters proxy sayısı; yalnızca proxy X-Forwarded-For zincirini doğru kuruyorsa ayarlayın.",
    )

    @property
    def async_database_url(self) -> str:
        """
        SQLAlchemy + asyncpg için uyumlu PostgreSQL bağlantı URL'i üretir.
        - 'postgresql://' -> 'postgresql+asyncpg://' dönüşümü yapar.
        - asyncpg'nin kabul etmediği 'pgbouncer' ve 'connection_limit' query parametrelerini temizler.
        """
        url = self.DATABASE_URL
        if not url:
            return ""

        # Sürücü önekini ayarla
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Query parametrelerini filtrele (asyncpg pgbouncer=true query argümanını tanımaz)
        parsed = urlparse(url)
        if parsed.query:
            query_params = parse_qs(parsed.query)
            # asyncpg ile çakışan parametreleri kaldır
            query_params.pop("pgbouncer", None)
            query_params.pop("connection_limit", None)
            new_query = urlencode(query_params, doseq=True)
            url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))

        return url


settings = Settings()
