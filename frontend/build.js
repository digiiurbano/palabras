import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath);
}

// Copy src to dist/src
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(__dirname, 'src'), path.join(distPath, 'src'));

// Replace import.meta.env.VITE_API_URL in dist/src/db.js
const dbFile = path.join(distPath, 'src', 'db.js');
if (fs.existsSync(dbFile)) {
  let content = fs.readFileSync(dbFile, 'utf8');
  const apiUrl = process.env.VITE_API_URL || '';
  // Reemplazamos `import.meta.env.VITE_API_URL` por la URL de producción (o undefined)
  content = content.replace(/import\.meta\.env\.VITE_API_URL/g, apiUrl ? `'${apiUrl}'` : 'undefined');
  fs.writeFileSync(dbFile, content);
  console.log('Replaced VITE_API_URL in dist/src/db.js');
}
