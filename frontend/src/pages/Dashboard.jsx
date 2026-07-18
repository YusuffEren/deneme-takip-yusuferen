// ============================================
// Dashboard Sayfası - Genişletilmiş
// İstatistikler, Grafikler, Günlük Özet, Korelasyon, Kırmızı Alarm
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, Line
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Layout from '../components/Layout';
import { SkeletonCard, SkeletonChart, SkeletonList } from '../components/Skeleton';
import {
  getStudent, getSummary, getMonthlyTrend, getSubjectProgress,
  getWeakTopics, getExams, getWeeklyReport
} from '../api/client';

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
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(studentId).then(res => {
      setStudent(res.data);
      setCategory(res.data.examType === 'TYT' ? 'TYT' : 'LGS');
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
      getWeeklyReport(studentId, 0),
    ])
      .then(([summaryRes, trendRes, progressRes, weakRes, examsRes, weeklyRes]) => {
        setSummary(summaryRes.data);
        setTrend(trendRes.data.map(t => ({
          ...t,
          label: monthNames[t.month.split('-')[1]] + ' ' + t.month.split('-')[0]
        })));
        setSubjectProgress(progressRes.data);
        setWeakTopics(weakRes.data);
        setRecentExams(examsRes.data.slice(0, 10));
        setWeeklyReport(weeklyRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, category]);

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="mb-6 sm:mb-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <SkeletonList rows={5} />
          <SkeletonList rows={5} />
        </div>
      </Layout>
    );
  }

  const ws = weeklyReport?.summary || {};

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
              <div className="flex bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
                <button onClick={() => setCategory('TYT')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${category === 'TYT' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  TYT
                </button>
                <button onClick={() => setCategory('AYT')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${category === 'AYT' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  AYT
                </button>
              </div>
            )}
            <button onClick={() => navigate(`/exam/new/${studentId}`)}
              className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-base px-3 sm:px-6 py-2 sm:py-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Yeni Deneme</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="stat-card bg-gradient-to-br from-white to-indigo-50/30 dark:from-white/[0.04] dark:to-indigo-500/[0.03]">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1 font-medium tracking-wide">Toplam Deneme</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{summary?.totalExams || 0}</p>
            {summary?.avgNet ? (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                Ø {summary.avgNet.toFixed(1)} net
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Henüz deneme yok</p>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.06] select-none">📝</div>
        </div>
        <div className="stat-card bg-gradient-to-br from-white to-emerald-50/30 dark:from-white/[0.04] dark:to-emerald-500/[0.03]">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1 font-medium tracking-wide">Son Net</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{summary?.lastNet?.toFixed(1) || '—'}</p>
            {summary?.trend !== null && summary?.trend !== undefined ? (
              <p className={`text-xs sm:text-sm mt-1 font-semibold flex items-center gap-1 ${summary.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${summary.trend >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'}`}>
                  {summary.trend >= 0 ? '↑' : '↓'}
                </span>
                <span>{Math.abs(summary.trend).toFixed(1)}</span>
                <span className="font-normal text-slate-400">önceki denemeye göre</span>
              </p>
            ) : summary?.totalExams > 0 ? (
              <p className="text-xs text-slate-400 mt-1">İlk deneme - kıyas yok</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Henüz deneme yok</p>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.06] select-none">🎯</div>
        </div>
        <div className="stat-card bg-gradient-to-br from-white to-amber-50/30 dark:from-white/[0.04] dark:to-amber-500/[0.03]">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1 font-medium tracking-wide">En İyi Net</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{summary?.bestNet?.toFixed(1) || '—'}</p>
            {summary?.worstNet !== null && summary?.worstNet !== undefined && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                En düşük: {summary.worstNet.toFixed(1)}
              </p>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.06] select-none">🏆</div>
        </div>
        <div className="stat-card bg-gradient-to-br from-white to-purple-50/30 dark:from-white/[0.04] dark:to-purple-500/[0.03]">
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1 font-medium tracking-wide">Bu Hafta</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{ws.totalSolved || 0}</p>
            <p className="text-xs text-slate-400 mt-1">
              {ws.totalSolved > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  %{ws.successRate || 0} başarı
                </span>
              ) : (
                'Soru girilmemiş'
              )}
            </p>
          </div>
          <div className="absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.06] select-none">📊</div>
        </div>
      </div>

      {/* GRAFİKLER */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 bg-gradient-to-r from-indigo-500/5 to-transparent dark:from-indigo-500/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📈</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Aylık Net Trendi</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4">Aylara göre ortalama net değişimi</p>
          </div>
          <div className="p-4 sm:p-6 pt-0">
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
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
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="bestNet" name="En İyi" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500"><p>Henüz yeterli veri yok</p></div>
          )}
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📚</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Ders Performansı</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Son deneme vs. Ortalama net</p>
          {subjectProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
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
            <div className="flex items-center justify-center h-64 text-slate-500"><p>Henüz yeterli veri yok</p></div>
          )}
        </div>
      </div>

      {/* ALT BÖLÜM - Zayıf Konular + Son Denemeler */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 bg-gradient-to-r from-rose-500/5 to-transparent dark:from-rose-500/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚨</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Zayıf Konu Tespiti</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4">Son 5 denemede hata oranı yüksek konular</p>
          </div>
          <div className="p-4 sm:p-6 pt-0">
          {weakTopics.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {weakTopics.map((topic, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md ${topic.status === 'CRITICAL' ? 'bg-rose-50/80 dark:bg-rose-500/[0.04] border-rose-200 dark:border-rose-500/20' : 'bg-amber-50/80 dark:bg-amber-500/[0.04] border-amber-200 dark:border-amber-500/20'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{topic.topicName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{topic.subjectName}</p>
                    </div>
                    <span className={topic.status === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}>
                      {topic.status === 'CRITICAL' ? '🔴 Acil' : '🟡 Dikkat'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-700 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      Hata: <strong>{topic.totalErrors}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Çalışma: <strong className={topic.studyHours > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {topic.studyHours > 0 ? `${topic.studyHours}s` : 'Yok'}
                      </strong>
                    </span>
                    {topic.needsMoreStudy && <span className="badge-critical text-[10px] px-2 py-0.5 animate-wiggle">Çalışma artır!</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <span className="text-5xl mb-3 animate-float">🎉</span>
              <p className="font-medium text-slate-700 dark:text-slate-300">Tebrikler! Zayıf konu yok</p>
              <p className="text-xs mt-1">Tüm konularda başarılı görünüyorsun</p>
            </div>
          )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 bg-gradient-to-r from-emerald-500/5 to-transparent dark:from-emerald-500/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📋</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Son Denemeler</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4">En son girilen deneme sonuçları</p>
          </div>
          <div className="p-4 sm:p-6 pt-0">
          {recentExams.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {recentExams.map((exam) => (
                <button key={exam.id} onClick={() => navigate(`/exam/${exam.id}`)}
                  className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5
                    hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {exam.examName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {format(new Date(exam.examDate), 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-black gradient-text">{exam.totalNet.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Net</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {exam.results?.map((r) => (
                      <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 font-medium">
                        {r.subject.name.substring(0, 3)}: {r.netScore.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <span className="text-5xl mb-3 animate-float" style={{ animationDelay: '1s' }}>📝</span>
              <p className="font-medium text-slate-700 dark:text-slate-300">Henüz deneme girilmemiş</p>
              <p className="text-xs mt-1 mb-4">İlk denemeni ekleyerek analizleri başlat</p>
              <button onClick={() => navigate(`/exam/new/${studentId}`)} className="btn-primary text-sm">İlk Denemeyi Ekle</button>
            </div>
          )}
          </div>
        </div>
      </div>
    </Layout>
  );
}