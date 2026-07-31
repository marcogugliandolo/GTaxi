const fs = require('fs');
let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';");

content = content.replace("export default function BookingWizard() {", "export default function BookingWizard() {\n  const navigate = useNavigate();");

content = content.replace(/setShowAdmin\(true\)/g, "navigate('/admin')");
content = content.replace(/const \[showAdmin, setShowAdmin\] = useState\(false\);/g, "");

content = content.replace(/\{showAdmin && \(\n\s*<React\.Suspense fallback=\{<div className="fixed inset-0 z-50 bg-slate-900\/50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"><\/div><\/div>\}>\n\s*<AdminPanel[\s\S]*?<\/React\.Suspense>\n\s*\)\}/g, "");

fs.writeFileSync('src/components/BookingWizard.tsx', content);
