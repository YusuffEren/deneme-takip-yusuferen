// ============================================
// Deneme Sınavı Takip - Express Server
// Ana giriş noktası
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studentsRouter from './routes/students.js';
import curriculumRouter from './routes/curriculum.js';
import examsRouter from './routes/exams.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/exams', examsRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server hatası:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});
