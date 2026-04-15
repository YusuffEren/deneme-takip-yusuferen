// ============================================
// Öğrenci API Routes
// GET /api/students - Tüm öğrenciler
// GET /api/students/:id - Öğrenci detayı
// POST /api/students - Yeni öğrenci
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Tüm öğrencileri getir (son deneme bilgisi ile)
router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        exams: {
          orderBy: { examDate: 'desc' },
          take: 1,
          select: { totalNet: true, examDate: true, examName: true }
        },
        _count: { select: { exams: true } }
      }
    });
    res.json(students);
  } catch (error) {
    console.error('Öğrenci listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Öğrenci detayı (tüm denemeleri ile)
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        exams: {
          orderBy: { examDate: 'desc' },
          include: {
            results: {
              include: { subject: true }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }

    res.json(student);
  } catch (error) {
    console.error('Öğrenci detay hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni öğrenci ekle
router.post('/', async (req, res) => {
  try {
    const { name, examType, avatar } = req.body;

    if (!name || !examType) {
      return res.status(400).json({ error: 'İsim ve sınav türü zorunludur' });
    }

    const student = await prisma.student.create({
      data: {
        name,
        examType,
        avatar: avatar || '📚'
      }
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Öğrenci oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
