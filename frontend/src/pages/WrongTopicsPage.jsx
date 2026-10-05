// ============================================
// WrongTopicsPage - Yanlış Konu Geçmişi
// Tüm denemelerde yanlış/boş yapılan konular,
// kronolojik sırayla. Konuya dokununca geçmiş açılır,
// denemeye tıklayınca deneme detayına gider.
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getWrongTopicHistory } from '../api/client';

export default function WrongTopicsPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    getWrongTopicHistory(studentId)
      .then(res => setTopics(res.data))
      .catch(err => {
        console.error('Yanlış konu geçmişi yükleme hatası:', err);
        toast.error('Geçmiş yüklenirken bir hata oluştu');
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Ders listesi (filtre için)
  const subjects = [...new Set(topics.map(t => t.subjectName))].filter(Boolean).sort();

  const filtered = subjectFilter
    ? topics.filter(t => t.subjectName === subjectFilter)
    : topics;

  // Ders bazında grupla
  const grouped = filtered.reduce((acc, t) => {
    const key = t.subjectName || 'Diğer';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const totalWrong = topics.reduce((s, t) => s + t.totalWrong, 0);
  const totalBlank = topics.reduce((s, t) => s + t.totalBlank, 0);

  return (
    <Layout studentId={studentId}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">🔍 Yanlış Konu Geçmişi</h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
          Tüm denemelerde yanlış ve boş yaptığın konular — geçmişe dönüp her zaman görebilirsin
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Henüz konu bazlı hata kaydı yok</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Deneme sonucu girerken ders kartındaki <strong>"▼ Konu"</strong> butonuyla hangi konulardan yanlış yaptığını işaretlersen, o konular burada birikir.
          </p>
          <button onClick={() => navigate(`/exam/new/${studentId}`)} className="btn-primary">
            + Yeni Deneme Ekle
          </button>
        </div>
      ) : (
        <>
          {/* Özet + filtre */}
          <div className="glass-card p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">Hatalı Konu</p>
                  <p className="font-black text-xl sm:text-2xl text-slate-800 dark:text-white">{topics.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">Toplam Yanlış</p>
                  <p className="font-black text-xl sm:text-2xl text-rose-500">{totalWrong}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">Toplam Boş</p>
                  <p className="font-black text-xl sm:text-2xl text-amber-500">{totalBlank}</p>
                </div>
              </div>

              {subjects.length > 1 && (
                <select
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                  className="input-field max-w-[220px] text-sm"
                >
                  <option value="">Tüm Dersler</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Ders bazlı gruplar */}
          {Object.entries(grouped).map(([subjectName, subjectTopics]) => (
            <div key={subjectName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{subjectName}</h2>
                <span className="text-xs text-slate-500">({subjectTopics.length} konu)</span>
              </div>

              <div className="space-y-3">
                {subjectTopics.map(topic => {
                  const isExpanded = expandedTopic === topic.topicId;
                  return (
                    <div key={topic.topicId} className="glass-card overflow-hidden">
                      {/* Konu başlık satırı */}
                      <button
                        type="button"
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.topicId)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-14 text-center">
                            <span className={`px-2 py-1 rounded-lg text-sm font-black ${topic.totalWrong > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                              {topic.totalErrors}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{topic.topicName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {topic.examCount} denemede çıktı
                              {topic.lastDate && ` · son: ${format(new Date(topic.lastDate), 'd MMM yyyy', { locale: tr })}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Açılınca: kronolojik geçmiş */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] p-4">
                          <p className="text-xs text-slate-500 mb-3">Hangi denemede ne kadar yanlış/boş yaptın (yeniden eskiye):</p>
                          <div className="space-y-2">
                            {topic.history.map((h, i) => (
                              <button
                                key={`${h.examId}-${i}`}
                                type="button"
                                onClick={() => navigate(`/exam/${h.examId}`)}
                                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">
                                    {format(new Date(h.examDate), 'd MMM yy', { locale: tr })}
                                  </span>
                                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{h.examName}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 text-xs font-bold">
                                  {h.wrongCount > 0 && (
                                    <span className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                      {h.wrongCount} yanlış
                                    </span>
                                  )}
                                  {h.blankCount > 0 && (
                                    <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                      {h.blankCount} boş
                                    </span>
                                  )}
                                  <span className="text-slate-400">→</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}
