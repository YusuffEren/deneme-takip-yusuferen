"""
Öğrenci API Route'ları
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Student

router = APIRouter(prefix="/api/students", tags=["Öğrenciler"])


def student_to_dict(s):
    return {
        "id": s.id,
        "name": s.name,
        "examType": s.exam_type,
        "avatar": s.avatar,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("")
def list_students(db: Session = Depends(get_db)):
    """Tüm öğrencileri listele"""
    students = db.query(Student).order_by(Student.id).all()
    return [student_to_dict(s) for s in students]


@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Öğrenci detayını getir"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return student_to_dict(student)
