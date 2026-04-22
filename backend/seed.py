"""
Seed Script - Başlangıç verilerini yükle
============================================
Öğrenciler, dersler ve konuları veritabanına ekler.
"""
from app.database import SessionLocal, engine, Base
from app.models import Student, Subject, Topic

# Tabloları oluştur
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    try:
        # Mevcut veri varsa atla
        existing = db.query(Student).first()
        if existing:
            print("Veriler zaten mevcut, seed atlanıyor.")
            return

        # ============================================
        # ÖĞRENCILER
        # ============================================
        students = [
            Student(name="Kardeş 1", exam_type="LGS", avatar="🎯"),
            Student(name="Kardeş 2", exam_type="TYT", avatar="🚀"),
        ]
        db.add_all(students)
        db.flush()

        # ============================================
        # LGS DERSLERİ
        # ============================================
        lgs_subjects = [
            {"name": "Türkçe", "total_questions": 20, "coefficient": 4.0, "order": 1, "topics": [
                "Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Dil Bilgisi",
                "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri",
                "Sözcük Türleri", "Cümlenin Ögeleri", "Fiilde Çatı",
            ]},
            {"name": "Matematik", "total_questions": 20, "coefficient": 4.0, "order": 2, "topics": [
                "Üslü İfadeler", "Kareköklü İfadeler", "Veri Analizi",
                "Cebirsel İfadeler", "Doğrusal Denklemler", "Eşitsizlikler",
                "Olasılık", "Dönüşüm Geometrisi", "Üçgenler", "Eşlik ve Benzerlik",
                "Geometrik Cisimler", "Prizmalar", "Piramitler",
            ]},
            {"name": "Fen Bilimleri", "total_questions": 20, "coefficient": 4.0, "order": 3, "topics": [
                "Mevsimler ve İklim", "DNA ve Genetik Kod", "Basınç",
                "Madde ve Endüstri", "Basit Makineler", "Enerji Dönüşümleri",
                "Elektrik Yükleri", "Periyodik Sistem", "Kimyasal Tepkimeler",
                "Asitler ve Bazlar",
            ]},
            {"name": "T.C. İnkılap Tarihi", "total_questions": 10, "coefficient": 1.0, "order": 4, "topics": [
                "Bir Kahraman Doğuyor", "Milli Uyanış",
                "Milli Bir Destan", "Atatürkçülük ve Çağdaşlaşma",
                "Demokratikleşme Çabaları", "Atatürk Dönemi Dış Politika",
            ]},
            {"name": "Din Kültürü", "total_questions": 10, "coefficient": 1.0, "order": 5, "topics": [
                "Kader İnancı", "Zekât ve Sadaka", "Din ve Hayat",
                "Hz. Muhammed'in Örnekliği", "Kur'an-ı Kerim",
            ]},
            {"name": "İngilizce", "total_questions": 10, "coefficient": 1.0, "order": 6, "topics": [
                "Friendship", "Teen Life", "In The Kitchen",
                "On The Phone", "The Internet", "Adventures",
                "Tourism", "Chores", "Science", "Natural Forces",
            ]},
        ]

        for subj_data in lgs_subjects:
            subject = Subject(
                name=subj_data["name"],
                exam_type="LGS",
                total_questions=subj_data["total_questions"],
                coefficient=subj_data["coefficient"],
                display_order=subj_data["order"],
            )
            db.add(subject)
            db.flush()

            for topic_name in subj_data["topics"]:
                db.add(Topic(subject_id=subject.id, name=topic_name))

        # ============================================
        # TYT DERSLERİ
        # ============================================
        tyt_subjects = [
            {"name": "Türkçe", "total_questions": 40, "order": 1, "topics": [
                "Sözcükte Anlam", "Cümlede Anlam", "Paragraf",
                "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri",
                "Sözcük Türleri", "Cümle Türleri", "Anlatım Bozuklukları",
            ]},
            {"name": "Matematik", "total_questions": 40, "order": 2, "topics": [
                "Temel Kavramlar", "Sayı Basamakları", "Bölünebilme",
                "EBOB-EKOK", "Rasyonel Sayılar", "Basit Eşitsizlikler",
                "Mutlak Değer", "Üslü Sayılar", "Köklü Sayılar",
                "Çarpanlara Ayırma", "1. Dereceden Denklemler",
                "Oran-Orantı", "Problemler", "Kümeler", "Fonksiyonlar",
                "Polinomlar", "İstatistik", "Olasılık",
            ]},
            {"name": "Fizik", "total_questions": 7, "order": 3, "topics": [
                "Fizik Bilimine Giriş", "Madde ve Özellikleri",
                "Hareket ve Kuvvet", "Enerji", "Isı ve Sıcaklık",
                "Elektrostatik", "Elektrik Akımı", "Optik", "Dalgalar",
            ]},
            {"name": "Kimya", "total_questions": 7, "order": 4, "topics": [
                "Kimya Bilimi", "Atom ve Periyodik Sistem",
                "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri",
                "Doğa ve Kimya", "Kimyasal Tepkimeler", "Asitler ve Bazlar",
            ]},
            {"name": "Biyoloji", "total_questions": 6, "order": 5, "topics": [
                "Canlıların Ortak Özellikleri", "Hücre",
                "Canlılar Dünyası", "Ekosistem", "Kalıtım",
            ]},
        ]

        for subj_data in tyt_subjects:
            subject = Subject(
                name=subj_data["name"],
                exam_type="TYT",
                total_questions=subj_data["total_questions"],
                coefficient=1.0,
                display_order=subj_data["order"],
            )
            db.add(subject)
            db.flush()

            for topic_name in subj_data["topics"]:
                db.add(Topic(subject_id=subject.id, name=topic_name))

        # ============================================
        # AYT DERSLERİ (Sayısal)
        # ============================================
        ayt_subjects = [
            {"name": "Matematik", "total_questions": 40, "order": 1, "topics": [
                "Trigonometri", "Logaritma", "Diziler", "Limit",
                "Türev", "İntegral", "Analitik Geometri",
                "Karmaşık Sayılar", "Kombinasyon", "Binom",
            ]},
            {"name": "Fizik", "total_questions": 14, "order": 2, "topics": [
                "Kuvvet ve Hareket", "Elektrik ve Manyetizma",
                "Dalgalar", "Atom Fiziği", "Modern Fizik",
            ]},
            {"name": "Kimya", "total_questions": 13, "order": 3, "topics": [
                "Kimyasal Hesaplamalar", "Gazlar", "Çözeltiler",
                "Kimyasal Tepkimelerde Enerji", "Tepkime Hızları",
                "Kimyasal Denge", "Organik Kimya",
            ]},
            {"name": "Biyoloji", "total_questions": 13, "order": 4, "topics": [
                "Nükleik Asitler", "Protein Sentezi", "Fotosentez",
                "Solunum", "Bitki Biyolojisi", "Sinir Sistemi",
                "Endokrin Sistem", "Komünite ve Popülasyon",
            ]},
        ]

        for subj_data in ayt_subjects:
            subject = Subject(
                name=subj_data["name"],
                exam_type="AYT",
                total_questions=subj_data["total_questions"],
                coefficient=1.0,
                display_order=subj_data["order"],
            )
            db.add(subject)
            db.flush()

            for topic_name in subj_data["topics"]:
                db.add(Topic(subject_id=subject.id, name=topic_name))

        db.commit()
        print("[OK] Seed verileri basariyla yuklendi!")
        print(f"   - {len(students)} ogrenci")
        print(f"   - {len(lgs_subjects)} LGS dersi")
        print(f"   - {len(tyt_subjects)} TYT dersi")
        print(f"   - {len(ayt_subjects)} AYT dersi")

    except Exception as e:
        db.rollback()
        print(f"[HATA] Seed hatasi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
