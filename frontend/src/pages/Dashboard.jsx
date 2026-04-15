// ============================================
// Dashboard Sayfası
// İstatistikler, Net Trend Grafiği, Ders Performansı, Kırmızı Alarm, Son Denemeler
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Layout from '../components/Layout';
import { getStudent, getSummary, getMonthlyTrend, getSubjectProgress, getWeakTopics, getExams } from '../api/client';

const monthNames = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis',
  '05': 'May', '06': 'Haz', '07': 'Tem', '08': 'Ağu',
  '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara'
};

const subjectColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#f97316', '#84cc16'
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-xl text-sm">
      <p className="text-slate-500 dark:text-slate-400 font-medium mb-2 text-xs uppercase tracking-wide">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [category, setCategory] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // İlk yüklemede öğrenciyi bul
  useEffect(() => {
    getStudent(studentId).then(res => {
      setStudent(res.data);
      if (res.data.examType === 'TYT') {
        setCategory('TYT');
      } else {
        setCategory('LGS');
      }
    }).catch(console.error);
  }, [studentId]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    Promise.all([
      getSummary(studentId, category),
      getMonthlyTrend(studentId, category),
      getSubjectProgress(studentId, category),
      getWeakTopics(studentId, category),
      getExams(studentId, category),
    ])
      .then(([summaryRes, trendRes, progressRes, weakRes, examsRes]) => {
        setSummary(summaryRes.data);
        setTrend(trendRes.data.map(t => ({
          ...t,
          label: monthNames[t.month.split('-')[1]] + ' ' + t.month.split('-')[0]
        })));
        setSubjectProgress(progressRes.data);
        setWeakTopics(weakRes.data);
        setRecentExams(examsRes.data.slice(0, 10));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, category]);

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Dashboard yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout studentId={studentId}>
      {/* Sayfa başlığı */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Dashboard {category && `- ${category}`}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Performans analizi ve deneme takibi</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {student?.examType === 'TYT' && (
              <div className="flex bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm dark:shadow-none">
                <button
                  onClick={() => setCategory('TYT')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${category === 'TYT' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  TYT
                </button>
                <button
                  onClick={() => setCategory('AYT')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${category === 'AYT' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  AYT
                </button>
              </div>
            )}
            
            <button
              onClick={() => navigate(`/exam/new/${studentId}`)}
              className="btn-primary flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base px-3 sm:px-6 py-2 sm:py-3"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Yeni Deneme Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="stat-card">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">Toplam Deneme</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{summary?.totalExams || 0}</p>
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl sm:text-5xl opacity-10">📝</div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">Son Net</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary?.lastNet?.toFixed(1) || '—'}
            </p>
            {summary?.trend !== null && (
              <p className={`text-xs sm:text-sm mt-1 font-semibold flex items-center gap-1 ${summary.trend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {summary.trend >= 0 ? '↑' : '↓'} {Math.abs(summary.trend).toFixed(1)}
              </p>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl sm:text-5xl opacity-10">📈</div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">En İyi Net</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {summary?.bestNet?.toFixed(1) || '—'}
            </p>
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl sm:text-5xl opacity-10">🏆</div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">Ortalama</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {summary?.avgNet?.toFixed(1) || '—'}
            </p>
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl sm:text-5xl opacity-10">📊</div>
        </div>
      </div>

      {/* GRAFİKLER */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">📈 Aylık Net Trendi</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Aylara göre ortalama net değişimi</p>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avgNet" name="Ort. Net" stroke="#6366f1" strokeWidth={3} fill="url(#netGradient)"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="bestNet" name="En İyi" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-600">
              <p>Henüz yeterli veri yok</p>
            </div>
          )}

          {trend.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {trend.slice(1).map((t, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <p className="text-xs text-slate-500">{t.label}</p>
                  <p className={`text-sm font-bold ${t.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.change >= 0 ? '+' : ''}{t.change?.toFixed(1)}
                  </p>
                  {t.changePercent !== null && (
                    <p className={`text-xs ${t.changePercent >= 0 ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-rose-600/70 dark:text-rose-500/70'}`}>
                      ({t.changePercent >= 0 ? '+' : ''}{t.changePercent?.toFixed(0)}%)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">📚 Ders Performansı</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Son deneme vs. Ortalama net karşılaştırması</p>
          {subjectProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
              <BarChart data={subjectProgress.map(s => ({ ...s, name: s.subjectName.length > 8 ? s.subjectName.substring(0, 8) + '.' : s.subjectName }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgNet" name="Ortalama" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {subjectProgress.map((_, i) => <Cell key={i} fill={subjectColors[i % subjectColors.length]} opacity={0.4} />)}
                </Bar>
                <Bar dataKey="lastNet" name="Son Net" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {subjectProgress.map((_, i) => <Cell key={i} fill={subjectColors[i % subjectColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-600">
              <p>Henüz yeterli veri yok</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {subjectProgress.map((s, i) => (
              <div key={s.subjectId} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subjectColors[i % subjectColors.length] }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{s.subjectName}</span>
                {s.change !== null && (
                  <span className={`font-bold ml-auto ${s.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALT BÖLÜM */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">🚨 Zayıf Konu Tespiti</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Son 5 denemede hata oranı yüksek konular</p>

          {weakTopics.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {weakTopics.map((topic, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${topic.status === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20' : 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{topic.topicName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{topic.subjectName}</p>
                    </div>
                    <span className={topic.status === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}>
                      {topic.status === 'CRITICAL' ? '🔴 Acil Tekrar' : '🟡 Dikkat'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-700 dark:text-slate-400">
                    <span>Toplam Hata: <strong className="text-slate-900 dark:text-white">{topic.totalErrors}</strong></span>
                    <span>Yanlış: <strong className="text-rose-600 dark:text-rose-400">{topic.totalWrong}</strong></span>
                    <span>Boş: <strong className="text-amber-600 dark:text-amber-400">{topic.totalBlank}</strong></span>
                  </div>
                  <div className="mt-2 bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${topic.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(topic.errorRate * 30, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-600">
              <span className="text-4xl mb-3">🎉</span>
              <p className="font-medium">Tebrikler! Zayıf konu yok</p>
              <p className="text-sm mt-1">Konu analizli deneme girdikçe burası dolacak</p>
            </div>
          )}
        </div>

        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">📋 Son Denemeler</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">En son girilen deneme sonuçları</p>

          {recentExams.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {recentExams.map((exam) => (
                <button key={exam.id} onClick={() => navigate(`/exam/${exam.id}`)}
                  className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 
                    hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {exam.examName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(exam.examDate), 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-black text-slate-900 dark:text-white">{exam.totalNet.toFixed(1)}</p>
                      <p className="text-xs text-slate-500">net</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {exam.results?.map((r) => (
                      <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400">
                        {r.subject.name.substring(0, 3)}: {r.netScore.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-600">
              <span className="text-4xl mb-3">📝</span>
              <p className="font-medium">Henüz deneme girilmemiş</p>
              <button onClick={() => navigate(`/exam/new/${studentId}`)} className="btn-primary mt-3 text-sm">
                İlk denemeyi ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}