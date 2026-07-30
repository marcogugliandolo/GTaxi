const { execSync } = require('child_process');
execSync('npm run build');
const css = fs.readFileSync('dist/assets/index-DALs6jNT.css', 'utf8'); // Wait, the filename might be different. Let's just grep the css files
