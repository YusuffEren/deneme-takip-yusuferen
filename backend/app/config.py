"""
Uygulama konfigürasyonu
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Veritabanı URL'si - SQLite veya PostgreSQL
# Geliştirme: SQLite (varsayılan)
# Üretim: PostgreSQL (DATABASE_URL environment variable ile)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./deneme_takip.db"
)

# Eski "postgres://" şemasını SQLAlchemy'nin beklediği formata çevir
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Prisma URL formatını düzelt
if DATABASE_URL.startswith("prisma://"):
    DATABASE_URL = DATABASE_URL.replace("prisma://", "postgresql://")

# CORS: environment variable'dan virgülle ayrılmış liste okunur.
# Örn: CORS_ORIGINS="https://site1.onrender.com,https://site2.vercel.app"
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env.strip():
    CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
