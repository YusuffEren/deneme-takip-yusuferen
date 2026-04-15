// ============================================
// Deneme Sınavı Takip - Veritabanı Seed Data
// 2025-2026 MEB müfredatına uygun LGS + TYT/AYT Sayısal ders ve konuları
// ============================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // Mevcut verileri temizle (sıralı silme - foreign key uyumu)
  await prisma.questionAnalysis.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();

  // ============================================
  // 1. ÖĞRENCİ PROFİLLERİ
  // ============================================
  const esma = await prisma.student.create({
    data: { name: 'Esma', examType: 'LGS', avatar: '📖' }
  });
  const mehmet = await prisma.student.create({
    data: { name: 'Mehmet', examType: 'TYT', avatar: '🚀' }
  });
  console.log(`✅ Öğrenciler oluşturuldu: ${esma.name} (LGS), ${mehmet.name} (TYT/AYT)`);

  // ============================================
  // 2. LGS DERSLERİ VE KONULARI (8. Sınıf 2025-2026 MEB Müfredatı)
  // ============================================

  // --- LGS Türkçe (20 soru, katsayı 4) ---
  await prisma.subject.create({
    data: {
      name: 'Türkçe', examType: 'LGS', totalQuestions: 20, coefficient: 4, displayOrder: 1,
      topics: {
        create: [
          { name: 'Sözcükte Anlam' },
          { name: 'Söz Gruplarında Anlam' },
          { name: 'Deyimler ve Atasözleri' },
          { name: 'Cümlede Anlam' },
          { name: 'Parçada Anlam (Ana Düşünce, Yardımcı Düşünce)' },
          { name: 'Fiilimsiler (İsim Fiil, Sıfat Fiil, Zarf Fiil)' },
          { name: 'Fiilde Çatı (Etken, Edilgen, Dönüşlü, İşteş)' },
          { name: 'Cümlenin Ögeleri (Özne, Yüklem, Nesne, Tümleç)' },
          { name: 'Cümle Türleri (Yapısına/Anlamına Göre)' },
          { name: 'Söz Sanatları (Benzetme, Kişileştirme, Abartma)' },
          { name: 'Yazım Kuralları' },
          { name: 'Noktalama İşaretleri' },
          { name: 'Anlatım Bozuklukları' },
          { name: 'Metin Türleri' },
          { name: 'Görsel Okuma' },
        ]
      }
    }
  });

  // --- LGS Matematik (20 soru, katsayı 4) ---
  await prisma.subject.create({
    data: {
      name: 'Matematik', examType: 'LGS', totalQuestions: 20, coefficient: 4, displayOrder: 2,
      topics: {
        create: [
          { name: 'Çarpanlar ve Katlar (EBOB-EKOK)' },
          { name: 'Üslü İfadeler' },
          { name: 'Kareköklü İfadeler' },
          { name: 'Veri Analizi (Histogram, Çizgi Grafiği)' },
          { name: 'Basit Olayların Olma Olasılığı' },
          { name: 'Cebirsel İfadeler ve Özdeşlikler' },
          { name: 'Doğrusal Denklemler' },
          { name: 'Eşitsizlikler' },
          { name: 'Üçgenler (Açı-Kenar Bağıntıları)' },
          { name: 'Eşlik ve Benzerlik' },
          { name: 'Dönüşüm Geometrisi (Öteleme, Yansıma, Döndürme)' },
          { name: 'Geometrik Cisimler (Prizma, Silindir, Koni, Küre)' },
        ]
      }
    }
  });

  // --- LGS Fen Bilimleri (20 soru, katsayı 4) ---
  await prisma.subject.create({
    data: {
      name: 'Fen Bilimleri', examType: 'LGS', totalQuestions: 20, coefficient: 4, displayOrder: 3,
      topics: {
        create: [
          { name: 'Mevsimler ve İklim' },
          { name: 'DNA ve Genetik Kod' },
          { name: 'Basınç (Katı, Sıvı, Gaz Basıncı)' },
          { name: 'Madde ve Endüstri (Periyodik Sistem)' },
          { name: 'Kimyasal Tepkimeler' },
          { name: 'Basit Makineler (Kaldıraç, Makara, Eğik Düzlem)' },
          { name: 'Enerji Dönüşümleri ve Çevre Bilimi' },
          { name: 'Elektrik Yükleri ve Elektrik Enerjisi' },
        ]
      }
    }
  });

  // --- LGS T.C. İnkılap Tarihi (10 soru, katsayı 1) ---
  await prisma.subject.create({
    data: {
      name: 'T.C. İnkılap Tarihi', examType: 'LGS', totalQuestions: 10, coefficient: 1, displayOrder: 4,
      topics: {
        create: [
          { name: 'Bir Kahraman Doğuyor (Atatürk\'ün Çocukluk ve Gençlik Yılları)' },
          { name: 'Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar' },
          { name: 'Millî Bir Destan: Ya İstiklâl Ya Ölüm!' },
          { name: 'Atatürkçülük ve Çağdaşlaşan Türkiye' },
          { name: 'Demokratikleşme Çabaları' },
          { name: 'Atatürk Dönemi Türk Dış Politikası' },
          { name: 'Atatürk\'ün Ölümü ve Sonrası' },
        ]
      }
    }
  });

  // --- LGS Din Kültürü (10 soru, katsayı 1) ---
  await prisma.subject.create({
    data: {
      name: 'Din Kültürü', examType: 'LGS', totalQuestions: 10, coefficient: 1, displayOrder: 5,
      topics: {
        create: [
          { name: 'Kader İnancı' },
          { name: 'İnsanın İradesi ve Kader' },
          { name: 'Kaderle İlgili Kavramlar' },
          { name: 'Zekât ve Sadaka İbadeti' },
          { name: 'İslam\'ın Paylaşma ve Yardımlaşmaya Verdiği Önem' },
          { name: 'Din, Birey ve Toplum' },
          { name: 'Hz. Muhammed\'in Örnekliği' },
        ]
      }
    }
  });

  // --- LGS İngilizce (10 soru, katsayı 1) ---
  await prisma.subject.create({
    data: {
      name: 'İngilizce', examType: 'LGS', totalQuestions: 10, coefficient: 1, displayOrder: 6,
      topics: {
        create: [
          { name: 'Friendship' },
          { name: 'Teen Life' },
          { name: 'In the Kitchen' },
          { name: 'On the Phone' },
          { name: 'The Internet' },
          { name: 'Adventures' },
          { name: 'Tourism' },
          { name: 'Chores' },
          { name: 'Science' },
          { name: 'Natural Forces' },
        ]
      }
    }
  });

  console.log('✅ LGS dersleri ve konuları oluşturuldu');

  // ============================================
  // 3. TYT DERSLERİ VE KONULARI (2026 ÖSYM Müfredatı)
  // ============================================

  // --- TYT Türkçe (40 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Türkçe', examType: 'TYT', totalQuestions: 40, coefficient: 1, displayOrder: 1,
      topics: {
        create: [
          { name: 'Sözcükte Anlam' },
          { name: 'Cümlede Anlam' },
          { name: 'Paragraf (Ana Düşünce, Yapı, Anlatım Teknikleri)' },
          { name: 'Ses Bilgisi (Ünlü/Ünsüz Uyumu)' },
          { name: 'Yazım Kuralları' },
          { name: 'Noktalama İşaretleri' },
          { name: 'Sözcük Türleri (İsim, Sıfat, Zarf, Fiil, Edat, Bağlaç)' },
          { name: 'Sözcükte Yapı (Kök, Ek, Türeme, Birleşik)' },
          { name: 'Ekler ve Sözcük Yapısı' },
          { name: 'Tamlamalar' },
          { name: 'Fiil, Ek Fiil, Fiilimsi' },
          { name: 'Cümlenin Ögeleri' },
          { name: 'Cümle Türleri (Anlamına/Yapısına Göre)' },
          { name: 'Anlatım Bozuklukları' },
        ]
      }
    }
  });

  // --- TYT Matematik (30 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Matematik', examType: 'TYT', totalQuestions: 30, coefficient: 1, displayOrder: 2,
      topics: {
        create: [
          { name: 'Temel Kavramlar' },
          { name: 'Sayı Basamakları' },
          { name: 'Bölme ve Bölünebilme Kuralları' },
          { name: 'EBOB-EKOK' },
          { name: 'Rasyonel Sayılar' },
          { name: 'Basit Eşitsizlikler' },
          { name: 'Mutlak Değer' },
          { name: 'Üslü Sayılar' },
          { name: 'Köklü Sayılar' },
          { name: 'Çarpanlara Ayırma' },
          { name: 'Denklem Çözme' },
          { name: 'Oran ve Orantı' },
          { name: 'Problemler (Sayı, Kesir, Yaş, Hız, İşçi, Yüzde, Kar-Zarar, Karışım)' },
          { name: 'Kümeler' },
          { name: 'Mantık' },
          { name: 'Fonksiyonlar' },
          { name: 'Polinomlar' },
          { name: 'Permütasyon ve Kombinasyon' },
          { name: 'Binom Açılımı' },
          { name: 'Olasılık' },
          { name: 'İstatistik ve Veri Analizi' },
        ]
      }
    }
  });

  // --- TYT Geometri (10 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Geometri', examType: 'TYT', totalQuestions: 10, coefficient: 1, displayOrder: 3,
      topics: {
        create: [
          { name: 'Temel Kavramlar ve Doğruda Açılar' },
          { name: 'Üçgende Açılar' },
          { name: 'Üçgende Eşlik ve Benzerlik' },
          { name: 'Üçgende Açıortay ve Kenarortay' },
          { name: 'Üçgende Alan' },
          { name: 'Özel Üçgenler (Dik, İkizkenar, Eşkenar)' },
          { name: 'Çokgenler' },
          { name: 'Dörtgenler (Kare, Dikdörtgen, Yamuk, Paralelkenar)' },
          { name: 'Çember ve Daire' },
          { name: 'Analitik Geometri (Noktanın ve Doğrunun Analitiği)' },
          { name: 'Katı Cisimler (Prizma, Küp, Silindir, Piramit, Koni, Küre)' },
        ]
      }
    }
  });

  // --- TYT Fizik (7 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Fizik', examType: 'TYT', totalQuestions: 7, coefficient: 1, displayOrder: 4,
      topics: {
        create: [
          { name: 'Fizik Bilimine Giriş' },
          { name: 'Madde ve Özellikleri' },
          { name: 'Hareket ve Kuvvet' },
          { name: 'İş, Güç ve Enerji' },
          { name: 'Isı ve Sıcaklık' },
          { name: 'Elektrostatik' },
          { name: 'Elektrik ve Manyetizma' },
          { name: 'Basınç ve Kaldırma Kuvveti' },
          { name: 'Dalgalar' },
          { name: 'Optik' },
        ]
      }
    }
  });

  // --- TYT Kimya (7 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Kimya', examType: 'TYT', totalQuestions: 7, coefficient: 1, displayOrder: 5,
      topics: {
        create: [
          { name: 'Kimya Bilimi' },
          { name: 'Atom ve Yapısı' },
          { name: 'Periyodik Sistem' },
          { name: 'Kimyasal Türler Arası Etkileşimler' },
          { name: 'Maddenin Halleri' },
          { name: 'Kimyanın Temel Kanunları' },
          { name: 'Kimyasal Tepkimeler ve Hesaplamalar' },
          { name: 'Karışımlar (Homojen, Heterojen)' },
          { name: 'Asitler, Bazlar ve Tuzlar' },
          { name: 'Kimya Her Yerde' },
        ]
      }
    }
  });

  // --- TYT Biyoloji (6 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Biyoloji', examType: 'TYT', totalQuestions: 6, coefficient: 1, displayOrder: 6,
      topics: {
        create: [
          { name: 'Canlıların Ortak Özellikleri' },
          { name: 'Canlıların Temel Bileşenleri' },
          { name: 'Hücre ve Organelleri' },
          { name: 'Madde Geçişleri (Hücre Zarından)' },
          { name: 'Canlıların Sınıflandırılması' },
          { name: 'Hücre Bölünmeleri ve Üreme' },
          { name: 'Kalıtım (Mendel Genetiği)' },
          { name: 'Ekosistem Ekolojisi' },
          { name: 'Güncel Çevre Sorunları' },
        ]
      }
    }
  });

  // --- TYT Tarih (5 soru) - SOSYAL BİLİMLER ---
  await prisma.subject.create({
    data: {
      name: 'Tarih', examType: 'TYT', totalQuestions: 5, coefficient: 1, displayOrder: 7,
      topics: {
        create: [
          { name: 'İlk ve Orta Çağlarda Türk Dünyası' },
          { name: 'Türklerin İslamiyeti Kabulü ve İlk Türk İslam Devletleri' },
          { name: 'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi' },
          { name: 'Beylikten Devlete Osmanlı Siyaseti (1302-1453)' },
          { name: 'Sultan ve Osmanlı Merkez Teşkilatı' },
          { name: 'Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti (1595-1774)' },
          { name: 'Uluslararası İlişkilerde Denge Siyaseti' },
          { name: '19. ve 20. Yüzyılda Değişen Sosyoekonomik Hayat' },
          { name: 'Milli Mücadele' },
          { name: 'Atatürkçülük ve Atatürk İnkılapları' },
        ]
      }
    }
  });

  // --- TYT Coğrafya (5 soru) - SOSYAL BİLİMLER ---
  await prisma.subject.create({
    data: {
      name: 'Coğrafya', examType: 'TYT', totalQuestions: 5, coefficient: 1, displayOrder: 8,
      topics: {
        create: [
          { name: 'Coğrafi Konum' },
          { name: 'Dünya\'nın Şekli ve Hareketleri' },
          { name: 'Harita Bilgisi' },
          { name: 'Atmosfer ve Sıcaklık' },
          { name: 'Basınç ve Rüzgarlar' },
          { name: 'Nem, Yağış ve Buharlaşma' },
          { name: 'İklim Bilgisi' },
          { name: 'İç ve Dış Kuvvetler' },
          { name: 'Su, Toprak ve Bitkiler' },
          { name: 'Nüfus, Yerleşme ve Göç' },
          { name: 'Türkiye\'nin Yer Şekilleri' },
          { name: 'Ekonomik Faaliyetler' },
          { name: 'Bölgeler ve Ülkeler' },
          { name: 'Uluslararası Ulaşım Hatları' },
          { name: 'Çevre ve Toplum' },
          { name: 'Doğal Afetler' },
        ]
      }
    }
  });

  // --- TYT Felsefe (5 soru) - SOSYAL BİLİMLER ---
  await prisma.subject.create({
    data: {
      name: 'Felsefe', examType: 'TYT', totalQuestions: 5, coefficient: 1, displayOrder: 9,
      topics: {
        create: [
          { name: 'Felsefenin Anlamı' },
          { name: 'Felsefe ile Düşünme' },
          { name: 'Bilgi Felsefesi' },
          { name: 'Varlık Felsefesi' },
          { name: 'Bilim Felsefesi' },
          { name: 'Ahlak Felsefesi' },
          { name: 'Siyaset Felsefesi' },
          { name: 'Sanat Felsefesi' },
          { name: 'Din Felsefesi' },
        ]
      }
    }
  });

  // --- TYT Din Kültürü (5 soru) - SOSYAL BİLİMLER ---
  await prisma.subject.create({
    data: {
      name: 'Din Kültürü', examType: 'TYT', totalQuestions: 5, coefficient: 1, displayOrder: 10,
      topics: {
        create: [
          { name: 'Bilgi ve İnanç' },
          { name: 'Din ve İslam' },
          { name: 'İslam ve İbadet' },
          { name: 'Allah-İnsan İlişkisi' },
          { name: 'Hz. Muhammed ve Gençlik' },
          { name: 'Kur\'an\'a Göre Hz. Muhammed' },
          { name: 'Din ve Hayat' },
          { name: 'Ahlaki Tutum ve Davranışlar' },
          { name: 'Gençlik ve Değerler' },
          { name: 'Gönül Coğrafyamız' },
          { name: 'Dünya ve Ahiret' },
          { name: 'İslam Düşüncesinde İtikadi, Siyasi ve Fıkhi Yorumlar' },
          { name: 'İslam Düşüncesinde Tasavvufi Yorumlar' },
          { name: 'Anadolu\'da İslam' },
          { name: 'Güncel Dinî Meseleler' },
        ]
      }
    }
  });

  console.log('✅ TYT dersleri ve konuları oluşturuldu (Sosyal Bilimler dahil)');

  // ============================================
  // 4. AYT SAYISAL DERSLERİ VE KONULARI (2026 ÖSYM Müfredatı)
  // ============================================

  // --- AYT Matematik (40 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Matematik', examType: 'AYT', totalQuestions: 40, coefficient: 1, displayOrder: 1,
      topics: {
        create: [
          { name: 'Fonksiyonlar (Bileşke, Ters Fonksiyon)' },
          { name: 'Polinomlar' },
          { name: 'İkinci Dereceden Denklemler' },
          { name: 'Parabol' },
          { name: 'Eşitsizlikler (Parabol Eşitsizlik)' },
          { name: 'Trigonometri (Trigonometrik Fonksiyonlar)' },
          { name: 'Trigonometrik Denklemler' },
          { name: 'Permütasyon' },
          { name: 'Kombinasyon' },
          { name: 'Binom Açılımı' },
          { name: 'Olasılık (Koşullu, Bağımsız Olaylar)' },
          { name: 'Logaritma' },
          { name: 'Diziler' },
          { name: 'Seriler' },
          { name: 'Limit' },
          { name: 'Süreklilik' },
          { name: 'Türev (Türev Kuralları)' },
          { name: 'Türev Uygulamaları' },
          { name: 'İntegral (Belirsiz İntegral)' },
          { name: 'Belirli İntegral ve Uygulamaları' },
          { name: 'Karmaşık Sayılar' },
          { name: 'Matris ve Determinant' },
          { name: 'Doğrunun Analitiği' },
          { name: 'Çemberin Analitiği' },
          { name: 'Uzay Geometri' },
        ]
      }
    }
  });

  // --- AYT Fizik (14 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Fizik', examType: 'AYT', totalQuestions: 14, coefficient: 1, displayOrder: 2,
      topics: {
        create: [
          { name: 'Vektörler' },
          { name: 'Kuvvet, Tork ve Denge' },
          { name: 'Kütle Merkezi ve Momentum' },
          { name: 'Basit Harmonik Hareket' },
          { name: 'Dalga Mekaniği' },
          { name: 'Elektrostatik (Coulomb Kuvveti, Elektrik Alan)' },
          { name: 'Elektrik Potansiyeli ve Sığa' },
          { name: 'Elektrik Akımı ve Devreler' },
          { name: 'Manyetizma ve Manyetik Alan' },
          { name: 'Elektromanyetik İndüksiyon' },
          { name: 'Alternatif Akım' },
          { name: 'Atom Fiziği ve Radyoaktivite' },
          { name: 'Modern Fizik (Özel Görelilik, Kuantum)' },
        ]
      }
    }
  });

  // --- AYT Kimya (13 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Kimya', examType: 'AYT', totalQuestions: 13, coefficient: 1, displayOrder: 3,
      topics: {
        create: [
          { name: 'Kimyasal Tepkimeler ve Denkleştirme' },
          { name: 'Tepkimelerde Enerji (Enthalpi)' },
          { name: 'Tepkime Hızları' },
          { name: 'Kimyasal Denge' },
          { name: 'Çözeltiler ve Derişim' },
          { name: 'Asit-Baz Dengesi (pH, Hidroliz)' },
          { name: 'Çözünürlük ve Çözünürlük Dengesi' },
          { name: 'Elektrokimya (Pil, Elektroliz)' },
          { name: 'Organik Kimya (Hidrokarbonlar)' },
          { name: 'Fonksiyonel Gruplar' },
          { name: 'Organik Tepkimeler' },
        ]
      }
    }
  });

  // --- AYT Biyoloji (13 soru) ---
  await prisma.subject.create({
    data: {
      name: 'Biyoloji', examType: 'AYT', totalQuestions: 13, coefficient: 1, displayOrder: 4,
      topics: {
        create: [
          { name: 'Nükleik Asitler ve Protein Sentezi' },
          { name: 'Hücre Bölünmeleri (İleri Düzey)' },
          { name: 'Kalıtım (Eş Baskınlık, Çok Alellik, Poligenik)' },
          { name: 'Genetik Mühendisliği ve Biyoteknoloji' },
          { name: 'Canlılarda Enerji Dönüşümleri (Fotosentez)' },
          { name: 'Solunum ve Fermantasyon' },
          { name: 'Bitki Biyolojisi (Yapı, Büyüme, Hareket)' },
          { name: 'Hayvan Dokuları ve Organları' },
          { name: 'İnsan Fizyolojisi (Sindirim Sistemi)' },
          { name: 'Dolaşım ve Solunum Sistemi' },
          { name: 'Boşaltım Sistemi' },
          { name: 'Sinir Sistemi ve Duyu Organları' },
          { name: 'Endokrin Sistem ve Hormonlar' },
          { name: 'Destek ve Hareket Sistemi' },
          { name: 'Üreme Sistemi ve Embriyonik Gelişim' },
          { name: 'Komünite ve Popülasyon Ekolojisi' },
        ]
      }
    }
  });

  console.log('✅ AYT Sayısal dersleri ve konuları oluşturuldu');

  console.log('🎉 Seed işlemi tamamlandı!');
  console.log('📋 Oluşturulan profiller:');
  console.log(`   - ${esma.name} (LGS)`);
  console.log(`   - ${mehmet.name} (TYT/AYT Sayısal)`);
  console.log('📚 Müfredat: LGS, TYT (Sosyal Bilimler dahil) ve AYT dersleri + konuları yüklendi');
  console.log('✨ Deneme verileri boş - kullanıcılar kendi denemelerini girecek');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
