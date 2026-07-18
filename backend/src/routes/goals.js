import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { studentId, goalType } = req.query;
    const where = { studentId: parseInt(studentId), isActive: true };
    if (goalType) where.goalType = goalType;

    const goals = await prisma.goal.findMany({
      where,
      include: { subject: { select: { id: true, name: true, examType: true } } }
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, goalType, metricType, targetValue, subjectId } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { studentId, goalType, metricType, subjectId: subjectId || null }
    });

    if (existing) {
      const updated = await prisma.goal.update({
        where: { id: existing.id },
        data: { targetValue, isActive: true }
      });
      return res.json(updated);
    }

    const goal = await prisma.goal.create({
      data: { studentId, goalType, metricType, targetValue, subjectId: subjectId || null }
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!goal) return res.status(404).json({ error: 'Hedef bulunamadı' });
    await prisma.goal.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.json({ message: 'Hedef devre dışı bırakıldı' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
