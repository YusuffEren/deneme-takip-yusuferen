"""
Günlük Soru Takibi API Route'ları
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import Optional
from datetime import date, timedelta
from app.database import get_db
from app.models import DailyQuestion, Subject
from app.schemas import DailyQuestionCreate, DailyQuestionBatchCreate

router = APIRouter(prefix="/api/daily-questions", tags=["Günlük Soru Takibi"])


@router.get("")
def list_daily_questions(
    studentId: int = Query(...),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    subjectId: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Günlük soru kayıtlarını listele"""
    query = (
        db.query(DailyQuestion)
        .options(joinedload(DailyQuestion.subject))
        .filter(DailyQuestion.student_id == studentId)
    )

    if startDate:
        query = query.filter(DailyQuestion.date >= date.fromisoformat(startDate))
    if endDate:
        query = query.filter(DailyQuestion.date <= date.fromisoformat(endDate))
    if subjectId:
        query = query.filter(DailyQuestion.subject_id == subjectId)

    records = query.order_by(DailyQuestion.date.desc()).all()

    return [
        {
            "id": r.id,
            "studentId": r.student_id,
            "subjectId": r.subject_id,
            "topicName": r.topic_name,
            "date": r.date.isoformat(),
            "solvedCount": r.solved_count,
            "correctCount": r.correct_count,
            "wrongCount": r.wrong_count,
            "subject": {
                "id": r.subject.id,
                "name": r.subject.name,
                "examType": r.subject.exam_type,
            } if r.subject else None,
        }
        for r in records
    ]


@router.post("")
def create_daily_question(data: DailyQuestionCreate, db: Session = Depends(get_db)):
    """Tek bir günlük soru kaydı oluştur"""
    # Aynı gün, aynı ders, aynı konu varsa güncelle
    existing = db.query(DailyQuestion).filter(
        and_(
            DailyQuestion.student_id == data.student_id,
            DailyQuestion.subject_id == data.subject_id,
            DailyQuestion.topic_name == data.topic_name,
            DailyQuestion.date == data.date,
        )
    ).first()

    if existing:
        existing.solved_count = data.solved_count
        existing.correct_count = data.correct_count
        existing.wrong_count = data.wrong_count
        db.commit()
        return {"id": existing.id, "message": "Kayıt güncellendi"}

    record = DailyQuestion(
        student_id=data.student_id,
        subject_id=data.subject_id,
        topic_name=data.topic_name,
        date=data.date,
        solved_count=data.solved_count,
        correct_count=data.correct_count,
        wrong_count=data.wrong_count,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "message": "Kayıt oluşturuldu"}


@router.post("/batch")
def create_daily_questions_batch(data: DailyQuestionBatchCreate, db: Session = Depends(get_db)):
    """Toplu günlük soru kaydı"""
    created_ids = []
    for entry in data.entries:
        subject_id = entry.get("subjectId")
        topic_name = entry.get("topicName")
        solved = entry.get("solvedCount", 0)
        correct = entry.get("correctCount", 0)
        wrong = entry.get("wrongCount", 0)

        if solved == 0 and correct == 0 and wrong == 0:
            continue

        existing = db.query(DailyQuestion).filter(
            and_(
                DailyQuestion.student_id == data.student_id,
                DailyQuestion.subject_id == subject_id,
                DailyQuestion.topic_name == topic_name,
                DailyQuestion.date == data.date,
            )
        ).first()

        if existing:
            existing.solved_count = solved
            existing.correct_count = correct
            existing.wrong_count = wrong
            created_ids.append(existing.id)
        else:
            record = DailyQuestion(
                student_id=data.student_id,
                subject_id=subject_id,
                topic_name=topic_name,
                date=data.date,
                solved_count=solved,
                correct_count=correct,
                wrong_count=wrong,
            )
            db.add(record)
            db.flush()
            created_ids.append(record.id)

    db.commit()
    return {"count": len(created_ids), "message": f"{len(created_ids)} kayıt oluşturuldu"}


@router.delete("/{record_id}")
def delete_daily_question(record_id: int, db: Session = Depends(get_db)):
    """Günlük soru kaydını sil"""
    record = db.query(DailyQuestion).filter(DailyQuestion.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(record)
    db.commit()
    return {"message": "Kayıt silindi"}
