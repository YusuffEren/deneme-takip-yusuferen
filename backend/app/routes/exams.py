"""
Deneme Sınavı API Route'ları
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import Exam, ExamResult, QuestionAnalysis
from app.schemas import ExamCreate, ExamOut

router = APIRouter(prefix="/api/exams", tags=["Denemeler"])


@router.get("")
def list_exams(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Öğrencinin denemelerini listele"""
    query = (
        db.query(Exam)
        .options(
            joinedload(Exam.results).joinedload(ExamResult.subject)
        )
        .filter(Exam.student_id == studentId)
    )
    if examCategory:
        query = query.filter(Exam.exam_category == examCategory)

    exams = query.order_by(Exam.exam_date.desc()).all()

    result = []
    for exam in exams:
        result.append({
            "id": exam.id,
            "studentId": exam.student_id,
            "examName": exam.exam_name,
            "examCategory": exam.exam_category,
            "examDate": exam.exam_date.isoformat(),
            "totalNet": exam.total_net,
            "createdAt": exam.created_at.isoformat(),
            "results": [
                {
                    "id": r.id,
                    "subjectId": r.subject_id,
                    "totalQuestions": r.total_questions,
                    "wrongCount": r.wrong_count,
                    "blankCount": r.blank_count,
                    "correctCount": r.correct_count,
                    "netScore": r.net_score,
                    "subject": {
                        "id": r.subject.id,
                        "name": r.subject.name,
                        "examType": r.subject.exam_type,
                    } if r.subject else None,
                }
                for r in exam.results
            ]
        })
    return result


@router.get("/{exam_id}")
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    """Deneme detayını getir"""
    exam = (
        db.query(Exam)
        .options(
            joinedload(Exam.results)
            .joinedload(ExamResult.subject),
            joinedload(Exam.results)
            .joinedload(ExamResult.analyses)
            .joinedload(QuestionAnalysis.topic),
        )
        .filter(Exam.id == exam_id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Deneme bulunamadı")

    return {
        "id": exam.id,
        "studentId": exam.student_id,
        "examName": exam.exam_name,
        "examCategory": exam.exam_category,
        "examDate": exam.exam_date.isoformat(),
        "totalNet": exam.total_net,
        "createdAt": exam.created_at.isoformat(),
        "results": [
            {
                "id": r.id,
                "subjectId": r.subject_id,
                "totalQuestions": r.total_questions,
                "wrongCount": r.wrong_count,
                "blankCount": r.blank_count,
                "correctCount": r.correct_count,
                "netScore": r.net_score,
                "subject": {
                    "id": r.subject.id,
                    "name": r.subject.name,
                    "examType": r.subject.exam_type,
                    "totalQuestions": r.subject.total_questions,
                } if r.subject else None,
                "analyses": [
                    {
                        "id": a.id,
                        "topicId": a.topic_id,
                        "wrongCount": a.wrong_count,
                        "blankCount": a.blank_count,
                        "topic": {
                            "id": a.topic.id,
                            "name": a.topic.name,
                        } if a.topic else None,
                    }
                    for a in r.analyses
                ]
            }
            for r in exam.results
        ]
    }


@router.post("")
def create_exam(data: ExamCreate, db: Session = Depends(get_db)):
    """Yeni deneme kaydet"""
    # LGS: D - Y/3, TYT/AYT: D - Y/4
    penalty_divisor = 3 if data.exam_category == "LGS" else 4

    exam = Exam(
        student_id=data.student_id,
        exam_name=data.exam_name,
        exam_category=data.exam_category,
        exam_date=datetime.fromisoformat(data.exam_date),
    )
    db.add(exam)
    db.flush()

    total_net = 0
    for r in data.results:
        correct = r.total_questions - r.wrong_count - r.blank_count
        correct = max(0, correct)
        net = correct - (r.wrong_count / penalty_divisor)
        net = max(0, net)
        total_net += net

        exam_result = ExamResult(
            exam_id=exam.id,
            subject_id=r.subject_id,
            total_questions=r.total_questions,
            wrong_count=r.wrong_count,
            blank_count=r.blank_count,
            correct_count=correct,
            net_score=round(net, 2),
        )
        db.add(exam_result)
        db.flush()

        # Konu bazlı analiz
        for ta in r.topic_analyses:
            if ta.wrong_count > 0 or ta.blank_count > 0:
                analysis = QuestionAnalysis(
                    exam_result_id=exam_result.id,
                    topic_id=ta.topic_id,
                    wrong_count=ta.wrong_count,
                    blank_count=ta.blank_count,
                )
                db.add(analysis)

    exam.total_net = round(total_net, 2)
    db.commit()
    db.refresh(exam)
    return {"id": exam.id, "totalNet": exam.total_net}


@router.delete("/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    """Deneme sil"""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Deneme bulunamadı")
    db.delete(exam)
    db.commit()
    return {"message": "Deneme silindi"}
