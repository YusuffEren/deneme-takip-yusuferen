// ============================================
// ExamEntry - Hızlı Deneme Sonucu Giriş Sayfası
// Adım 1: Deneme bilgileri
// Adım 2: Ders bazlı yanlış/boş (doğru ve net otomatik)
// Adım 3: Konu bazlı hata analizi (opsiyonel)
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getCurriculum, getStudent, createExam } from '../api/client';

export default function ExamEntry() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [examCategory, setExamCategory] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectResults, setSubjectResults] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [topicAnalyses, setTopicAnalyses] = useState({});

  // Öğrenci ve müfredat verilerini yükle
  useEffect(() => {
    Promise.all([
      getStudent(studentId),
    ]).then(async ([studentRes]) => {
      const s = studentRes.data;
      setStudent(s);

      let allSubjects = [];
      if (s.examType === 'TYT') {
        const [tytRes, aytRes] = await Promise.all([
          getCurriculum('TYT'),
          getCurriculum('AYT'),
        ]);
        allSubjects = [...tytRes.data, ...aytRes.data];
        setExamCategory('TYT');
      } else {
        const currRes = await getCurriculum(s.examType);
        allSubjects = currRes.data;
        setExamCategory('LGS');
      }

      setSubjects(allSubjects);

      const defaults = {};
      allSubjects.forEach(sub => {
        defaults[sub.id] = {
          subjectId: sub.id,
          totalQuestions: sub.totalQuestions,
          wrongCount: 0,
          blankCount: 0,
        };
      });
      setSubjectResults(defaults);
    })
      .catch(err => {
        console.error('Veri yükleme hatası:', err);
        toast.error('Veriler yüklenirken hata oluştu');
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const updateSubjectResult = (subjectId, field, value) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setSubjectResults(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], [field]: numVal }
    }));
  };

  const updateTopicAnalysis = (subjectId, topicId, field, value) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setTopicAnalyses(prev => {
      const subjectAnalyses = { ...(prev[subjectId] || {}) };
      subjectAnalyses[topicId] = {
        ...(subjectAnalyses[topicId] || { topicId, wrongCount: 0, blankCount: 0 }),
        [field]: numVal
      };
      return { ...prev, [subjectId]: subjectAnalyses };
    });
  };

  const penaltyDivisor = student?.examType === 'LGS' ? 3 : 4;

  const calculateNet = (result) => {
    const correct = result.totalQuestions - result.wrongCount - result.blankCount;
    const net = correct - (result.wrongCount / penaltyDivisor);
    return { correct: Math.max(0, correct), net: Math.max(0, net) };
  };

  const totalNet = useMemo(() => {
    return Object.values(subjectResults).reduce((sum, r) => {
      const subject = subjects.find(s => s.id === r.subjectId);
      if (subject && subject.examType === examCategory) {
        return sum + calculateNet(r).net;
      }
      return sum;
    }, 0);
  }, [subjectResults, penaltyDivisor, examCategory, subjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!examName.trim()) {
      toast.error('Lütfen deneme adını girin');
      return;
    }

    setSubmitting(true);

    try {
      const activeResults = Object.values(subjectResults)
        .filter(r => {
          const subject = subjects.find(s => s.id === r.subjectId);
          return subject && subject.examType === examCategory;
        })
        .map(r => {
          const analyses = topicAnalyses[r.subjectId]
            ? Object.values(topicAnalyses[r.subjectId]).filter(a => a.wrongCount > 0 || a.blankCount > 0)
            : [];

          return {
            subjectId: r.subjectId,
            totalQuestions: r.totalQuestions,
            wrongCount: r.wrongCount,
            blankCount: r.blankCount,
            topicAnalyses: analyses,
          };
        });

      await createExam({
        studentId: parseInt(studentId),
        examCategory,
        examName: examName.trim(),
        examDate,
        results: activeResults,
      });

      toast.success('Deneme başarıyla kaydedildi! 🎉');
      navigate(`/dashboard/${studentId}`);
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error('Kayıt sırasında bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const filteredSubjects = subjects.filter(s => s.examType === examCategory);
  const subjectGroups = [{
    title: `${examCategory} Dersleri`,
    subtitle: examCategory === 'TYT' ? '120 Soru' : examCategory === 'AYT' ? '80 Soru' : '90 Soru',
    subjects: filteredSubjects
  }];

  return (
    <Layout studentId={studentId}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Yeni Deneme Ekle</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Yanlış ve boş sayılarını gir, net otomatik hesaplansın</p>
        </div>

        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">📋 Deneme Bilgileri</h2>
            
            {student?.examType === 'TYT' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 dark:text-slate-400">Sınav Türü:</label>
                <div className="flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setExamCategory('TYT')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${examCategory === 'TYT' ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    TYT Senaryosu
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamCategory('AYT')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${examCategory === 'AYT' ? 'bg-purple-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    AYT Senaryosu
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Deneme Adı</label>
              <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="Örn: Bilgi Sarmal Deneme 3" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Sınav Tarihi</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="input-field" required />
            </div>
          </div>
        </div>

        <div className="sticky top-14 md:top-0 z-20 mb-6">
          <div className="glass-card p-3 sm:p-4 flex items-center justify-between border-indigo-500/20">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-xl sm:text-2xl">🎯</span>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Toplam Net</p>
                <p className="text-2xl sm:text-3xl font-black gradient-text">{totalNet.toFixed(1)}</p>
              </div>
            </div>
            <button type="submit" disabled={submitting || !examName.trim()} className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Kaydediliyor...</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">💾 Kaydet</span>
                  <span className="sm:hidden">💾</span>
                </>
              )}
            </button>
          </div>
        </div>

        {subjectGroups.map((group) => (
          <div key={group.title} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{group.title}</h2>
              <span className="text-sm text-slate-500">({group.subtitle})</span>
            </div>

            <div className="space-y-3">
              {group.subjects.map((subject) => {
                const result = subjectResults[subject.id] || { totalQuestions: subject.totalQuestions, wrongCount: 0, blankCount: 0 };
                const { correct, net } = calculateNet(result);
                const isExpanded = expandedSubject === subject.id;
                const hasErrors = result.wrongCount > 0 || result.blankCount > 0;

                return (
                  <div key={subject.id} className="glass-card overflow-hidden">
                    <div className="p-4">
                      {/* Ders başlığı ve soru sayısı */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-500 dark:text-indigo-400 flex-shrink-0">
                            {subject.totalQuestions}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{subject.name}</p>
                            <p className="text-xs text-slate-500">{subject.examType}</p>
                          </div>
                        </div>
                        
                        {/* Konu analizi butonu - mobilde üstte */}
                        {hasErrors && subject.topics?.length > 0 && (
                          <button type="button" onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isExpanded ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                            {isExpanded ? '▲ Kapat' : '▼ Konu'}
                          </button>
                        )}
                      </div>

                      {/* Input alanları - 4 sütun grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-rose-500 dark:text-rose-400 mb-1 font-medium text-center">YANLIŞ</label>
                          <input type="number" min="0" max={subject.totalQuestions} value={result.wrongCount || ''} onChange={e => updateSubjectResult(subject.id, 'wrongCount', e.target.value)} placeholder="0"
                            className="w-full px-2 py-2 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-rose-500/50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-amber-500 dark:text-amber-400 mb-1 font-medium text-center">BOŞ</label>
                          <input type="number" min="0" max={subject.totalQuestions} value={result.blankCount || ''} onChange={e => updateSubjectResult(subject.id, 'blankCount', e.target.value)} placeholder="0"
                            className="w-full px-2 py-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg text-slate-900 dark:text-white text-center font-bold text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-emerald-500 dark:text-emerald-400 mb-1 font-medium text-center">DOĞRU</label>
                          <div className="px-2 py-2 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-center font-bold text-sm">
                            {correct}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-indigo-500 dark:text-indigo-400 mb-1 font-medium text-center">NET</label>
                          <div className="px-2 py-2 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400 text-center font-bold text-sm">
                            {net.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && subject.topics && (
                      <div className="border-t border-slate-200 dark:border-white/5 p-4 bg-slate-50 dark:bg-white/[0.01]">
                        <p className="text-xs text-slate-500 mb-3">Hangi konulardan yanlış/boş yaptığını belirt (opsiyonel):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subject.topics.map(topic => {
                            const analysis = topicAnalyses[subject.id]?.[topic.id] || { wrongCount: 0, blankCount: 0 };
                            return (
                              <div key={topic.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                                <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate" title={topic.name}>{topic.name}</span>
                                <input type="number" min="0" max="10" value={analysis.wrongCount || ''} onChange={e => updateTopicAnalysis(subject.id, topic.id, 'wrongCount', e.target.value)} placeholder="Y"
                                  className="w-12 px-2 py-1 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded text-slate-900 dark:text-white text-center text-xs focus:outline-none focus:border-rose-500/50" />
                                <input type="number" min="0" max="10" value={analysis.blankCount || ''} onChange={e => updateTopicAnalysis(subject.id, topic.id, 'blankCount', e.target.value)} placeholder="B"
                                  className="w-12 px-2 py-1 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded text-slate-900 dark:text-white text-center text-xs focus:outline-none focus:border-amber-500/50" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button type="button" onClick={() => navigate(`/dashboard/${studentId}`)} className="btn-secondary order-2 sm:order-1">
              ← İptal
            </button>
            <div className="flex items-center justify-between sm:justify-end gap-4 order-1 sm:order-2">
              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Toplam Net</p>
                <p className="text-2xl font-black gradient-text">{totalNet.toFixed(1)}</p>
              </div>
              <button type="submit" disabled={submitting || !examName.trim()} className="btn-primary text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-4">
                {submitting ? 'Kaydediliyor...' : '💾 Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}