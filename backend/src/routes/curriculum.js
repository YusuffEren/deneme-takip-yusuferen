// ============================================
// Müfredat (Curriculum) API Routes
// GET /api/curriculum/:examType - Sınav türüne göre dersler + konular
// GET /api/curriculum/subjects/:subjectId/topics - Ders konuları
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Sınav türüne göre tüm dersleri ve konularını getir
// examType: LGS | TYT | AYT
router.get('/:examType', async (req, res) => {
  try {
    const { examType } = req.params;

    const subjects = await prisma.subject.findMany({
      where: { examType: examType.toUpperCase() },
      include: {
        topics: { orderBy: { id: 'asc' } }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json(subjects);
  } catch (error) {
    console.error('Müfredat hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Belirli bir dersin konularını getir
router.get('/subjects/:subjectId/topics', async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      where: { subjectId: parseInt(req.params.subjectId) },
      orderBy: { id: 'asc' }
    });

    res.json(topics);
  } catch (error) {
    console.error('Konu listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
