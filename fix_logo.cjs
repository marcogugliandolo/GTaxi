const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  '<div className="relative w-20 h-20 mx-auto mb-6">\n              <div className="w-full h-full bg-[#FFD700] rounded-3xl flex items-center justify-center shadow-lg">\n                <CarFront className="w-10 h-10 text-black" />\n              </div>\n              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900">\n                <Shield className="w-4 h-4 text-white dark:text-slate-900" />\n              </div>\n            </div>',
  `<div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full bg-[#FFD700] rounded-[1.5rem] flex items-center justify-center shadow-[0_8px_32px_rgba(255,215,0,0.4)]">
                <CarFront className="w-10 h-10 text-slate-900 dark:text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-xl border-[3px] border-white dark:border-slate-900">
                <Shield className="w-4 h-4 text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
            </div>`
);

// We should also ensure the strokeWidth and text colors match the app logo elsewhere in AdminPanel if needed.
// E.g., the top-left sidebar header:
content = content.replace(
  '<div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-sm">\n              <CarFront className="w-5 h-5 text-black" />\n            </div>',
  `<div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(255,215,0,0.3)] relative">
              <CarFront className="w-5 h-5 text-slate-900 dark:text-white" strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center border-2 border-white dark:border-slate-900">
                <Shield className="w-2.5 h-2.5 text-white dark:text-slate-900" strokeWidth={3} />
              </div>
            </div>`
);

// Mobile header logo
content = content.replace(
  '<CarFront className="w-5 h-5 text-[#FFD700]" /> GTaxi Admin',
  '<CarFront className="w-5 h-5 text-[#FFD700]" strokeWidth={2.5} /> GTaxi Admin'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Logo fixed');
