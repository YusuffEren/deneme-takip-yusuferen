// ============================================
// DailyEntry - Günlük Soru Çözüm & Çalışma Süresi Kayıt Sayfası
// Ders bazlı soru sayısı, doğru/yanlış ve çalışma süresi girişi
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import {
  getStudent, getCurriculum,
  createDailyQuestionsBatch, createStudySessionsBatch,
  getDailyQuestions, getStudySessions
} from '../api/client';

export default function DailyEntry() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'study'

  // Soru formu: { [subjectId]: { solved, correct, wrong } }
  const [questionData, setQuestionData] = useState({});
  // Süre formu: { [subjectId]: { minutes, notes } }
  const [studyData, setStudyData] = useState({});
  // Bugünkü kayıtlı veriler
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);

  useEffect(() => {
    Promise.all([getStudent(studentId)])
      .then(async ([studentRes]) => {
        const s = studentRes.data;
        setStudent(s);

        let allSubjects = [];
        if (s.examType === 'TYT') {
          const [tytRes, aytRes] = await Promise.all([
            getCurriculum('TYT'),
            getCurriculum('AYT'),
          ]);
          allSubjects = [...tytRes.data, ...aytRes.data];
        } else {
          const currRes = await getCurriculum(s.examType);
          allSubjects = currRes.data;
        }
        setSubjects(allSubjects);

        // Boş form oluştur
        const qDefaults = {};
        const sDefaults = {};
        allSubjects.forEach(sub => {
          qDefaults[sub.id] = { solved: 0, correct: 0, wrong: 0 };
          sDefaults[sub.id] = { minutes: 0, notes: '' };
        });
        setQuestionData(qDefaults);
        setStudyData(sDefaults);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  // Seçilen tarihteki mevcut kayıtları yükle
  useEffect(() => {
    if (!studentId || !selectedDate) return;
    Promise.all([
      getDailyQuestions(studentId, selectedDate, selectedDate),
      getStudySessions(studentId, selectedDate, selectedDate),
    ]).then(([qRes, sRes]) => {
      setSavedQuestions(qRes.data);
      setSavedSessions(sRes.data);
    }).catch(console.error);
  }, [studentId, selectedDate]);

  const updateQuestion = (subjectId, field, value) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setQuestionData(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], [field]: numVal }
    }));
  };

  const updateStudy = (subjectId, field, value) => {
    if (field === 'minutes') {
      const numVal = Math.max(0, parseInt(value) || 0);
      setStudyData(prev => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], [field]: numVal }
      }));
    } else {
      setStudyData(prev => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], [field]: value }
      }));
    }
  };

  const totalSolved = useMemo(() =>
    Object.values(questionData).reduce((sum, q) => sum + (q.solved || 0), 0), [questionData]);
  const totalCorrect = useMemo(() =>
    Object.values(questionData).reduce((sum, q) => sum + (q.correct || 0), 0), [questionData]);
  const totalMinutes = useMemo(() =>
    Object.values(studyData).reduce((sum, s) => sum + (s.minutes || 0), 0), [studyData]);

  const handleSaveQuestions = async () => {
    setSubmitting(true);
    try {
      const entries = Object.entries(questionData)
        .filter(([_, q]) => q.solved > 0 || q.correct > 0 || q.wrong > 0)
        .map(([subjectId, q]) => ({
          subjectId: parseInt(subjectId),
          solvedCount: q.solved,
          correctCount: q.correct,
          wrongCount: q.wrong,
        }));

      if (entries.length === 0) {
        toast.error('En az bir ders için soru bilgisi girin');
        return;
      }

      await createDailyQuestionsBatch({
        studentId: parseInt(studentId),
        date: selectedDate,
        entries,
      });

      toast.success(`${entries.length} ders için soru kaydedildi! 📝`);

      // Kayıtlı verileri yeniden yükle
      const qRes = await getDailyQuestions(studentId, selectedDate, selectedDate);
      setSavedQuestions(qRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStudy = async () => {
    setSubmitting(true);
    try {
      const entries = Object.entries(studyData)
        .filter(([_, s]) => s.minutes > 0)
        .map(([subjectId, s]) => ({
          subjectId: parseInt(subjectId),
          durationMinutes: s.minutes,
          notes: s.notes || null,
        }));

      if (entries.length === 0) {
        toast.error('En az bir ders için çalışma süresi girin');
        return;
      }

      await createStudySessionsBatch({
        studentId: parseInt(studentId),
        date: selectedDate,
        entries,
      });

      toast.success(`${entries.length} ders için çalışma süresi kaydedildi! ⏱️`);

      // Kayıtlı verileri yeniden yükle
      const sRes = await getStudySessions(studentId, selectedDate, selectedDate);
      setSavedSessions(sRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout studentId={studentId}>
      {/* Başlık */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">📝 Günlük Kayıt</h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
          Günlük soru çözüm ve çalışma sürelerini kaydet
        </p>
      </div>

      {/* Tarih seçici + Özet kartlar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">📅 Tarih</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Toplam Soru</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalSolved}</p>
          <p className="text-xs text-emerald-500 mt-1">✓ {totalCorrect} doğru</p>
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Başarı Oranı</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {totalSolved > 0 ? Math.round(totalCorrect / totalSolved * 100) : 0}%
          </p>
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Toplam Çalışma</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {Math.floor(totalMinutes / 60)}s {totalMinutes % 60}dk
          </p>
        </div>
      </div>

      {/* Tab seçici */}
      <div className="flex bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl p-1 mb-6 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'questions' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          📚 Soru Takibi
        </button>
        <button
          onClick={() => setActiveTab('study')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'study' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          ⏱️ Süre Takibi
        </button>
      </div>

      {/* SORU TAKİBİ */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          {/* Mevcut kayıtlar */}
          {savedQuestions.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Bu Tarihteki Kayıtlar
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {savedQuestions.map(q => (
                  <div key={q.id} className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-2 text-xs">
                    <p className="font-medium text-slate-800 dark:text-white truncate">{q.subject?.name}</p>
                    <div className="flex gap-2 mt-1 text-slate-600 dark:text-slate-400">
                      <span>{q.solvedCount} çözüm</span>
                      <span className="text-emerald-600 dark:text-emerald-400">✓{q.correctCount}</span>
                      <span className="text-rose-600 dark:text-rose-400">✗{q.wrongCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ders listesi - soru girişi */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">📚 Ders Bazlı Soru Girişi</h2>
              <p className="text-xs text-slate-500 mt-1">Her ders için çözülen soru, doğru ve yanlış sayısını girin</p>
            </div>

            {/* Tablo başlıkları */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 bg-slate-50 dark:bg-white/[0.02] text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
              <span>Ders</span>
              <span className="text-center">Çözülen</span>
              <span className="text-center">Doğru</span>
              <span className="text-center">Yanlış</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {subjects.map(subject => {
                const q = questionData[subject.id] || { solved: 0, correct: 0, wrong: 0 };
                return (
                  <div key={subject.id} className="grid grid-cols-2 sm:grid-cols-[1fr_80px_80px_80px] gap-2 p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors items-center">
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-500 dark:text-indigo-400 flex-shrink-0">
                        {subject.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{subject.name}</p>
                        <p className="text-[10px] text-slate-500">{subject.examType}</p>
                      </div>
                    </div>

                    <div>
                      <label className="sm:hidden block text-[10px] text-slate-500 mb-1">Çözülen</label>
                      <input
                        type="number" min="0" value={q.solved || ''}
                        onChange={e => updateQuestion(subject.id, 'solved', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="sm:hidden block text-[10px] text-emerald-500 mb-1">Doğru</label>
                      <input
                        type="number" min="0" value={q.correct || ''}
                        onChange={e => updateQuestion(subject.id, 'correct', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="sm:hidden block text-[10px] text-rose-500 mb-1">Yanlış</label>
                      <input
                        type="number" min="0" value={q.wrong || ''}
                        onChange={e => updateQuestion(subject.id, 'wrong', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveQuestions}
              disabled={submitting || totalSolved === 0}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <>💾 Soruları Kaydet</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SÜRE TAKİBİ */}
      {activeTab === 'study' && (
        <div className="space-y-3">
          {/* Mevcut kayıtlar */}
          {savedSessions.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                Bu Tarihteki Kayıtlar
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {savedSessions.map(s => (
                  <div key={s.id} className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-lg p-2 text-xs">
                    <p className="font-medium text-slate-800 dark:text-white truncate">{s.subject?.name}</p>
                    <p className="text-purple-600 dark:text-purple-400 mt-1">
                      {Math.floor(s.durationMinutes / 60) > 0 && `${Math.floor(s.durationMinutes / 60)}s `}{s.durationMinutes % 60}dk
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ders listesi - süre girişi */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">⏱️ Ders Bazlı Çalışma Süresi</h2>
              <p className="text-xs text-slate-500 mt-1">Her ders için çalışma süresini dakika cinsinden girin</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {subjects.map(subject => {
                const s = studyData[subject.id] || { minutes: 0, notes: '' };
                return (
                  <div key={subject.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1fr] gap-3 p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-500 dark:text-purple-400 flex-shrink-0">
                        {subject.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{subject.name}</p>
                        <p className="text-[10px] text-slate-500">{subject.examType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" value={s.minutes || ''}
                        onChange={e => updateStudy(subject.id, 'minutes', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                      <span className="text-xs text-slate-500 whitespace-nowrap">dk</span>
                    </div>

                    <input
                      type="text"
                      value={s.notes}
                      onChange={e => updateStudy(subject.id, 'notes', e.target.value)}
                      placeholder="Not (opsiyonel)"
                      className="px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveStudy}
              disabled={submitting || totalMinutes === 0}
              className="btn-primary bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <>⏱️ Süreleri Kaydet</>
              )}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
