"""
Çalışma Süresi Takibi API Route'ları
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import StudySession
from app.schemas import StudySessionCreate, StudySessionBatchCreate

router = APIRouter(prefix="/api/study-sessions", tags=["Çalışma Süresi Takibi"])


@router.get("")
def list_study_sessions(
    studentId: int = Query(...),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    subjectId: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Çalışma süresi kayıtlarını listele"""
    query = (
        db.query(StudySession)
        .options(joinedload(StudySession.subject))
        .filter(StudySession.student_id == studentId)
    )

    if startDate:
        query = query.filter(StudySession.date >= date.fromisoformat(startDate))
    if endDate:
        query = query.filter(StudySession.date <= date.fromisoformat(endDate))
    if subjectId:
        query = query.filter(StudySession.subject_id == subjectId)

    records = query.order_by(StudySession.date.desc()).all()

    return [
        {
            "id": r.id,
            "studentId": r.student_id,
            "subjectId": r.subject_id,
            "date": r.date.isoformat(),
            "durationMinutes": r.duration_minutes,
            "notes": r.notes,
            "subject": {
                "id": r.subject.id,
                "name": r.subject.name,
                "examType": r.subject.exam_type,
            } if r.subject else None,
        }
        for r in records
    ]


@router.post("")
def create_study_session(data: StudySessionCreate, db: Session = Depends(get_db)):
    """Çalışma süresi kaydı oluştur"""
    record = StudySession(
        student_id=data.student_id,
        subject_id=data.subject_id,
        date=data.date,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "message": "Çalışma süresi kaydedildi"}


@router.post("/batch")
def create_study_sessions_batch(data: StudySessionBatchCreate, db: Session = Depends(get_db)):
    """Toplu çalışma süresi kaydı"""
    created_ids = []
    for entry in data.entries:
        subject_id = entry.get("subjectId")
        duration = entry.get("durationMinutes", 0)
        notes = entry.get("notes")

        if duration <= 0:
            continue

        record = StudySession(
            student_id=data.student_id,
            subject_id=subject_id,
            date=data.date,
            duration_minutes=duration,
            notes=notes,
        )
        db.add(record)
        db.flush()
        created_ids.append(record.id)

    db.commit()
    return {"count": len(created_ids), "message": f"{len(created_ids)} kayıt oluşturuldu"}


@router.delete("/{record_id}")
def delete_study_session(record_id: int, db: Session = Depends(get_db)):
    """Çalışma süresi kaydını sil"""
    record = db.query(StudySession).filter(StudySession.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(record)
    db.commit()
    return {"message": "Kayıt silindi"}
