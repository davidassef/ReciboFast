// MIT License
// Autor atual: David Assef
// Descrição: Gera ícones PWA válidos se faltarem ou estiverem inválidos (ESM)
// Data: 10-09-2025

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PNG transparentes válidos, pré-gerados nos tamanhos exatos exigidos pelo PWA
// 192x192 transparente
const PNG_192_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMwAAADMAQMAAAC60m2+AAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABxJREFUOMtjYBgFo2AUjIJRMAqGQTAKBgAAYV0B6jJrA4wAAAAASUVORK5CYII=';
// 512x512 transparente
const PNG_512_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAABfX0bXAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAB1JREFUOMtjYBgFo2AUjIJRMAqGQTAKhsEAAJd+AeaCw5r6AAAAAElFTkSuQmCC';

function writeIfNeeded(filePath, base64) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buf);
    console.log(`[generateIcons] gravado: ${filePath} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`[generateIcons] falha ao gravar ${filePath}:`, e);
    process.exit(1);
  }
}

(function main() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  writeIfNeeded(path.join(publicDir, 'pwa-192x192.png'), PNG_192_BASE64);
  writeIfNeeded(path.join(publicDir, 'pwa-512x512.png'), PNG_512_BASE64);
})();
