// ============================================
// ExamDetail - Deneme Sınavı Detay Sayfası
// Belirli bir denemenin sonuçlarını, ders analizlerini
// ve konu bazlı hatalarını gösterir.
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getExam, deleteExam } from '../api/client';

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Doğru, Boş, Yanlış

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-xl text-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
        <span className="font-bold text-slate-800 dark:text-white">{data.name}</span>
      </div>
      <p className="text-slate-600 dark:text-slate-300">
        Soru Sayısı: <strong className="text-slate-900 dark:text-white">{data.value}</strong>
      </p>
    </div>
  );
}

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExam(examId);
      toast.success('Deneme başarıyla silindi');
      navigate(`/dashboard/${exam.studentId}`);
    } catch (err) {
      console.error('Silme hatası:', err);
      toast.error('Deneme silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    getExam(examId)
      .then(res => setExam(res.data))
      .catch(err => {
        console.error('Deneme yükleme hatası:', err);
        setError('Deneme verileri bulunamadı veya yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Deneme detayları yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !exam) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <span className="text-6xl mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hata Oluştu</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Geri Dön</button>
        </div>
      </Layout>
    );
  }

  // Genel toplam hesaplamaları
  let totalQuestions = 0;
  let totalWrong = 0;
  let totalBlank = 0;

  exam.results.forEach(r => {
    totalQuestions += r.totalQuestions;
    totalWrong += r.wrongCount;
    totalBlank += r.blankCount;
  });

  const totalCorrect = totalQuestions - totalWrong - totalBlank;
  
  const pieData = [
    { name: 'Doğru', value: totalCorrect },
    { name: 'Boş', value: totalBlank },
    { name: 'Yanlış', value: totalWrong },
  ].filter(d => d.value > 0);

  return (
    <Layout studentId={exam.studentId}>
      {/* Silme Onay Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Denemeyi Sil</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                <strong className="text-slate-900 dark:text-white">"{exam.examName}"</strong> adlı denemeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  disabled={deleting}
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-rose-500 hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Evet, Sil
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Üst Bilgi Başlığı */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => navigate(`/dashboard/${exam.studentId}`)}
            className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            ← Dashboard'a Dön
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{exam.examName}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
              {format(new Date(exam.examDate), 'd MMMM yyyy', { locale: tr })}
            </p>
          </div>
          <div className="flex items-center gap-6 glass-card px-6 py-3">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Toplam Soru</p>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{totalQuestions}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Toplam Net</p>
              <p className="font-black text-2xl gradient-text">{exam.totalNet.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafikler Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Net Dağılım Çubuğu */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">📊 Ders Bazlı Dağılım</h2>
          <div className="space-y-4">
            {exam.results.map(r => {
              const maxScore = r.totalQuestions;
              const ratio = Math.max(0, (r.netScore / maxScore) * 100);
              
              return (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{r.subject.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{r.netScore.toFixed(1)} <span className="text-slate-400 text-xs font-normal">/ {maxScore}</span></span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pasta Grafiği (Doğru Yanlış Boş Genel) */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 w-full">🎯 Genel Dağılım</h2>
          <div className="w-full h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Ortadaki Net Yazısı */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none mb-1">{exam.totalNet.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-wider">NET</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-2 w-full">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 dark:text-slate-400">{d.name}: <strong className="text-slate-900 dark:text-white">{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ders ve Konu Detayları Tablosu */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">📋 Ders Bazlı Sonuçlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/[0.01]">
                <th className="py-3 px-4 font-semibold">Ders</th>
                <th className="py-3 px-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">Soru</th>
                <th className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">D</th>
                <th className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">Y</th>
                <th className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400">B</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">NET</th>
              </tr>
            </thead>
            <tbody>
              {exam.results.map(r => {
                const correct = r.totalQuestions - r.wrongCount - r.blankCount;
                return (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">{r.subject.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-300">{r.totalQuestions}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{correct}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">{r.wrongCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{r.blankCount}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">{r.netScore.toFixed(1)}</td>
                  </tr>
                );
              })}
              
              {/* Toplam Satırı */}
              <tr className="bg-slate-100 dark:bg-indigo-500/10 border-t border-slate-200 dark:border-indigo-500/20">
                <td className="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="text-lg">📊</span> GENEL TOPLAM
                </td>
                <td className="py-3 px-4 text-center font-black text-slate-600 dark:text-slate-300">{totalQuestions}</td>
                <td className="py-3 px-4 text-center font-black text-emerald-600 dark:text-emerald-400">{totalCorrect}</td>
                <td className="py-3 px-4 text-center font-black text-rose-600 dark:text-rose-400">{totalWrong}</td>
                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400">{totalBlank}</td>
                <td className="py-3 px-4 text-center font-black text-lg gradient-text">{exam.totalNet.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {exam.topicAnalyses?.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="text-xl">🔍</span> Konu Bazlı Hata Analizi
            </h2>
            <p className="text-xs text-slate-500 mt-1">Hangi konularda eksik olduğunu buradan detaylı görebilirsin.</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exam.topicAnalyses.map(a => (
              <div key={a.id} className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${a.wrongCount > 0 ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20' : 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'}`}>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 leading-tight">{a.topic.name}</h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${a.wrongCount > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                    {a.topic.subject.name.substring(0, 3).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  {a.wrongCount > 0 && (
                    <div className="flex-1 bg-white/50 dark:bg-white/5 rounded-lg p-2 text-center border border-slate-200 dark:border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">YANLIŞ</p>
                      <p className="font-black text-rose-600 dark:text-rose-400 text-lg">{a.wrongCount}</p>
                    </div>
                  )}
                  {a.blankCount > 0 && (
                    <div className="flex-1 bg-white/50 dark:bg-white/5 rounded-lg p-2 text-center border border-slate-200 dark:border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">BOŞ</p>
                      <p className="font-black text-amber-600 dark:text-amber-400 text-lg">{a.blankCount}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </Layout>
  );
}