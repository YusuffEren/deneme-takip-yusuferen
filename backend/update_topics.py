"""
Tek seferlik müfredat güncelleme scripti
===========================================
Canlı veritabanına (Neon) eksik kalan konuları ekler.
Var olan konulara dokunmaz, tekrar çalıştırılırsa çift eklemesin diye
idempotent yazılmıştır.

Kullanim:  cd backend && python update_topics.py
"""
from app.database import SessionLocal
from app.models import Subject, Topic

# (sinav_turu, ders_adi, eklenecek_konular)
ADDITIONS = [
    ("LGS", "Matematik", [
        "Çarpanlar ve Katlar",
    ]),
    ("LGS", "T.C. İnkılap Tarihi", [
        "Atatürk'ün Ölümü ve Sonrası",
    ]),
]


def main():
    db = SessionLocal()
    try:
        for exam_type, subject_name, topic_names in ADDITIONS:
            subject = (
                db.query(Subject)
                .filter(Subject.exam_type == exam_type, Subject.name == subject_name)
                .first()
            )
            if not subject:
                print(f"[ATLANDI] Ders bulunamadi: {exam_type} / {subject_name}")
                continue

            for name in topic_names:
                exists = (
                    db.query(Topic)
                    .filter(Topic.subject_id == subject.id, Topic.name == name)
                    .first()
                )
                if exists:
                    print(f"[VAR] {subject_name} -> {name}")
                else:
                    db.add(Topic(subject_id=subject.id, name=name))
                    print(f"[EKLENDI] {subject_name} -> {name}")

        db.commit()
        print("Tamam.")
    except Exception as e:
        db.rollback()
        print(f"[HATA] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
