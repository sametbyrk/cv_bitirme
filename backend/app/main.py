"""
Vitascor Backend - FastAPI Main Application Entry Point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import ai, resumes, users
from app.middleware.ai_request_size import AIRequestBodyLimitMiddleware

# FastAPI Uygulaması Başlatma
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Vitascor - Dinamik Özgeçmiş Oluşturma ve Hibrit ATS Skorlama Platformu API Servisi",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Bound AI request bodies before FastAPI parses JSON to limit memory and provider cost.
app.add_middleware(
    AIRequestBodyLimitMiddleware,
    max_body_bytes=256 * 1024,
    path_prefix=f"{settings.API_V1_STR}/ai/",
)

# CORS (Cross-Origin Resource Sharing) Yapılandırması
# localhost:3000, 127.0.0.1:3000 ve dinamik Vercel preview/production domainlerine izin verilir
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Kayıtları — tüm endpoint'ler /api/v1 altında yayınlanır
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Sistem sağlık kontrolü uç noktası."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    """Kök karşılama uç noktası."""
    return {
        "message": f"{settings.PROJECT_NAME} çalışıyor.",
        "documentation": "/docs",
        "version": settings.VERSION
    }
