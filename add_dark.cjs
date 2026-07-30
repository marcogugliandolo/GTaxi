const fs = require('fs');

function processFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Basic color replacements
  content = content.replace(/bg-white(?!\/)/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/bg-slate-50(?!\/)/g, 'bg-slate-50 dark:bg-slate-800/50');
  content = content.replace(/bg-slate-100(?!\/)/g, 'bg-slate-100 dark:bg-slate-800');
  content = content.replace(/bg-slate-200(?!\/)/g, 'bg-slate-200 dark:bg-slate-700');
  
  content = content.replace(/text-slate-900/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-200');
  content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
  
  content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-700');
  content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-700');
  
  // Clean up any double spaces that might occur if we replace multiple things (like `text-slate-900 dark:text-white dark:text-white`)
  // Not strictly necessary but good. Let's just do a naive replace first.

  fs.writeFileSync(filename, content);
}

processFile('src/components/BookingWizard.tsx');
processFile('src/components/AdminPanel.tsx');
processFile('src/components/AddressInput.tsx');

console.log("Added basic dark classes");
