"""
Müfredat (Ders & Konu) API Route'ları
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Subject

router = APIRouter(prefix="/api/curriculum", tags=["Müfredat"])


def subject_to_dict(s):
    return {
        "id": s.id,
        "name": s.name,
        "examType": s.exam_type,
        "totalQuestions": s.total_questions,
        "coefficient": s.coefficient,
        "displayOrder": s.display_order,
        "topics": [
            {"id": t.id, "name": t.name, "subjectId": t.subject_id}
            for t in (s.topics or [])
        ],
    }


@router.get("/{exam_type}")
def get_curriculum(exam_type: str, db: Session = Depends(get_db)):
    """Sınav türüne göre ders ve konuları getir"""
    subjects = (
        db.query(Subject)
        .options(joinedload(Subject.topics))
        .filter(Subject.exam_type == exam_type.upper())
        .order_by(Subject.display_order)
        .all()
    )
    return [subject_to_dict(s) for s in subjects]
