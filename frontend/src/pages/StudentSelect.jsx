// ============================================
// Giriş / Profil Seçim Sayfası
// Öğrencilerin LGS veya YKS profillerini seçtiği karşılama ekranı
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../api/client';
import toast from 'react-hot-toast';

export default function StudentSelect() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.theme = newTheme;
  };

  const loadStudents = async () => {
    setLoading(true);
    setApiError(null);

    // Ücretsiz Render backend'i uyuyor olabilir; uyanması ~50 sn sürebilir.
    // Bu yüzden hata durumunda kullanıcıya hata göstermeden önce
    // birkaç kez otomatik tekrar dene.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await getStudents();
        if (Array.isArray(res.data)) {
          setStudents(res.data);
          if (res.data.length === 0) {
            setApiError('empty');
          }
        } else {
          setApiError('empty');
        }
        setLoading(false);
        return;
      } catch (err) {
        console.error(`Öğrenci yükleme hatası (deneme ${attempt}/${maxAttempts}):`, err);
        if (attempt < maxAttempts) {
          // Yeni denemeden önce kısa bekleme (backend uyanıyor olabilir)
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    setApiError('connection');
    toast.error('Sunucuya bağlanılamadı!');
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await loadStudents();
    setRetrying(false);
  };

  const handleStudentSelect = (studentId) => {
    navigate(`/dashboard/${studentId}`);
  };

  // Dekoratif öğeler için stiller
  const dekor = {
    TYT: {
      gradient: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      icon: '🏛️',
    },
    LGS: {
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: '🚀',
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300 bg-mesh-light dark:bg-mesh-dark">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl animate-float">📊</span>
          </div>
          <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-base font-medium">Sunucuya bağlanılıyor...</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Backend başlatılıyor, bu birkaç saniye sürebilir</p>
        </div>
      </div>
    );
  }

  const showError = apiError === 'connection';
  const showEmpty = apiError === 'empty' || students.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center px-4 transition-colors duration-300 bg-grid-light dark:bg-grid-dark">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Logo ve Başlık */}
          <div className="text-center mb-8 sm:mb-12 animate-slide-up">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_8px_32px_rgba(99,102,241,0.15)] mb-4 sm:mb-6">
              <span className="text-4xl sm:text-6xl filter drop-shadow-lg animate-float">📊</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight leading-tight">
              Deneme <span className="gradient-text">Takip</span>
            </h1>
            <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-medium px-4 leading-relaxed">
              Sınav yolculuğunda netlerini analiz et, <br className="hidden sm:block" />
              zayıf konularını keşfet ve başarıya ulaş.
            </p>
          </div>

          {/* BAĞLANTI HATASI */}
          {showError && (
            <div className="w-full max-w-md animate-slide-up">
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 11-12.728 12.728M5.636 5.636a9 9 0 1012.728 12.728M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sunucuya Bağlanılamadı</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Backend sunucusu çalışmıyor olabilir. Lütfen aşağıdaki adımları kontrol edin:
                </p>
                <div className="text-left bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 mb-6 text-xs space-y-2 text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
                  <p>1. Backend dizinine gidin: <code className="text-indigo-600 dark:text-indigo-400">cd backend</code></p>
                  <p>2. Bağımlılıkları yükleyin: <code className="text-indigo-600 dark:text-indigo-400">pip install -r requirements.txt</code></p>
                  <p>3. Backend'i başlatın: <code className="text-indigo-600 dark:text-indigo-400">uvicorn app.main:app --reload --port 8000</code></p>
                  <p>4. Veritabanını doldurun: <code className="text-indigo-600 dark:text-indigo-400">python seed.py</code></p>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {retrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Bağlanıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Tekrar Dene
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VERİ YOK / BOŞ */}
          {showEmpty && !showError && (
            <div className="w-full max-w-md animate-slide-up">
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Henüz Profil Yok</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Veritabanında hiç öğrenci profili bulunamadı. Seed işlemini çalıştırmanız gerekiyor:
                </p>
                <div className="text-left bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 mb-6 text-xs space-y-2 text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
                  <p><code className="text-indigo-600 dark:text-indigo-400">cd backend</code></p>
                  <p><code className="text-indigo-600 dark:text-indigo-400">python seed.py</code></p>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {retrying ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kontrol Ediliyor...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Tekrar Dene</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Profil Kartları Grid */}
          {!showError && !showEmpty && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl px-3 sm:px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {students.map((student) => {
                const style = dekor[student.examType] || dekor.TYT;
                
                return (
                  <button
                    key={student.id}
                    onClick={() => handleStudentSelect(student.id)}
                    className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl text-left active:scale-[0.98] animate-fade-in"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-5xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 filter drop-shadow-md">
                          {style.icon}
                        </span>
                        <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-white/80 dark:bg-slate-800/80 backdrop-blur ${style.text} shadow-sm dark:shadow-none border border-slate-200/50 dark:border-white/10`}>
                          {student.examType}
                        </span>
                      </div>
                      
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {student.name}
                      </h2>
                      
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                        {student.examType === 'LGS' ? 'LGS Sınav Öncesi Hazırlık' : 'YKS / TYT-AYT Sayısal'}
                      </p>

                      <div className="mt-4 sm:mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        <span className="text-xs sm:text-sm font-medium">Dashboard'a git</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="relative z-10 mt-8 sm:mt-12 text-center text-slate-600 dark:text-slate-500 text-xs sm:text-sm animate-fade-in">
            <p>🎯 Düzenli çalış, hedefine ulaş!</p>
          </div>
        </div>

        {/* Tema değiştirme butonu */}
        <button
          onClick={toggleTheme}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
          aria-label="Tema değiştir"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:-rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
  );
}
