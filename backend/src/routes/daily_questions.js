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

    const records = await prisma.dailyQuestion.findMany({
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
    const { studentId, subjectId, topicName, date, solvedCount, correctCount, wrongCount } = req.body;

    const existing = await prisma.dailyQuestion.findFirst({
      where: { studentId, subjectId, topicName: topicName || null, date: new Date(date) }
    });

    if (existing) {
      const updated = await prisma.dailyQuestion.update({
        where: { id: existing.id },
        data: { solvedCount, correctCount, wrongCount }
      });
      return res.json(updated);
    }

    const record = await prisma.dailyQuestion.create({
      data: { studentId, subjectId, topicName, date: new Date(date), solvedCount, correctCount, wrongCount }
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
      const { subjectId, topicName, solvedCount, correctCount, wrongCount } = entry;
      if (!solvedCount && !correctCount && !wrongCount) continue;

      const existing = await prisma.dailyQuestion.findFirst({
        where: { studentId, subjectId, topicName: topicName || null, date: new Date(date) }
      });

      if (existing) {
        await prisma.dailyQuestion.update({
          where: { id: existing.id },
          data: { solvedCount, correctCount, wrongCount }
        });
        results.push(existing.id);
      } else {
        const created = await prisma.dailyQuestion.create({
          data: { studentId, subjectId, topicName, date: new Date(date), solvedCount, correctCount, wrongCount }
        });
        results.push(created.id);
      }
    }

    res.json({ count: results.length, message: `${results.length} kayıt oluşturuldu` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await prisma.dailyQuestion.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    await prisma.dailyQuestion.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Kayıt silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
