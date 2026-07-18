"""
Öğrenci Takip ve Verimlilik Portalı - FastAPI Ana Uygulama
============================================
Backend: Python / FastAPI
DB: PostgreSQL + SQLAlchemy (geliştirmede SQLite)
"""
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import engine, Base, SessionLocal
from app.routes import students, curriculum, exams, daily_questions, study_sessions, goals, analytics, topic_progress

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deneme-takip")


def init_db(max_attempts: int = 6, delay_seconds: int = 5) -> None:
    """
    Tabloları oluşturur ve veritabanı boşsa seed verilerini yükler.
    Veritabanı hazır olana kadar birkaç kez dener (ücretsiz servislerde
    cold-start / uyandırma gecikmelerine karşı).
    Veritabanına hiç ulaşılamazsa uygulama yine de ayağa kalkar ve
    /api/health cevap verir; istekler hata döner ama servis TAKILMAZ.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Veritabanı tabloları hazır.")

            # Boş veritabanını otomatik doldur
            from app.models import Student
            db = SessionLocal()
            try:
                has_students = db.query(Student).first() is not None
            finally:
                db.close()

            if not has_students:
                logger.info("Veritabanı boş, seed verileri yükleniyor...")
                import seed
                seed.seed()
                logger.info("Seed tamamlandı.")
            return
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Veritabanı başlatma denemesi %s/%s başarısız: %s",
                attempt, max_attempts, exc,
            )
            if attempt < max_attempts:
                time.sleep(delay_seconds)
    logger.error(
        "Veritabanı %s denemede de başlatılamadı. "
        "Servis çalışmaya devam ediyor; DATABASE_URL ayarını kontrol edin.",
        max_attempts,
    )


init_db()

app = FastAPI(
    title="Öğrenci Takip ve Verimlilik Portalı",
    description="LGS ve TYT/AYT sınavlarına hazırlanan öğrenciler için kapsamlı takip sistemi",
    version="2.0.0",
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route'ları kaydet
app.include_router(students.router)
app.include_router(curriculum.router)
app.include_router(exams.router)
app.include_router(daily_questions.router)
app.include_router(study_sessions.router)
app.include_router(goals.router)
app.include_router(analytics.router)
app.include_router(topic_progress.router)


@app.get("/")
def root():
    return {
        "message": "Öğrenci Takip ve Verimlilik Portalı API",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
