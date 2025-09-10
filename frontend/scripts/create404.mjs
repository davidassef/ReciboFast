// MIT License
// Autor atual: David Assef
// Descrição: Cria dist/404.html a partir de dist/index.html para fallback SPA no Vercel
// Data: 10-09-2025

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

try {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`);
  }
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in dist: ${indexPath}`);
  }
  const html = fs.readFileSync(indexPath);
  fs.writeFileSync(notFoundPath, html);
  console.log(`[create404] 404.html created at ${notFoundPath}`);
} catch (e) {
  console.error('[create404] failed:', e);
  process.exit(1);
}
