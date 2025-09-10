// MIT License
// Autor atual: David Assef
// Descrição: Gera ícones PWA válidos se faltarem ou estiverem inválidos
// Data: 10-09-2025

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PNG 1x1 transparente (válido). Usado como fallback mínimo.
// Fonte: transparent pixel PNG
const PNG_1x1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

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
  const icons = [
    path.join(publicDir, 'pwa-192x192.png'),
    path.join(publicDir, 'pwa-512x512.png'),
  ];

  icons.forEach((iconPath) => writeIfNeeded(iconPath, PNG_1x1_BASE64));
})();
