import axios from 'axios';

// Axios instance - Vite proxy üzerinden backend'e bağlanır
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// API Fonksiyonları
// ============================================

// --- Öğrenciler ---
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);

// --- Müfredat ---
export const getCurriculum = (examType) => api.get(`/curriculum/${examType}`);

// --- Denemeler ---
export const getExams = (studentId, category) => api.get(`/exams?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);
export const getExam = (id) => api.get(`/exams/${id}`);
export const createExam = (data) => api.post('/exams', data);
export const deleteExam = (id) => api.delete(`/exams/${id}`);

// --- Analiz ---
export const getMonthlyTrend = (studentId, category) => api.get(`/analytics/monthly-trend?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);
export const getWeakTopics = (studentId, category) => api.get(`/analytics/weak-topics?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);
export const getSubjectProgress = (studentId, category) => api.get(`/analytics/subject-progress?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);
export const getSummary = (studentId, category) => api.get(`/analytics/summary?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export default api;
