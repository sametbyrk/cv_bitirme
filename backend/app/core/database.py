"""
SQLAlchemy 2.0 Asynchronous Database Engine and Session Management.
Optimized for Supabase PostgreSQL with PgBouncer connection pooling.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Supabase PgBouncer Pooler için prepared_statement_cache_size=0 zorunludur.
# Aksi takdirde transaction pooling modunda 'prepared statement already exists' hatası alınır.
engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
    pool_pre_ping=False,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
        "command_timeout": 30,
    },
)

# Asenkron oturum fabrikası (Session Factory)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency: Her HTTP isteği için izole bir async veritabanı oturumu sağlar.
    İşlem sonunda oturumu güvenle kapatır.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
