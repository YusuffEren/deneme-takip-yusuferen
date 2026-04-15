// ============================================
// Layout - Sidebar + Header bileşeni
// Tüm dashboard sayfalarını sarar
// ============================================

import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStudent } from '../api/client';

export default function Layout({ children, studentId: propStudentId }) {
  const params = useParams();
  const studentId = propStudentId || params.studentId;
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (studentId) {
      getStudent(studentId)
        .then(res => setStudent(res.data))
        .catch(console.error);
    }
  }, [studentId]);

  const examTypeLabel = student?.examType === 'LGS' ? 'LGS' : 'TYT / AYT Sayısal';

  const navItems = [
    {
      to: `/dashboard/${studentId}`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Dashboard',
    },
    {
      to: `/exam/new/${studentId}`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 4v16m8-8H4" />
        </svg>
      ),
      label: 'Yeni Deneme',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 text-slate-900 dark:text-white">
        {/* Mobile menu overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-white/5">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 group w-full text-left">
              <span className="text-2xl">📊</span>
              <span className="text-lg font-bold gradient-text group-hover:opacity-80 transition-opacity">
                Deneme Takip
              </span>
            </button>
          </div>

          {/* Profil bilgisi */}
          {student && (
            <div className="px-5 py-4 mx-3 mt-4 glass-card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{student.avatar}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{student.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{examTypeLabel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigasyon */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Profil değiştir ve Tema Simgesi */}
          <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all duration-300 group"
            >
              {theme === 'dark' ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Aydınlık Tema</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  </div>
                  <span>Karanlık Tema</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil Değiştir
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Mobile header */}
          <div className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-3 py-2.5 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-800 dark:text-white p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold gradient-text text-sm">Deneme Takip</span>
            {student && <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{student.name}</span>}
          </div>

          {/* Page content */}
          <div className="p-3 sm:p-4 md:p-8">
            {children}
          </div>
        </main>
    </div>
  );
}
