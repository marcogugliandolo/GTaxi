import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function GlobalControls() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (location.pathname === '/admin') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 md:right-8 z-[100] flex items-center gap-3">
      <button onClick={toggleTheme} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-1.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-0.5">
        <button 
          onClick={() => setLanguage('es')} 
          className={`px-2 py-1 rounded-full font-bold text-xs transition-all ${language === 'es' ? 'bg-[#FFD700] text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          ES
        </button>
        <button 
          onClick={() => setLanguage('gl')} 
          className={`px-2 py-1 rounded-full font-bold text-xs transition-all ${language === 'gl' ? 'bg-[#FFD700] text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          GL
        </button>
        <button 
          onClick={() => setLanguage('en')} 
          className={`px-2 py-1 rounded-full font-bold text-xs transition-all ${language === 'en' ? 'bg-[#FFD700] text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
