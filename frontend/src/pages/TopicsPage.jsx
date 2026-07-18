// ============================================
// Konu Takip Sayfası
// Müfredattaki konuları "bitirdim" diye işaretleme + % ilerleme
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import { getStudent, getCurriculum, getTopicProgress, toggleTopicProgress } from '../api/client';

export default function TopicsPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [category, setCategory] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    getStudent(studentId)
      .then((res) => {
        setStudent(res.data);
        setCategory(res.data.examType === 'TYT' ? 'TYT' : 'LGS');
      })
      .catch(console.error);
  }, [studentId]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    Promise.all([getCurriculum(category), getTopicProgress(studentId)])
      .then(([curRes, progRes]) => {
        setCurriculum(curRes.data);
        setCompletedIds(new Set(progRes.data.completedTopicIds));
        // İlk dersi açık başlat
        if (curRes.data.length > 0) {
          setOpenSubjects({ [curRes.data[0].id]: true });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, category]);

  const handleToggle = async (topicId) => {
    const completed = !completedIds.has(topicId);

    // Önce arayüzü güncelle (iyimser güncelleme)
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (completed) next.add(topicId);
      else next.delete(topicId);
      return next;
    });

    try {
      await toggleTopicProgress({ studentId: Number(studentId), topicId, completed });
    } catch (err) {
      // Hata olursa geri al
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (completed) next.delete(topicId);
        else next.add(topicId);
        return next;
      });
      toast.error('Kaydedilemedi, tekrar dene');
    }
  };

  const stats = useMemo(() => {
    const total = curriculum.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
    const done = completedIds.size;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [curriculum, completedIds]);

  const filteredCurriculum = useMemo(() => {
    if (!search.trim()) return curriculum;
    const q = search.toLocaleLowerCase('tr');
    return curriculum
      .map((s) => ({
        ...s,
        topics: (s.topics || []).filter((t) => t.name.toLocaleLowerCase('tr').includes(q)),
      }))
      .filter((s) => s.topics.length > 0);
  }, [curriculum, search]);

  return (
    <Layout studentId={studentId}>
      {/* Başlık */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Konu Takibi {category && `- ${category}`}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
          Bitirdiğin konuları işaretle, müfredat ilerlemeni gör
        </p>
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : (
        <>
          {/* Genel ilerleme kartı */}
          <div className="glass-card p-5 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Genel İlerleme</h2>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {stats.done} / {stats.total} konu
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">%{stats.percent} tamamlandı</p>
          </div>

          {/* TYT/AYT sekmesi + arama */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {student?.examType === 'TYT' && (
              <div className="flex bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm w-fit">
                <button
                  onClick={() => setCategory('TYT')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${category === 'TYT' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  TYT
                </button>
                <button
                  onClick={() => setCategory('AYT')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${category === 'AYT' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  AYT
                </button>
              </div>
            )}
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Konu ara..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Ders kartları */}
          <div className="space-y-4">
            {filteredCurriculum.map((subject) => {
              const topics = subject.topics || [];
              const doneCount = topics.filter((t) => completedIds.has(t.id)).length;
              const percent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;
              const isOpen = openSubjects[subject.id] || search.trim().length > 0;

              return (
                <div key={subject.id} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setOpenSubjects((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                    className="w-full px-5 sm:px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                          {subject.name}
                        </h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${percent === 100 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                          {percent === 100 ? '✓ Bitti' : `${doneCount}/${topics.length}`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topics.map((topic) => {
                        const done = completedIds.has(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => handleToggle(topic.id)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-all active:scale-[0.98] ${done
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                              }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-white/20'
                                }`}
                            >
                              {done && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <span className={done ? 'line-through opacity-70' : ''}>{topic.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCurriculum.length === 0 && (
              <div className="glass-card p-8 text-center text-slate-500">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="font-medium">Aramayla eşleşen konu bulunamadı</p>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
