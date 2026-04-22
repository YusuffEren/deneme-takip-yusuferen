"""
Pydantic Şemaları - Request/Response doğrulama
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ============================================
# Öğrenci
# ============================================
class StudentBase(BaseModel):
    name: str
    exam_type: str
    avatar: str = "📚"

class StudentOut(StudentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ============================================
# Ders & Konu
# ============================================
class TopicOut(BaseModel):
    id: int
    name: str
    subject_id: int
    class Config:
        from_attributes = True

class SubjectOut(BaseModel):
    id: int
    name: str
    exam_type: str
    total_questions: int
    coefficient: float
    display_order: int
    topics: List[TopicOut] = []
    class Config:
        from_attributes = True


# ============================================
# Deneme Sınavı
# ============================================
class TopicAnalysisCreate(BaseModel):
    topic_id: int = Field(alias="topicId")
    wrong_count: int = Field(default=0, alias="wrongCount")
    blank_count: int = Field(default=0, alias="blankCount")
    class Config:
        populate_by_name = True

class ExamResultCreate(BaseModel):
    subject_id: int = Field(alias="subjectId")
    total_questions: int = Field(alias="totalQuestions")
    wrong_count: int = Field(default=0, alias="wrongCount")
    blank_count: int = Field(default=0, alias="blankCount")
    topic_analyses: List[TopicAnalysisCreate] = Field(default=[], alias="topicAnalyses")
    class Config:
        populate_by_name = True

class ExamCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    exam_category: str = Field(alias="examCategory")
    exam_name: str = Field(alias="examName")
    exam_date: str = Field(alias="examDate")
    results: List[ExamResultCreate]
    class Config:
        populate_by_name = True

class TopicAnalysisOut(BaseModel):
    id: int
    topic_id: int
    wrong_count: int
    blank_count: int
    topic: Optional[TopicOut] = None
    class Config:
        from_attributes = True

class SubjectBrief(BaseModel):
    id: int
    name: str
    exam_type: str
    class Config:
        from_attributes = True

class ExamResultOut(BaseModel):
    id: int
    subject_id: int
    total_questions: int
    wrong_count: int
    blank_count: int
    correct_count: int
    net_score: float
    subject: Optional[SubjectBrief] = None
    analyses: List[TopicAnalysisOut] = []
    class Config:
        from_attributes = True

class ExamOut(BaseModel):
    id: int
    student_id: int
    exam_name: str
    exam_category: str
    exam_date: datetime
    total_net: float
    created_at: datetime
    results: List[ExamResultOut] = []
    class Config:
        from_attributes = True


# ============================================
# YENİ: Günlük Soru Takibi
# ============================================
class DailyQuestionCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    subject_id: int = Field(alias="subjectId")
    topic_name: Optional[str] = Field(default=None, alias="topicName")
    date: date
    solved_count: int = Field(alias="solvedCount")
    correct_count: int = Field(alias="correctCount")
    wrong_count: int = Field(alias="wrongCount")
    class Config:
        populate_by_name = True

class DailyQuestionOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    topic_name: Optional[str]
    date: date
    solved_count: int
    correct_count: int
    wrong_count: int
    subject: Optional[SubjectBrief] = None
    class Config:
        from_attributes = True

class DailyQuestionBatchCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    date: date
    entries: List[dict]  # [{subjectId, topicName?, solvedCount, correctCount, wrongCount}]
    class Config:
        populate_by_name = True


# ============================================
# YENİ: Çalışma Süresi Takibi
# ============================================
class StudySessionCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    subject_id: int = Field(alias="subjectId")
    date: date
    duration_minutes: int = Field(alias="durationMinutes")
    notes: Optional[str] = None
    class Config:
        populate_by_name = True

class StudySessionOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    date: date
    duration_minutes: int
    notes: Optional[str]
    subject: Optional[SubjectBrief] = None
    class Config:
        from_attributes = True

class StudySessionBatchCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    date: date
    entries: List[dict]  # [{subjectId, durationMinutes, notes?}]
    class Config:
        populate_by_name = True


# ============================================
# YENİ: Hedef Yönetimi
# ============================================
class GoalCreate(BaseModel):
    student_id: int = Field(alias="studentId")
    goal_type: str = Field(alias="goalType")        # "daily" | "weekly"
    metric_type: str = Field(alias="metricType")     # "questions" | "duration"
    target_value: int = Field(alias="targetValue")
    subject_id: Optional[int] = Field(default=None, alias="subjectId")
    class Config:
        populate_by_name = True

class GoalOut(BaseModel):
    id: int
    student_id: int
    goal_type: str
    metric_type: str
    target_value: int
    subject_id: Optional[int]
    is_active: bool
    subject: Optional[SubjectBrief] = None
    class Config:
        from_attributes = True
