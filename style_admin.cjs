const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  '<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60  p-4">',
  '<div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 overflow-y-auto items-center justify-center">'
);

content = content.replace(
  '<div className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${isAuthenticated ? \'max-w-2xl\' : \'max-w-md\'} shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]`}>',
  '<div className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${isAuthenticated ? \'max-w-5xl\' : \'max-w-md\'} shadow-2xl overflow-hidden relative flex flex-col ${isAuthenticated ? \'h-[85vh]\' : \'\'} border border-slate-100 dark:border-slate-800`}>'
);

// We need a home button instead of an X button
content = content.replace(
  '<X className="w-5 h-5" />',
  '<span className="font-bold">Volver al Inicio</span>'
);
content = content.replace(
  'className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors z-10"',
  'className="absolute top-4 right-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors z-10"'
);


fs.writeFileSync('src/components/AdminPanel.tsx', content);
