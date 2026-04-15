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

  useEffect(() => {
    getStudents()
      .then((res) => setStudents(res.data))
      .catch((err) => {
        console.error('Öğrenci yükleme hatası:', err);
        toast.error('Profiller yüklenemedi!');
      })
      .finally(() => setLoading(false));
  }, []);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center px-4 transition-colors duration-300">
        {/* Arka plan orb efektleri - her iki modda da görünür */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Ana İçerik Konteyneri */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Logo ve Başlık */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-block p-4 rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-none mb-6">
              <span className="text-6xl filter drop-shadow-lg">📊</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Deneme <span className="gradient-text">Takip</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-medium">
              Sınav yolculuğunda netlerini analiz et, zayıf konularını keşfet ve başarıya ulaş.
            </p>
          </div>

          {/* Profil Kartları Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {students.map((student) => {
              const style = dekor[student.examType] || dekor.TYT;
              
              return (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student.id)}
                  className={`group relative overflow-hidden rounded-3xl p-8 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl text-left`}
                >
                  {/* Arka plan parlama efekti (Yalnızca karanlık modda daha belirgin) */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
                        {style.icon}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 ${style.text} shadow-sm dark:shadow-none`}>
                        {student.examType}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {student.name}
                    </h2>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {student.examType === 'LGS' ? 'LGS Sınav Öncesi Hazırlık' : 'YKS / TYT-AYT Sayısal'}
                    </p>

                    {/* Giriş ok işareti */}
                    <div className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      <span className="text-sm font-medium">Dashboard'a git</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-12 text-center text-slate-600 dark:text-slate-500 text-sm animate-fade-in">
            <p>🎯 Düzenli çalış, hedefine ulaş!</p>
          </div>
        </div>

        {/* Tema değiştirme butonu */}
        <button
          onClick={toggleTheme}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Tema değiştir"
        >
          {theme === 'dark' ? (
            <svg className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-slate-700 group-hover:-rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
  );
}
