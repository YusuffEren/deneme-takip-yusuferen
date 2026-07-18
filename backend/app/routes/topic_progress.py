"""
Konu Tamamlama Takibi API Route'ları
============================================
Öğrencinin "bitirdim" diye işaretlediği konuları yönetir.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TopicProgress, Topic
from app.schemas import TopicProgressToggle

router = APIRouter(prefix="/api/topic-progress", tags=["Konu Tamamlama"])


@router.get("")
def get_topic_progress(
    studentId: int = Query(...),
    db: Session = Depends(get_db)
):
    """Öğrencinin tamamladığı konuların ID listesi"""
    rows = (
        db.query(TopicProgress)
        .filter(TopicProgress.student_id == studentId)
        .all()
    )
    return {
        "completedTopicIds": [r.topic_id for r in rows],
        "completedCount": len(rows),
    }


@router.post("")
def toggle_topic_progress(data: TopicProgressToggle, db: Session = Depends(get_db)):
    """Konuyu tamamlandı/tamamlanmadı olarak işaretle"""
    topic = db.query(Topic).filter(Topic.id == data.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Konu bulunamadı")

    existing = (
        db.query(TopicProgress)
        .filter(
            TopicProgress.student_id == data.student_id,
            TopicProgress.topic_id == data.topic_id,
        )
        .first()
    )

    if data.completed and not existing:
        db.add(TopicProgress(student_id=data.student_id, topic_id=data.topic_id))
    elif not data.completed and existing:
        db.delete(existing)

    db.commit()
    return {"success": True, "topicId": data.topic_id, "completed": data.completed}
