// ============================================
// Analiz API Routes
// GET /api/analytics/monthly-trend?studentId=X   - Aylık net trendi
// GET /api/analytics/weak-topics?studentId=X     - Kırmızı alarm konuları
// GET /api/analytics/subject-progress?studentId=X - Ders bazlı ilerleme
// GET /api/analytics/summary?studentId=X         - Genel özet istatistikler
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// AYLIK NET TREND ANALİZİ
// Önceki aya göre artış/azalış hesaplar
// ============================================
router.get('/monthly-trend', async (req, res) => {
  try {
    const { studentId, examCategory } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId gerekli' });

    const exams = await prisma.exam.findMany({
      where: {
        studentId: parseInt(studentId),
        ...(examCategory ? { examCategory } : {})
      },
      include: {
        results: { include: { subject: true } }
      },
      orderBy: { examDate: 'asc' }
    });

    // Aylık gruplama
    const monthlyData = {};
    exams.forEach(exam => {
      const monthKey = format(new Date(exam.examDate), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          exams: [],
          totalNet: 0,
          count: 0
        };
      }
      monthlyData[monthKey].exams.push(exam);
      monthlyData[monthKey].totalNet += exam.totalNet;
      monthlyData[monthKey].count += 1;
    });

    // Trend hesapla: her ay için ortalama net, değişim, yüzde değişim
    const trend = Object.values(monthlyData).map((m, index, arr) => {
      const avgNet = Math.round((m.totalNet / m.count) * 100) / 100;
      const prevAvgNet = index > 0
        ? Math.round((arr[index - 1].totalNet / arr[index - 1].count) * 100) / 100
        : null;

      const change = prevAvgNet !== null
        ? Math.round((avgNet - prevAvgNet) * 100) / 100
        : null;

      const changePercent = prevAvgNet !== null && prevAvgNet !== 0
        ? Math.round(((avgNet - prevAvgNet) / Math.abs(prevAvgNet)) * 100 * 100) / 100
        : null;

      return {
        month: m.month,
        avgNet,
        examCount: m.count,
        change,
        changePercent,
        bestNet: Math.max(...m.exams.map(e => e.totalNet)),
        worstNet: Math.min(...m.exams.map(e => e.totalNet))
      };
    });

    res.json(trend);
  } catch (error) {
    console.error('Aylık trend hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// KIRMIZI ALARM - ZAYIF KONU TESPİT ALGORİTMASI
//
// Algoritma:
// 1. Son N denemedeki tüm konu bazlı hataları çek
// 2. Her konu için: toplam hata / görülme sayısı = hata oranı
// 3. Hata oranı >= 2.0 → CRITICAL (Kırmızı Alarm - Acil Tekrar)
// 4. Hata oranı >= 1.0 → WARNING (Sarı Alarm - Dikkat)
// 5. Hata oranı < 1.0  → OK (Yeşil - İyi)
// ============================================
router.get('/weak-topics', async (req, res) => {
  try {
    const { studentId, examCount = 5, examCategory } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId gerekli' });

    // Son N denemeyi al
    const recentExams = await prisma.exam.findMany({
      where: {
        studentId: parseInt(studentId),
        ...(examCategory ? { examCategory } : {})
      },
      orderBy: { examDate: 'desc' },
      take: parseInt(examCount),
      select: { id: true }
    });

    const examIds = recentExams.map(e => e.id);

    if (examIds.length === 0) {
      return res.json([]);
    }

    // Bu denemelerdeki tüm konu analizlerini al
    const analyses = await prisma.questionAnalysis.findMany({
      where: {
        examResult: {
          examId: { in: examIds }
        }
      },
      include: {
        topic: {
          include: { subject: true }
        },
        examResult: true
      }
    });

    // Konu bazlı hata toplaması
    const topicErrors = {};
    analyses.forEach(a => {
      const key = a.topicId;
      if (!topicErrors[key]) {
        topicErrors[key] = {
          topicId: a.topicId,
          topicName: a.topic.name,
          subjectName: a.topic.subject.name,
          subjectId: a.topic.subject.id,
          totalWrong: 0,
          totalBlank: 0,
          appearances: 0
        };
      }
      topicErrors[key].totalWrong += a.wrongCount;
      topicErrors[key].totalBlank += a.blankCount;
      topicErrors[key].appearances += 1;
    });

    // Hata oranı ve alarm seviyesi belirle
    const weakTopics = Object.values(topicErrors)
      .map(t => {
        const totalErrors = t.totalWrong + t.totalBlank;
        const errorRate = totalErrors / t.appearances;

        let status;
        if (errorRate >= 2.0) {
          status = 'CRITICAL'; // 🔴 Kırmızı Alarm - Acil tekrar edilmeli
        } else if (errorRate >= 1.0) {
          status = 'WARNING';  // 🟡 Sarı Alarm - Dikkat edilmeli
        } else {
          status = 'OK';       // 🟢 Yeşil - İyi durumda
        }

        return {
          ...t,
          totalErrors,
          errorRate: Math.round(errorRate * 100) / 100,
          status
        };
      })
      .filter(t => t.status !== 'OK')
      .sort((a, b) => b.errorRate - a.errorRate);

    res.json(weakTopics);
  } catch (error) {
    console.error('Zayıf konu tespiti hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DERS BAZLI İLERLEME
// Her ders için ortalama net, son performans, değişim
// ============================================
router.get('/subject-progress', async (req, res) => {
  try {
    const { studentId, examCategory } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId gerekli' });

    const results = await prisma.examResult.findMany({
      where: {
        exam: {
          studentId: parseInt(studentId),
          ...(examCategory ? { examCategory } : {})
        }
      },
      include: {
        subject: true,
        exam: { select: { examDate: true, examName: true } }
      },
      orderBy: {
        exam: { examDate: 'asc' }
      }
    });

    // Ders bazlı gruplama
    const subjectData = {};
    results.forEach(r => {
      if (!subjectData[r.subjectId]) {
        subjectData[r.subjectId] = {
          subjectId: r.subjectId,
          subjectName: r.subject.name,
          totalQuestions: r.subject.totalQuestions,
          results: []
        };
      }
      subjectData[r.subjectId].results.push({
        examDate: r.exam.examDate,
        examName: r.exam.examName,
        netScore: r.netScore,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        blankCount: r.blankCount
      });
    });

    // Ortalama, son, önceki net ve değişim hesapla
    const progress = Object.values(subjectData).map(s => {
      const nets = s.results.map(r => r.netScore);
      const avgNet = Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100;
      const lastNet = nets[nets.length - 1];
      const prevNet = nets.length > 1 ? nets[nets.length - 2] : null;

      return {
        ...s,
        avgNet,
        lastNet,
        prevNet,
        change: prevNet !== null ? Math.round((lastNet - prevNet) * 100) / 100 : null,
        bestNet: Math.max(...nets),
        worstNet: Math.min(...nets)
      };
    });

    res.json(progress);
  } catch (error) {
    console.error('Ders ilerleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GENEL ÖZET İSTATİSTİKLER
// Toplam deneme, son net, en iyi net, ortalama net
// ============================================
router.get('/summary', async (req, res) => {
  try {
    const { studentId, examCategory } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId gerekli' });

    const exams = await prisma.exam.findMany({
      where: {
        studentId: parseInt(studentId),
        ...(examCategory ? { examCategory } : {})
      },
      orderBy: { examDate: 'desc' }
    });

    if (exams.length === 0) {
      return res.json({
        totalExams: 0,
        lastNet: null,
        bestNet: null,
        worstNet: null,
        avgNet: null,
        trend: null
      });
    }

    const nets = exams.map(e => e.totalNet);
    const avgNet = Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100;

    // Son iki deneme arasındaki fark
    const trend = exams.length >= 2
      ? Math.round((exams[0].totalNet - exams[1].totalNet) * 100) / 100
      : null;

    res.json({
      totalExams: exams.length,
      lastNet: exams[0].totalNet,
      lastExamName: exams[0].examName,
      lastExamDate: exams[0].examDate,
      bestNet: Math.max(...nets),
      worstNet: Math.min(...nets),
      avgNet,
      trend
    });
  } catch (error) {
    console.error('Özet istatistik hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
