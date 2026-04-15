// ============================================
// Deneme Sınavı API Routes
// GET    /api/exams?studentId=X - Öğrencinin denemeleri
// GET    /api/exams/:id         - Deneme detayı
// POST   /api/exams             - Yeni deneme kaydet
// DELETE /api/exams/:id         - Deneme sil
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Öğrencinin tüm denemelerini getir
router.get('/', async (req, res) => {
  try {
    const { studentId, examCategory } = req.query;

    const whereClause = {};
    if (studentId) whereClause.studentId = parseInt(studentId);
    if (examCategory) whereClause.examCategory = examCategory;

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        results: {
          include: { subject: true }
        },
        student: true
      },
      orderBy: { examDate: 'desc' }
    });

    res.json(exams);
  } catch (error) {
    console.error('Deneme listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tekil deneme detayı (konu analizi dahil)
router.get('/:id', async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        student: true,
        results: {
          include: {
            subject: true,
            analyses: {
              include: { topic: true }
            }
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Deneme bulunamadı' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Deneme detay hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// YENİ DENEME KAYDET
// Hızlı veri girişi: Öğrenci yanlış/boş girer, doğru + net otomatik hesaplanır
// ============================================
router.post('/', async (req, res) => {
  try {
    const { studentId, examName, examCategory, examDate, results } = req.body;

    // Validasyon
    if (!studentId || !examName || !examCategory || !examDate || !results || !results.length) {
      return res.status(400).json({
        error: 'studentId, examName, examCategory, examDate ve results zorunludur'
      });
    }

    // Öğrenci bilgisini al (net hesaplama formülü için)
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }

    // Net hesaplama formülü:
    // LGS: 4 seçenekli sorular → Net = Doğru - (Yanlış / 3)
    // TYT/AYT: 5 seçenekli sorular → Net = Doğru - (Yanlış / 4)
    const penaltyDivisor = student.examType === 'LGS' ? 3 : 4;

    // Her ders sonucu için doğru sayısı ve net hesapla
    const processedResults = results.map(r => {
      const correctCount = r.totalQuestions - r.wrongCount - r.blankCount;
      const netScore = correctCount - (r.wrongCount / penaltyDivisor);

      return {
        ...r,
        correctCount: Math.max(0, correctCount),
        netScore: Math.round(Math.max(0, netScore) * 100) / 100
      };
    });

    // Toplam net
    const totalNet = processedResults.reduce((sum, r) => sum + r.netScore, 0);

    // Transaction ile deneme + sonuçlar + konu analizlerini kaydet
    const exam = await prisma.exam.create({
      data: {
        studentId,
        examName,
        examCategory,
        examDate: new Date(examDate),
        totalNet: Math.round(totalNet * 100) / 100,
        results: {
          create: processedResults.map(r => ({
            subjectId: r.subjectId,
            totalQuestions: r.totalQuestions,
            wrongCount: r.wrongCount,
            blankCount: r.blankCount,
            correctCount: r.correctCount,
            netScore: r.netScore,
            // Konu bazlı analiz (opsiyonel - varsa kaydet)
            analyses: r.topicAnalyses && r.topicAnalyses.length > 0
              ? {
                  create: r.topicAnalyses.map(a => ({
                    topicId: a.topicId,
                    wrongCount: a.wrongCount || 0,
                    blankCount: a.blankCount || 0
                  }))
                }
              : undefined
          }))
        }
      },
      include: {
        results: {
          include: {
            subject: true,
            analyses: { include: { topic: true } }
          }
        }
      }
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error('Deneme kayıt hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deneme sil
router.delete('/:id', async (req, res) => {
  try {
    const examId = parseInt(req.params.id);

    // Deneme var mı kontrol
    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existing) {
      return res.status(404).json({ error: 'Deneme bulunamadı' });
    }

    await prisma.exam.delete({ where: { id: examId } });
    res.json({ message: 'Deneme başarıyla silindi' });
  } catch (error) {
    console.error('Deneme silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
