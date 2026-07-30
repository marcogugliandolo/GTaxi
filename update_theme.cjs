const fs = require('fs');

let content = fs.readFileSync('src/contexts/ThemeContext.tsx', 'utf8');
content = content.replace(
  "    if (savedTheme) {\n      setTheme(savedTheme);\n    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {\n      setTheme('dark');\n    }",
  "    if (savedTheme) {\n      setTheme(savedTheme);\n    }\n    // Default to light mode as requested, ignoring system preference"
);
fs.writeFileSync('src/contexts/ThemeContext.tsx', content);
console.log('Theme updated');
