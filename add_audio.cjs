const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  "  return (\n    <div className=\"fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60  p-4\">",
  "  return (\n    <div className=\"fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60  p-4\">\n      <audio ref={audioRef} src=\"https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3\" preload=\"auto\" />"
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
