"""
PostgreSQL Veritabanı Şeması - SQLAlchemy Modelleri
============================================
Öğrenci Takip ve Verimlilik Portalı

Tablolar:
  - students: Öğrenci profilleri (LGS / TYT-AYT)
  - subjects: Ders tanımları
  - topics: Konu başlıkları
  - exams: Deneme sınavı kayıtları
  - exam_results: Ders bazlı deneme sonuçları
  - question_analysis: Konu bazlı hata analizi
  - daily_questions: Günlük soru çözüm takibi
  - study_sessions: Ders bazlı çalışma süre takibi
  - goals: Günlük/haftalık hedefler
"""
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date,
    ForeignKey, Text, Boolean, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


# ============================================
# Öğrenci tablosu
# ============================================
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    exam_type = Column(String(10), nullable=False)  # LGS | TYT | AYT
    avatar = Column(String(10), default="📚")
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    exams = relationship("Exam", back_populates="student", cascade="all, delete-orphan")
    daily_questions = relationship("DailyQuestion", back_populates="student", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="student", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="student", cascade="all, delete-orphan")


# ============================================
# Ders tablosu
# ============================================
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    exam_type = Column(String(10), nullable=False)  # LGS | TYT | AYT
    total_questions = Column(Integer, nullable=False)
    coefficient = Column(Float, default=1.0)
    display_order = Column(Integer, default=0)

    # İlişkiler
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="subject")
    daily_questions = relationship("DailyQuestion", back_populates="subject")
    study_sessions = relationship("StudySession", back_populates="subject")


# ============================================
# Konu tablosu - MEB müfredatına uygun
# ============================================
class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)

    # İlişkiler
    subject = relationship("Subject", back_populates="topics")
    question_analyses = relationship("QuestionAnalysis", back_populates="topic")


# ============================================
# Deneme sınavı kayıtları
# ============================================
class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    exam_name = Column(String(200), nullable=False)
    exam_category = Column(String(10), nullable=False)  # LGS | TYT | AYT
    exam_date = Column(DateTime, nullable=False)
    total_net = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    student = relationship("Student", back_populates="exams")
    results = relationship("ExamResult", back_populates="exam", cascade="all, delete-orphan")


# ============================================
# Ders bazlı deneme sonuçları
# ============================================
class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    total_questions = Column(Integer, nullable=False)
    wrong_count = Column(Integer, default=0)
    blank_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    net_score = Column(Float, default=0)

    # İlişkiler
    exam = relationship("Exam", back_populates="results")
    subject = relationship("Subject", back_populates="exam_results")
    analyses = relationship("QuestionAnalysis", back_populates="exam_result", cascade="all, delete-orphan")


# ============================================
# Konu bazlı hata analizi
# ============================================
class QuestionAnalysis(Base):
    __tablename__ = "question_analysis"

    id = Column(Integer, primary_key=True, autoincrement=True)
    exam_result_id = Column(Integer, ForeignKey("exam_results.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    wrong_count = Column(Integer, default=0)
    blank_count = Column(Integer, default=0)

    # İlişkiler
    exam_result = relationship("ExamResult", back_populates="analyses")
    topic = relationship("Topic", back_populates="question_analyses")


# ============================================
# YENİ: Günlük soru çözüm takibi
# Her gün, her ders/konu için çözülen soru sayıları
# ============================================
class DailyQuestion(Base):
    __tablename__ = "daily_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_name = Column(String(200), nullable=True)  # Opsiyonel konu detayı
    date = Column(Date, nullable=False, default=date.today)
    solved_count = Column(Integer, default=0)  # Çözülen soru
    correct_count = Column(Integer, default=0)  # Doğru
    wrong_count = Column(Integer, default=0)    # Yanlış
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    student = relationship("Student", back_populates="daily_questions")
    subject = relationship("Subject", back_populates="daily_questions")

    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'topic_name', 'date',
                        name='uq_daily_question_entry'),
    )


# ============================================
# YENİ: Çalışma süresi takibi
# Ders bazlı çalışma süreleri (dakika cinsinden)
# ============================================
class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    duration_minutes = Column(Integer, nullable=False)  # Dakika cinsinden
    notes = Column(Text, nullable=True)  # Opsiyonel notlar
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    student = relationship("Student", back_populates="study_sessions")
    subject = relationship("Subject", back_populates="study_sessions")


# ============================================
# YENİ: Hedef yönetimi
# Günlük ve haftalık soru/süre hedefleri
# ============================================
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    goal_type = Column(String(20), nullable=False)     # "daily" | "weekly"
    metric_type = Column(String(20), nullable=False)   # "questions" | "duration"
    target_value = Column(Integer, nullable=False)      # Hedef değer
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)  # NULL = genel hedef
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler
    student = relationship("Student", back_populates="goals")
    subject = relationship("Subject")

    __table_args__ = (
        UniqueConstraint('student_id', 'goal_type', 'metric_type', 'subject_id',
                        name='uq_goal_entry'),
    )
