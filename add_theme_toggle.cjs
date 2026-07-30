const fs = require('fs');

let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

// Add imports
if (!content.includes('Moon, Sun')) {
  content = content.replace("import { ", "import { Moon, Sun, ");
}
if (!content.includes('useTheme')) {
  content = content.replace("import { useLanguage } from '../contexts/LanguageContext';", "import { useLanguage } from '../contexts/LanguageContext';\nimport { useTheme } from '../contexts/ThemeContext';");
}

// Add hook
if (!content.includes('const { theme, toggleTheme } = useTheme();')) {
  content = content.replace(
    'const { t, language, setLanguage } = useLanguage();',
    'const { t, language, setLanguage } = useLanguage();\n  const { theme, toggleTheme } = useTheme();'
  );
}

// Add button next to language button
const langBtn = `<button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} className="absolute top-4 right-4 md:right-8 z-[60] bg-white dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm shadow-md hover:bg-white dark:bg-slate-900 transition-colors flex items-center gap-2">`;
if (content.includes("bg-white/90 backdrop-blur-md px-3 py-1.5")) {
  // It looks like the earlier sed replaced bg-black/5... let's just find the button
  content = content.replace(
    /<button onClick={\(\) => setLanguage[\s\S]*?<\/button>/,
    `<div className="absolute top-4 right-4 md:right-8 z-[60] flex items-center gap-3">
        <button onClick={toggleTheme} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          <span className={language === 'es' ? 'opacity-100' : 'opacity-50'}>ES</span>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
          <span className={language === 'en' ? 'opacity-100' : 'opacity-50'}>EN</span>
        </button>
      </div>`
  );
}

// Fix App.tsx bg color to include dark:bg-slate-950
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace('bg-white', 'bg-slate-50 dark:bg-slate-950');
fs.writeFileSync('src/App.tsx', appContent);

fs.writeFileSync('src/components/BookingWizard.tsx', content);
console.log('Added theme toggle');
