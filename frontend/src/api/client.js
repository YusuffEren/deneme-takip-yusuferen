import axios from 'axios';

// API URL - production'da environment variable, development'ta proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Öğrenciler
// ============================================
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);

// ============================================
// Müfredat
// ============================================
export const getCurriculum = (examType) => api.get(`/curriculum/${examType}`);

// ============================================
// Denemeler
// ============================================
export const getExams = (studentId, category) =>
  api.get(`/exams?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);
export const getExam = (id) => api.get(`/exams/${id}`);
export const createExam = (data) => api.post('/exams', data);
export const deleteExam = (id) => api.delete(`/exams/${id}`);

// ============================================
// Günlük Soru Takibi
// ============================================
export const getDailyQuestions = (studentId, startDate, endDate, subjectId) => {
  let url = `/daily-questions?studentId=${studentId}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  if (subjectId) url += `&subjectId=${subjectId}`;
  return api.get(url);
};
export const createDailyQuestion = (data) => api.post('/daily-questions', data);
export const createDailyQuestionsBatch = (data) => api.post('/daily-questions/batch', data);
export const deleteDailyQuestion = (id) => api.delete(`/daily-questions/${id}`);

// ============================================
// Çalışma Süresi Takibi
// ============================================
export const getStudySessions = (studentId, startDate, endDate, subjectId) => {
  let url = `/study-sessions?studentId=${studentId}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  if (subjectId) url += `&subjectId=${subjectId}`;
  return api.get(url);
};
export const createStudySession = (data) => api.post('/study-sessions', data);
export const createStudySessionsBatch = (data) => api.post('/study-sessions/batch', data);
export const deleteStudySession = (id) => api.delete(`/study-sessions/${id}`);

// ============================================
// Hedef Yönetimi
// ============================================
export const getGoals = (studentId, goalType) => {
  let url = `/goals?studentId=${studentId}`;
  if (goalType) url += `&goalType=${goalType}`;
  return api.get(url);
};
export const createGoal = (data) => api.post('/goals', data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// ============================================
// Analiz & Raporlama
// ============================================
export const getSummary = (studentId, category) =>
  api.get(`/analytics/summary?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export const getMonthlyTrend = (studentId, category) =>
  api.get(`/analytics/monthly-trend?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export const getSubjectProgress = (studentId, category) =>
  api.get(`/analytics/subject-progress?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export const getWeakTopics = (studentId, category) =>
  api.get(`/analytics/weak-topics?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export const getRedAlerts = (studentId, category) =>
  api.get(`/analytics/red-alerts?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export const getWeeklyReport = (studentId, weekOffset = 0) =>
  api.get(`/analytics/weekly-report?studentId=${studentId}&weekOffset=${weekOffset}`);

export const getCorrelation = (studentId, category) =>
  api.get(`/analytics/correlation?studentId=${studentId}${category ? `&examCategory=${category}` : ''}`);

export default api;
