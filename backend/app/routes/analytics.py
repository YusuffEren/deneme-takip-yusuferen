"""
Analiz ve Raporlama API Route'ları
============================================
- Özet istatistikler
- Aylık net trendi
- Ders performansı
- Zayıf konu tespiti (Kırmızı Alarm)
- Haftalık verimlilik raporu
- Deneme-Çalışma korelasyonu
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, desc
from typing import Optional
from datetime import date, timedelta, datetime
from collections import defaultdict
from app.database import get_db
from app.models import (
    Exam, ExamResult, QuestionAnalysis, Subject, Topic,
    DailyQuestion, StudySession, Goal
)

router = APIRouter(prefix="/api/analytics", tags=["Analiz & Raporlama"])


# ============================================
# Özet İstatistikler
# ============================================
@router.get("/summary")
def get_summary(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Dashboard özet kartları için istatistikler"""
    query = db.query(Exam).filter(Exam.student_id == studentId)
    if examCategory:
        query = query.filter(Exam.exam_category == examCategory)

    exams = query.order_by(Exam.exam_date.desc()).all()

    if not exams:
        return {
            "totalExams": 0,
            "lastNet": None,
            "bestNet": None,
            "avgNet": None,
            "trend": None,
        }

    total_nets = [e.total_net for e in exams]
    last_net = total_nets[0] if total_nets else 0
    trend = (total_nets[0] - total_nets[1]) if len(total_nets) >= 2 else None

    return {
        "totalExams": len(exams),
        "lastNet": last_net,
        "bestNet": max(total_nets) if total_nets else None,
        "avgNet": sum(total_nets) / len(total_nets) if total_nets else None,
        "trend": trend,
    }


# ============================================
# Aylık Net Trendi
# ============================================
@router.get("/monthly-trend")
def get_monthly_trend(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Aylara göre ortalama/en iyi net değişimi"""
    query = db.query(Exam).filter(Exam.student_id == studentId)
    if examCategory:
        query = query.filter(Exam.exam_category == examCategory)

    exams = query.order_by(Exam.exam_date).all()

    monthly = defaultdict(list)
    for exam in exams:
        month_key = exam.exam_date.strftime("%Y-%m")
        monthly[month_key].append(exam.total_net)

    result = []
    prev_avg = None
    for month, nets in sorted(monthly.items()):
        avg_net = sum(nets) / len(nets)
        best_net = max(nets)
        change = (avg_net - prev_avg) if prev_avg is not None else 0
        change_percent = ((change / prev_avg) * 100) if prev_avg and prev_avg != 0 else None

        result.append({
            "month": month,
            "avgNet": round(avg_net, 2),
            "bestNet": round(best_net, 2),
            "examCount": len(nets),
            "change": round(change, 2),
            "changePercent": round(change_percent, 1) if change_percent is not None else None,
        })
        prev_avg = avg_net

    return result


# ============================================
# Ders Performansı
# ============================================
@router.get("/subject-progress")
def get_subject_progress(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Her ders için son net vs ortalama net karşılaştırması"""
    query = (
        db.query(Exam)
        .options(joinedload(Exam.results).joinedload(ExamResult.subject))
        .filter(Exam.student_id == studentId)
    )
    if examCategory:
        query = query.filter(Exam.exam_category == examCategory)

    exams = query.order_by(Exam.exam_date).all()

    if not exams:
        return []

    # Ders bazlı netleri topla
    subject_nets = defaultdict(list)
    subject_names = {}
    for exam in exams:
        for result in exam.results:
            subject_nets[result.subject_id].append(result.net_score)
            if result.subject:
                subject_names[result.subject_id] = result.subject.name

    result = []
    for subject_id, nets in subject_nets.items():
        avg_net = sum(nets) / len(nets)
        last_net = nets[-1]
        change = last_net - avg_net if len(nets) >= 2 else None
        result.append({
            "subjectId": subject_id,
            "subjectName": subject_names.get(subject_id, f"Ders {subject_id}"),
            "avgNet": round(avg_net, 2),
            "lastNet": round(last_net, 2),
            "change": round(change, 2) if change is not None else None,
            "examCount": len(nets),
        })

    return result


# ============================================
# Zayıf Konu Tespiti (Kırmızı Alarm)
# Son 3 denemede sürekli kaçırılan konular + çalışma saatleriyle kıyaslama
# ============================================
@router.get("/weak-topics")
def get_weak_topics(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Son 3-5 denemede sürekli hata yapılan konular"""
    # Son 5 denemeyi al
    exam_query = db.query(Exam).filter(Exam.student_id == studentId)
    if examCategory:
        exam_query = exam_query.filter(Exam.exam_category == examCategory)

    recent_exams = exam_query.order_by(Exam.exam_date.desc()).limit(5).all()
    exam_ids = [e.id for e in recent_exams]

    if not exam_ids:
        return []

    # Konu bazlı hataları topla
    analyses = (
        db.query(QuestionAnalysis)
        .join(ExamResult)
        .options(
            joinedload(QuestionAnalysis.topic).joinedload(Topic.subject),
        )
        .filter(ExamResult.exam_id.in_(exam_ids))
        .all()
    )

    topic_errors = defaultdict(lambda: {
        "totalWrong": 0, "totalBlank": 0, "examAppearances": 0, "examIds": set()
    })

    for a in analyses:
        key = a.topic_id
        topic_errors[key]["totalWrong"] += a.wrong_count
        topic_errors[key]["totalBlank"] += a.blank_count
        topic_errors[key]["examIds"].add(a.exam_result.exam_id)
        topic_errors[key]["topic"] = a.topic
        topic_errors[key]["subject"] = a.topic.subject if a.topic else None

    # Son 30 gündeki çalışma sürelerini al (korelasyon için)
    thirty_days_ago = date.today() - timedelta(days=30)
    study_sessions = (
        db.query(StudySession)
        .filter(
            StudySession.student_id == studentId,
            StudySession.date >= thirty_days_ago
        )
        .all()
    )

    # Ders bazlı toplam çalışma süresi
    subject_study_hours = defaultdict(int)
    for s in study_sessions:
        subject_study_hours[s.subject_id] += s.duration_minutes

    result = []
    for topic_id, data in topic_errors.items():
        total_errors = data["totalWrong"] + data["totalBlank"]
        appearances = len(data["examIds"])
        error_rate = total_errors / appearances if appearances > 0 else 0

        topic = data.get("topic")
        subject = data.get("subject")

        # Status belirleme - 3+ denemede hata varsa KRİTİK
        if appearances >= 3 and error_rate >= 1.5:
            status = "CRITICAL"
        elif total_errors >= 3 or (appearances >= 2 and error_rate >= 1):
            status = "WARNING"
        else:
            continue  # Çok az hata - gösterme

        # İlgili dersin çalışma süresi
        study_minutes = subject_study_hours.get(subject.id, 0) if subject else 0

        result.append({
            "topicId": topic_id,
            "topicName": topic.name if topic else f"Konu {topic_id}",
            "subjectName": subject.name if subject else "",
            "subjectId": subject.id if subject else None,
            "totalWrong": data["totalWrong"],
            "totalBlank": data["totalBlank"],
            "totalErrors": total_errors,
            "examAppearances": appearances,
            "errorRate": round(error_rate, 2),
            "status": status,
            "studyMinutes": study_minutes,
            "studyHours": round(study_minutes / 60, 1),
            "needsMoreStudy": study_minutes < 60 and status == "CRITICAL",
        })

    result.sort(key=lambda x: (-1 if x["status"] == "CRITICAL" else 0, -x["totalErrors"]))
    return result


# ============================================
# Kırmızı Alarm - Geliştirilmiş
# Son 3 denemede sürekli kaçırılan konuların çalışma saatleriyle kıyaslanması
# ============================================
@router.get("/red-alerts")
def get_red_alerts(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Kırmızı Alarm: Sürekli kaçırılan konular vs çalışma saatleri"""
    # Son 3 denemeyi al
    exam_query = db.query(Exam).filter(Exam.student_id == studentId)
    if examCategory:
        exam_query = exam_query.filter(Exam.exam_category == examCategory)

    last_3_exams = exam_query.order_by(Exam.exam_date.desc()).limit(3).all()
    exam_ids = [e.id for e in last_3_exams]

    if len(exam_ids) < 2:
        return {"alerts": [], "message": "Yeterli deneme verisi yok (en az 2 deneme gerekli)"}

    # Her denemede hata yapılan konuları bul
    exam_topic_errors = defaultdict(set)  # topic_id -> set of exam_ids where error occurred
    topic_info = {}

    for exam_id in exam_ids:
        analyses = (
            db.query(QuestionAnalysis)
            .join(ExamResult)
            .options(joinedload(QuestionAnalysis.topic).joinedload(Topic.subject))
            .filter(ExamResult.exam_id == exam_id)
            .all()
        )
        for a in analyses:
            if a.wrong_count > 0 or a.blank_count > 0:
                exam_topic_errors[a.topic_id].add(exam_id)
                if a.topic_id not in topic_info:
                    topic_info[a.topic_id] = {
                        "topicName": a.topic.name if a.topic else "",
                        "subjectName": a.topic.subject.name if a.topic and a.topic.subject else "",
                        "subjectId": a.topic.subject.id if a.topic and a.topic.subject else None,
                    }

    # Tüm sınavlarda hata yapılan konular = alarm
    consistent_errors = {
        topic_id: exam_set
        for topic_id, exam_set in exam_topic_errors.items()
        if len(exam_set) >= len(exam_ids)  # Tüm sınavlarda tekrar eden
    }

    # Çalışma süresi karşılaştırması
    thirty_days_ago = date.today() - timedelta(days=30)
    study_sessions = (
        db.query(StudySession)
        .filter(
            StudySession.student_id == studentId,
            StudySession.date >= thirty_days_ago
        )
        .all()
    )

    subject_study = defaultdict(int)
    for s in study_sessions:
        subject_study[s.subject_id] += s.duration_minutes

    alerts = []
    for topic_id, exam_set in consistent_errors.items():
        info = topic_info.get(topic_id, {})
        subject_id = info.get("subjectId")
        study_mins = subject_study.get(subject_id, 0) if subject_id else 0

        alerts.append({
            "topicId": topic_id,
            "topicName": info.get("topicName", ""),
            "subjectName": info.get("subjectName", ""),
            "subjectId": subject_id,
            "consecutiveExams": len(exam_set),
            "studyMinutes": study_mins,
            "studyHours": round(study_mins / 60, 1),
            "recommendation": (
                "🔴 Bu konuya hiç çalışılmamış! Acil çalışma planı oluştur."
                if study_mins == 0 else
                "🟠 Çalışıldığı halde hata devam ediyor. Farklı kaynak/yöntem dene."
                if study_mins > 0 else
                "🟡 Çalışma süresini artır."
            ),
        })

    alerts.sort(key=lambda x: x["studyMinutes"])
    return {
        "alerts": alerts,
        "examCount": len(exam_ids),
        "message": f"Son {len(exam_ids)} denemede {len(alerts)} konuda sürekli hata tespit edildi."
    }


# ============================================
# Haftalık Verimlilik Raporu
# Toplam süre, toplam soru, başarı yüzdesi
# ============================================
@router.get("/weekly-report")
def get_weekly_report(
    studentId: int = Query(...),
    weekOffset: int = Query(0),  # 0 = bu hafta, -1 = geçen hafta
    db: Session = Depends(get_db)
):
    """Haftalık verimlilik raporu üret"""
    today = date.today()
    # Pazartesi'den başla
    start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=weekOffset)
    end_of_week = start_of_week + timedelta(days=6)

    # Günlük soru verileri
    daily_questions = (
        db.query(DailyQuestion)
        .options(joinedload(DailyQuestion.subject))
        .filter(
            DailyQuestion.student_id == studentId,
            DailyQuestion.date >= start_of_week,
            DailyQuestion.date <= end_of_week,
        )
        .all()
    )

    # Çalışma süresi verileri
    study_sessions = (
        db.query(StudySession)
        .options(joinedload(StudySession.subject))
        .filter(
            StudySession.student_id == studentId,
            StudySession.date >= start_of_week,
            StudySession.date <= end_of_week,
        )
        .all()
    )

    # Hedefler
    goals = (
        db.query(Goal)
        .filter(Goal.student_id == studentId, Goal.is_active == True)
        .all()
    )

    # Toplam hesaplamalar
    total_solved = sum(dq.solved_count for dq in daily_questions)
    total_correct = sum(dq.correct_count for dq in daily_questions)
    total_wrong = sum(dq.wrong_count for dq in daily_questions)
    total_study_minutes = sum(ss.duration_minutes for ss in study_sessions)
    success_rate = (total_correct / total_solved * 100) if total_solved > 0 else 0

    # Ders bazlı breakdown
    subject_questions = defaultdict(lambda: {"solved": 0, "correct": 0, "wrong": 0})
    for dq in daily_questions:
        key = dq.subject_id
        subject_questions[key]["solved"] += dq.solved_count
        subject_questions[key]["correct"] += dq.correct_count
        subject_questions[key]["wrong"] += dq.wrong_count
        subject_questions[key]["name"] = dq.subject.name if dq.subject else f"Ders {key}"

    subject_study = defaultdict(lambda: {"minutes": 0})
    for ss in study_sessions:
        key = ss.subject_id
        subject_study[key]["minutes"] += ss.duration_minutes
        subject_study[key]["name"] = ss.subject.name if ss.subject else f"Ders {key}"

    # Günlük breakdown
    daily_breakdown = defaultdict(lambda: {"solved": 0, "correct": 0, "minutes": 0})
    for dq in daily_questions:
        day_key = dq.date.isoformat()
        daily_breakdown[day_key]["solved"] += dq.solved_count
        daily_breakdown[day_key]["correct"] += dq.correct_count
    for ss in study_sessions:
        day_key = ss.date.isoformat()
        daily_breakdown[day_key]["minutes"] += ss.duration_minutes

    # Tüm günleri doldur
    daily_data = []
    gun_isimleri = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        day_key = d.isoformat()
        info = daily_breakdown.get(day_key, {"solved": 0, "correct": 0, "minutes": 0})
        daily_data.append({
            "date": day_key,
            "dayName": gun_isimleri[i],
            "solved": info["solved"],
            "correct": info["correct"],
            "minutes": info["minutes"],
            "hours": round(info["minutes"] / 60, 1),
        })

    # Hedef gerçekleşme
    weekly_question_goal = None
    weekly_duration_goal = None
    daily_question_goal = None
    daily_duration_goal = None

    for g in goals:
        if g.goal_type == "weekly" and g.metric_type == "questions" and g.subject_id is None:
            weekly_question_goal = g.target_value
        elif g.goal_type == "weekly" and g.metric_type == "duration" and g.subject_id is None:
            weekly_duration_goal = g.target_value
        elif g.goal_type == "daily" and g.metric_type == "questions" and g.subject_id is None:
            daily_question_goal = g.target_value
        elif g.goal_type == "daily" and g.metric_type == "duration" and g.subject_id is None:
            daily_duration_goal = g.target_value

    return {
        "weekStart": start_of_week.isoformat(),
        "weekEnd": end_of_week.isoformat(),
        "summary": {
            "totalSolved": total_solved,
            "totalCorrect": total_correct,
            "totalWrong": total_wrong,
            "successRate": round(success_rate, 1),
            "totalStudyMinutes": total_study_minutes,
            "totalStudyHours": round(total_study_minutes / 60, 1),
            "activeDays": len([d for d in daily_data if d["solved"] > 0 or d["minutes"] > 0]),
        },
        "goals": {
            "weeklyQuestions": {
                "target": weekly_question_goal,
                "actual": total_solved,
                "percentage": round(total_solved / weekly_question_goal * 100, 1) if weekly_question_goal else None,
            },
            "weeklyDuration": {
                "target": weekly_duration_goal,
                "actual": total_study_minutes,
                "percentage": round(total_study_minutes / weekly_duration_goal * 100, 1) if weekly_duration_goal else None,
            },
            "dailyQuestions": {
                "target": daily_question_goal,
                "todayActual": daily_data[today.weekday()]["solved"] if today.weekday() < 7 and weekOffset == 0 else None,
            },
            "dailyDuration": {
                "target": daily_duration_goal,
                "todayActual": daily_data[today.weekday()]["minutes"] if today.weekday() < 7 and weekOffset == 0 else None,
            },
        },
        "dailyBreakdown": daily_data,
        "subjectQuestions": [
            {
                "subjectId": sid,
                "subjectName": data["name"],
                "solved": data["solved"],
                "correct": data["correct"],
                "wrong": data["wrong"],
                "successRate": round(data["correct"] / data["solved"] * 100, 1) if data["solved"] > 0 else 0,
            }
            for sid, data in subject_questions.items()
        ],
        "subjectStudy": [
            {
                "subjectId": sid,
                "subjectName": data["name"],
                "minutes": data["minutes"],
                "hours": round(data["minutes"] / 60, 1),
            }
            for sid, data in subject_study.items()
        ],
    }


# ============================================
# Deneme Sonuçları ve Günlük Çalışma Korelasyonu
# ============================================
@router.get("/correlation")
def get_correlation(
    studentId: int = Query(...),
    examCategory: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Deneme sonuçları ile günlük çalışma verileri arasındaki korelasyon"""
    # Son 10 denemeyi al
    exam_query = db.query(Exam).filter(Exam.student_id == studentId)
    if examCategory:
        exam_query = exam_query.filter(Exam.exam_category == examCategory)

    exams = exam_query.order_by(Exam.exam_date).all()

    if len(exams) < 2:
        return {"data": [], "message": "Yeterli veri yok"}

    result = []
    for exam in exams:
        exam_date = exam.exam_date.date() if isinstance(exam.exam_date, datetime) else exam.exam_date

        # Deneme öncesi 7 günlük çalışma verileri
        week_before = exam_date - timedelta(days=7)

        # O haftadaki toplam soru
        week_questions = (
            db.query(func.coalesce(func.sum(DailyQuestion.solved_count), 0))
            .filter(
                DailyQuestion.student_id == studentId,
                DailyQuestion.date >= week_before,
                DailyQuestion.date < exam_date,
            )
            .scalar()
        )

        # O haftadaki toplam çalışma süresi
        week_study = (
            db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))
            .filter(
                StudySession.student_id == studentId,
                StudySession.date >= week_before,
                StudySession.date < exam_date,
            )
            .scalar()
        )

        result.append({
            "examName": exam.exam_name,
            "examDate": exam_date.isoformat(),
            "totalNet": exam.total_net,
            "weeklyQuestions": week_questions,
            "weeklyStudyMinutes": week_study,
            "weeklyStudyHours": round(week_study / 60, 1) if week_study else 0,
        })

    return {"data": result}
