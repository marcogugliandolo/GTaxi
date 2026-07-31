import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import BookingWizard from './components/BookingWizard';
import AdminPanel from './components/AdminPanel';
import { useLanguage } from './contexts/LanguageContext';

function Splash({ loading }: { loading: boolean }) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950"
        >
          <motion.svg
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
            width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-900 dark:text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
            <rect x="10" y="5" width="4" height="2" rx="0.5" fill="#FFD700" stroke="none" />
          </motion.svg>
          
          <div className="w-[200px] h-1 bg-slate-200 mt-3 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 bottom-0 w-1/2 bg-[#FFD700]"
              animate={{ left: ['-50%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
          
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="mt-6 font-sans text-sm text-slate-500 font-bold tracking-[2px] uppercase"
          >
            {t("loading")}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MainApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-[#FFD700]/30 relative overflow-x-hidden">
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/" element={<BookingWizard />} />
        <Route path="*" element={<BookingWizard />} />
      </Routes>
      <Splash loading={loading} />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <MainApp />
    </HashRouter>
  );
}
