"""
Öğrenci Takip ve Verimlilik Portalı - FastAPI Ana Uygulama
============================================
Backend: Python / FastAPI
DB: PostgreSQL + SQLAlchemy
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine, Base
from app.routes import students, curriculum, exams, daily_questions, study_sessions, goals, analytics

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

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
