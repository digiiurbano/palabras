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

// Replace import.meta.env.VITE_API_URL in dist/js/db.js
const dbFile = path.join(distPath, 'js', 'db.js');
if (fs.existsSync(dbFile)) {
  let content = fs.readFileSync(dbFile, 'utf8');
  const apiUrl = process.env.VITE_API_URL || '';
  // Reemplazamos `window.VITE_API_URL` por la URL de producción (o undefined)
  content = content.replace(/window\.VITE_API_URL/g, apiUrl ? `'${apiUrl}'` : 'undefined');
  fs.writeFileSync(dbFile, content);
  console.log('Replaced VITE_API_URL in dist/js/db.js');
}
