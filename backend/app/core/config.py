"""
Application Configuration and Environment Settings for Vitascor.
Reads from .env using pydantic-settings.
"""

from typing import List, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Vitascor API Ayarları ve Ortam Değişkenleri."""

    model_config = SettingsConfigDict(
        env_file=".env",
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
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        description="Supabase JWT Gizli Anahtarı (.env dosyasından okunur)"
    )

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None

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
        default=3,
        description="Ücretsiz kullanıcıların aylık kullanabileceği AI isteği sayısı."
    )

    # Tez Kalibrasyon Parametreleri (Ampirik değerlendirme için dinamik ayarlar)
    SIMILARITY_THRESHOLD: float = Field(
        default=0.80,
        description="τ (Tau) Anlamsal benzerlik eşiği. text-embedding-004 + Cosine Similarity için."
    )
    REQUIRED_SKILL_WEIGHT: float = Field(
        default=1.0,
        description="Zorunlu yetkinlik katsayısı"
    )
    PREFERRED_SKILL_WEIGHT: float = Field(
        default=0.5,
        description="Tercih edilen yetkinlik katsayısı"
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
