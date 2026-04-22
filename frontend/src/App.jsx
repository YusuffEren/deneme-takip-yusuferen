import { Routes, Route } from 'react-router-dom';
import StudentSelect from './pages/StudentSelect';
import Dashboard from './pages/Dashboard';
import ExamEntry from './pages/ExamEntry';
import ExamDetail from './pages/ExamDetail';
import DailyEntry from './pages/DailyEntry';
import WeeklyReport from './pages/WeeklyReport';
import GoalsPage from './pages/GoalsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentSelect />} />
      <Route path="/dashboard/:studentId" element={<Dashboard />} />
      <Route path="/exam/new/:studentId" element={<ExamEntry />} />
      <Route path="/exam/:examId" element={<ExamDetail />} />
      <Route path="/daily/:studentId" element={<DailyEntry />} />
      <Route path="/report/:studentId" element={<WeeklyReport />} />
      <Route path="/goals/:studentId" element={<GoalsPage />} />
    </Routes>
  );
}
