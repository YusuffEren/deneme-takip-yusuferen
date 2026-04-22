// ============================================
// GoalsPage - Hedef Yönetimi Sayfası
// Günlük ve haftalık soru/süre hedefleri
// ============================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getStudent, getGoals, createGoal, deleteGoal, getCurriculum } from '../api/client';

const GOAL_TYPES = [
  { value: 'daily', label: 'Günlük', icon: '📅', color: 'indigo' },
  { value: 'weekly', label: 'Haftalık', icon: '📊', color: 'purple' },
];

const METRIC_TYPES = [
  { value: 'questions', label: 'Soru Sayısı', icon: '📚', unit: 'soru' },
  { value: 'duration', label: 'Çalışma Süresi', icon: '⏱️', unit: 'dakika' },
];

export default function GoalsPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [goals, setGoals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Yeni hedef formu
  const [newGoal, setNewGoal] = useState({
    goalType: 'daily',
    metricType: 'questions',
    targetValue: '',
    subjectId: null,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStudent(studentId),
      getGoals(studentId),
    ]).then(async ([studentRes, goalsRes]) => {
      const s = studentRes.data;
      setStudent(s);
      setGoals(goalsRes.data);

      // Dersler
      let allSubjects = [];
      if (s.examType === 'TYT') {
        const [tytRes, aytRes] = await Promise.all([getCurriculum('TYT'), getCurriculum('AYT')]);
        allSubjects = [...tytRes.data, ...aytRes.data];
      } else {
        const currRes = await getCurriculum(s.examType);
        allSubjects = currRes.data;
      }
      setSubjects(allSubjects);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleSaveGoal = async () => {
    if (!newGoal.targetValue || parseInt(newGoal.targetValue) <= 0) {
      toast.error('Hedef değeri girin');
      return;
    }

    setSubmitting(true);
    try {
      await createGoal({
        studentId: parseInt(studentId),
        goalType: newGoal.goalType,
        metricType: newGoal.metricType,
        targetValue: parseInt(newGoal.targetValue),
        subjectId: newGoal.subjectId ? parseInt(newGoal.subjectId) : null,
      });
      toast.success('Hedef kaydedildi! 🎯');

      // Yeniden yükle
      const goalsRes = await getGoals(studentId);
      setGoals(goalsRes.data);

      setShowForm(false);
      setNewGoal({ goalType: 'daily', metricType: 'questions', targetValue: '', subjectId: null });
    } catch (error) {
      console.error(error);
      toast.error('Hedef kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoal(goalId);
      toast.success('Hedef kaldırıldı');
      const goalsRes = await getGoals(studentId);
      setGoals(goalsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Silme hatası');
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

  // Hedefleri kategorize et
  const dailyGoals = goals.filter(g => g.goalType === 'daily');
  const weeklyGoals = goals.filter(g => g.goalType === 'weekly');

  return (
    <Layout studentId={studentId}>
      {/* Başlık */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">⚡ Hedef Yönetimi</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Günlük ve haftalık soru/çalışma hedeflerini belirle
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? '✕ İptal' : '+ Yeni Hedef'}
          </button>
        </div>
      </div>

      {/* YENİ HEDEF FORMU */}
      {showForm && (
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🎯 Yeni Hedef Oluştur</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hedef Türü */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Periyot</label>
              <div className="flex gap-2">
                {GOAL_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNewGoal(prev => ({ ...prev, goalType: type.value }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      newGoal.goalType === type.value
                        ? `bg-${type.color}-100 dark:bg-${type.color}-500/20 text-${type.color}-600 dark:text-${type.color}-300 border-${type.color}-200 dark:border-${type.color}-500/30`
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrik Türü */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Metrik</label>
              <div className="flex gap-2">
                {METRIC_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNewGoal(prev => ({ ...prev, metricType: type.value }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      newGoal.metricType === type.value
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hedef Değeri */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                Hedef ({METRIC_TYPES.find(m => m.value === newGoal.metricType)?.unit})
              </label>
              <input
                type="number"
                min="1"
                value={newGoal.targetValue}
                onChange={e => setNewGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                placeholder={newGoal.metricType === 'questions' ? 'Örn: 50' : 'Örn: 120'}
                className="input-field"
              />
            </div>

            {/* Ders (opsiyonel) */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Ders (opsiyonel)</label>
              <select
                value={newGoal.subjectId || ''}
                onChange={e => setNewGoal(prev => ({ ...prev, subjectId: e.target.value || null }))}
                className="input-field"
              >
                <option value="">Genel (tüm dersler)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.examType})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveGoal}
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <>💾 Hedefi Kaydet</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MEVCUT HEDEFLER */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Günlük Hedefler */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Günlük Hedefler</h2>
              <p className="text-xs text-slate-500">Her gün ulaşılması gereken hedefler</p>
            </div>
          </div>

          {dailyGoals.length > 0 ? (
            <div className="space-y-3">
              {dailyGoals.map(goal => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm">
                    {goal.metricType === 'questions' ? '📚' : '⏱️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {goal.metricType === 'questions' ? `${goal.targetValue} soru` : `${goal.targetValue} dakika`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {goal.subject ? goal.subject.name : 'Genel'} • {goal.metricType === 'questions' ? 'Soru hedefi' : 'Süre hedefi'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-600">
              <span className="text-3xl mb-2">🎯</span>
              <p className="text-sm">Henüz günlük hedef belirlenmemiş</p>
            </div>
          )}
        </div>

        {/* Haftalık Hedefler */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Haftalık Hedefler</h2>
              <p className="text-xs text-slate-500">Her hafta ulaşılması gereken hedefler</p>
            </div>
          </div>

          {weeklyGoals.length > 0 ? (
            <div className="space-y-3">
              {weeklyGoals.map(goal => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 group hover:border-purple-200 dark:hover:border-purple-500/20 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-sm">
                    {goal.metricType === 'questions' ? '📚' : '⏱️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {goal.metricType === 'questions' ? `${goal.targetValue} soru` : `${goal.targetValue} dakika`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {goal.subject ? goal.subject.name : 'Genel'} • {goal.metricType === 'questions' ? 'Soru hedefi' : 'Süre hedefi'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-600">
              <span className="text-3xl mb-2">📈</span>
              <p className="text-sm">Henüz haftalık hedef belirlenmemiş</p>
            </div>
          )}
        </div>
      </div>

      {/* Örnek hedefler */}
      {goals.length === 0 && !showForm && (
        <div className="mt-8 glass-card p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">💡 Önerilen Hedefler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { type: 'daily', metric: 'questions', value: 50, label: 'Günde 50 soru çöz' },
              { type: 'daily', metric: 'duration', value: 180, label: 'Günde 3 saat çalış' },
              { type: 'weekly', metric: 'questions', value: 350, label: 'Haftada 350 soru çöz' },
              { type: 'weekly', metric: 'duration', value: 1260, label: 'Haftada 21 saat çalış' },
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={async () => {
                  try {
                    await createGoal({
                      studentId: parseInt(studentId),
                      goalType: suggestion.type,
                      metricType: suggestion.metric,
                      targetValue: suggestion.value,
                      subjectId: null,
                    });
                    toast.success(`"${suggestion.label}" hedefi eklendi! 🎯`);
                    const goalsRes = await getGoals(studentId);
                    setGoals(goalsRes.data);
                  } catch (e) {
                    toast.error('Hata oluştu');
                  }
                }}
                className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/[0.03] dark:to-white/[0.01] border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group"
              >
                <p className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{suggestion.label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {suggestion.type === 'daily' ? '📅 Günlük' : '📊 Haftalık'} • {suggestion.metric === 'questions' ? '📚 Soru' : '⏱️ Süre'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
