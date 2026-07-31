const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  '<CarFront className="w-5 h-5 text-[#FFD700]" strokeWidth={2.5} /> GTaxi Admin',
  `<div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center shadow-sm relative mr-1">
              <CarFront className="w-4 h-4 text-slate-900 dark:text-white" strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-900 dark:bg-white rounded flex items-center justify-center border-[1.5px] border-white dark:border-slate-900">
                <Shield className="w-2 h-2 text-white dark:text-slate-900" strokeWidth={3} />
              </div>
            </div> GTaxi Admin`
);

content = content.replace(
  '<div className="md:hidden h-16',
  '<div className="md:hidden flex-shrink-0 h-16'
);

content = content.replace(
  '<div className="md:hidden flex bg-white',
  '<div className="md:hidden flex-shrink-0 flex bg-white'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Mobile header fixed');
