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

# Prisma URL formatını düzelt
if DATABASE_URL.startswith("prisma://"):
    DATABASE_URL = DATABASE_URL.replace("prisma://", "postgresql://")

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
