"""
Hedef Yönetimi API Route'ları
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import Optional
from app.database import get_db
from app.models import Goal
from app.schemas import GoalCreate

router = APIRouter(prefix="/api/goals", tags=["Hedef Yönetimi"])


@router.get("")
def list_goals(
    studentId: int = Query(...),
    goalType: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Öğrencinin hedeflerini listele"""
    query = (
        db.query(Goal)
        .options(joinedload(Goal.subject))
        .filter(Goal.student_id == studentId, Goal.is_active == True)
    )

    if goalType:
        query = query.filter(Goal.goal_type == goalType)

    goals = query.all()

    return [
        {
            "id": g.id,
            "studentId": g.student_id,
            "goalType": g.goal_type,
            "metricType": g.metric_type,
            "targetValue": g.target_value,
            "subjectId": g.subject_id,
            "isActive": g.is_active,
            "subject": {
                "id": g.subject.id,
                "name": g.subject.name,
                "examType": g.subject.exam_type,
            } if g.subject else None,
        }
        for g in goals
    ]


@router.post("")
def create_or_update_goal(data: GoalCreate, db: Session = Depends(get_db)):
    """Hedef oluştur veya güncelle (upsert)"""
    existing = db.query(Goal).filter(
        and_(
            Goal.student_id == data.student_id,
            Goal.goal_type == data.goal_type,
            Goal.metric_type == data.metric_type,
            Goal.subject_id == data.subject_id,
        )
    ).first()

    if existing:
        existing.target_value = data.target_value
        existing.is_active = True
        db.commit()
        return {"id": existing.id, "message": "Hedef güncellendi"}

    goal = Goal(
        student_id=data.student_id,
        goal_type=data.goal_type,
        metric_type=data.metric_type,
        target_value=data.target_value,
        subject_id=data.subject_id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "message": "Hedef oluşturuldu"}


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    """Hedefi sil (soft delete)"""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı")
    goal.is_active = False
    db.commit()
    return {"message": "Hedef devre dışı bırakıldı"}
