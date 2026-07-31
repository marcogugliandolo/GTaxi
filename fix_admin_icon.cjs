const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  '<div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-700 dark:text-slate-200">\n              <Lock className="w-8 h-8" />\n            </div>',
  `<div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full bg-[#FFD700] rounded-3xl flex items-center justify-center shadow-lg">
                <Car className="w-10 h-10 text-black" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900">
                <Shield className="w-4 h-4 text-white dark:text-slate-900" />
              </div>
            </div>`
);

content = content.replace(
  "import { X, Lock, Settings, Save, LogOut, List, Check, Ban, User, Car, Home } from 'lucide-react';",
  "import { X, Lock, Settings, Save, LogOut, List, Check, Ban, User, Car, Home, Shield } from 'lucide-react';"
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Icon updated');
