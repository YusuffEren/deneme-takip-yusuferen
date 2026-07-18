import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { studentId, startDate, endDate, subjectId } = req.query;
    const where = { studentId: parseInt(studentId) };
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (subjectId) where.subjectId = parseInt(subjectId);

    const records = await prisma.studySession.findMany({
      where,
      include: { subject: { select: { id: true, name: true, examType: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, subjectId, date, durationMinutes, notes } = req.body;
    const record = await prisma.studySession.create({
      data: { studentId, subjectId, date: new Date(date), durationMinutes, notes }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { studentId, date, entries } = req.body;
    const results = [];

    for (const entry of entries) {
      const { subjectId, durationMinutes, notes } = entry;
      if (!durationMinutes || durationMinutes <= 0) continue;

      const created = await prisma.studySession.create({
        data: { studentId, subjectId, date: new Date(date), durationMinutes, notes }
      });
      results.push(created.id);
    }

    res.json({ count: results.length, message: `${results.length} kayıt oluşturuldu` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await prisma.studySession.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    await prisma.studySession.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Kayıt silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
