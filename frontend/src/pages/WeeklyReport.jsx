// ============================================
// WeeklyReport - Haftalık Verimlilik Raporu
// Toplam süre, toplam soru, başarı yüzdesi, korelasyon grafikleri
// ============================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell, LineChart, Line,
  ComposedChart, Legend
} from 'recharts';
import Layout from '../components/Layout';
import { getWeeklyReport, getCorrelation, getRedAlerts, getStudent } from '../api/client';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316'];

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

export default function WeeklyReport() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [report, setReport] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

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
      getWeeklyReport(studentId, weekOffset),
      getCorrelation(studentId, category),
      getRedAlerts(studentId, category),
    ]).then(([reportRes, corrRes, alertRes]) => {
      setReport(reportRes.data);
      setCorrelation(corrRes.data);
      setAlerts(alertRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, weekOffset, category]);

  if (loading) {
    return (
      <Layout studentId={studentId}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Rapor hazırlanıyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const summary = report?.summary || {};
  const goals = report?.goals || {};

  return (
    <Layout studentId={studentId}>
      {/* Başlık */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">📊 Haftalık Verimlilik Raporu</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {report?.weekStart} → {report?.weekEnd}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="btn-secondary px-3 py-2 text-sm"
            >
              ← Önceki
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${weekOffset === 0 ? 'bg-indigo-500 text-white' : 'btn-secondary'}`}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={weekOffset >= 0}
              className="btn-secondary px-3 py-2 text-sm disabled:opacity-30"
            >
              Sonraki →
            </button>
          </div>
        </div>
      </div>

      {/* ÖZET KARTLAR */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Toplam Soru</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{summary.totalSolved || 0}</p>
          {goals.weeklyQuestions?.target && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Hedef: {goals.weeklyQuestions.target}</span>
                <span>{goals.weeklyQuestions.percentage || 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(goals.weeklyQuestions.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 text-4xl opacity-10">📚</div>
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Doğru Sayısı</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{summary.totalCorrect || 0}</p>
          <div className="absolute -bottom-2 -right-2 text-4xl opacity-10">✅</div>
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Başarı Oranı</p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            %{summary.successRate || 0}
          </p>
          <div className="absolute -bottom-2 -right-2 text-4xl opacity-10">🎯</div>
        </div>

        <div className="stat-card">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Çalışma Süresi</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {summary.totalStudyHours || 0}s
          </p>
          {goals.weeklyDuration?.target && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Hedef: {goals.weeklyDuration.target}dk</span>
                <span>{goals.weeklyDuration.percentage || 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(goals.weeklyDuration.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 text-4xl opacity-10">⏱️</div>
        </div>

        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Aktif Gün</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{summary.activeDays || 0}/7</p>
          <div className="mt-1 flex gap-1">
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} className={`w-3 h-3 rounded-sm ${i < (summary.activeDays || 0) ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/5'}`} />
            ))}
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl opacity-10">🔥</div>
        </div>
      </div>

      {/* GRAFİKLER */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Günlük Soru ve Süre */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">📈 Günlük Aktivite</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Günlere göre soru ve çalışma süresi</p>

          {report?.dailyBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={report.dailyBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="solvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                <XAxis dataKey="dayName" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#a855f7" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="solved" name="Çözülen Soru" radius={[4, 4, 0, 0]} maxBarSize={35}>
                  {report.dailyBreakdown.map((_, i) => (
                    <Cell key={i} fill="#6366f1" opacity={0.8} />
                  ))}
                </Bar>
                <Bar yAxisId="left" dataKey="correct" name="Doğru" radius={[4, 4, 0, 0]} maxBarSize={35} fill="#10b981" opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="minutes" name="Dakika" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-600">
              <div className="text-center">
                <span className="text-4xl mb-3 block">📝</span>
                <p>Bu hafta henüz veri girilmemiş</p>
              </div>
            </div>
          )}
        </div>

        {/* Ders Bazlı Soru Dağılımı */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">📚 Ders Bazlı Sorular</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Hangi derslere ne kadar soru çözdün</p>

          {report?.subjectQuestions?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={report.subjectQuestions.map(s => ({
                  ...s,
                  name: s.subjectName.length > 10 ? s.subjectName.substring(0, 10) + '.' : s.subjectName,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="correct" name="Doğru" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={30} fill="#10b981" />
                <Bar dataKey="wrong" name="Yanlış" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={30} fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-600">
              <p>Henüz veri yok</p>
            </div>
          )}
        </div>
      </div>

      {/* KORELASYON + KIRMIZI ALARM */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Deneme-Çalışma Korelasyonu */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">🔗 Çalışma-Net Korelasyonu</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Deneme öncesi çalışma ile net arasındaki ilişki</p>

          {correlation?.data?.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={correlation.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="netGradientCorr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                <XAxis dataKey="examName" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" height={60}
                  tickFormatter={name => name.length > 12 ? name.substring(0, 12) + '..' : name} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="totalNet" name="Net" stroke="#6366f1" fill="url(#netGradientCorr)" strokeWidth={3} />
                <Bar yAxisId="right" dataKey="weeklyStudyHours" name="Çalışma (saat)" fill="#10b981" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={25} />
                <Line yAxisId="right" type="monotone" dataKey="weeklyQuestions" name="Haftalık Soru" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-600">
              <div className="text-center">
                <span className="text-4xl mb-3 block">📉</span>
                <p>Korelasyon için en az 2 deneme gerekli</p>
              </div>
            </div>
          )}
        </div>

        {/* Kırmızı Alarm */}
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">🚨 Kırmızı Alarm</h2>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">
            {alerts?.message || 'Son denemelerde sürekli hata yapılan konular'}
          </p>

          {alerts?.alerts?.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {alerts.alerts.map((alert, i) => (
                <div key={i} className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{alert.topicName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.subjectName}</p>
                    </div>
                    <span className="badge-critical flex-shrink-0">
                      {alert.consecutiveExams} denemede hata
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Çalışma: <strong className={alert.studyHours > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {alert.studyHours > 0 ? `${alert.studyHours} saat` : 'Hiç çalışılmamış'}
                      </strong>
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/10 rounded-lg p-2">
                    {alert.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-600">
              <span className="text-4xl mb-3">🎉</span>
              <p className="font-medium">Sürekli tekrar eden hata yok!</p>
              <p className="text-sm mt-1">Deneme girdikçe konu analizleri buraya gelecek</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
