import { Routes, Route } from 'react-router-dom';
import StudentSelect from './pages/StudentSelect';
import Dashboard from './pages/Dashboard';
import ExamEntry from './pages/ExamEntry';
import ExamDetail from './pages/ExamDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentSelect />} />
      <Route path="/dashboard/:studentId" element={<Dashboard />} />
      <Route path="/exam/new/:studentId" element={<ExamEntry />} />
      <Route path="/exam/:examId" element={<ExamDetail />} />
    </Routes>
  );
}
