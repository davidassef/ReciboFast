// MIT License
// Autor atual: David Assef
// Descrição: Gera ícones PWA válidos se faltarem ou estiverem inválidos (ESM)
// Data: 10-09-2025

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
let sharp = null;
let PNG = null;
try {
  // Import dinâmico para não quebrar caso sharp não esteja instalado
  sharp = (await import('sharp')).default;
} catch {}
try {
  // Fallback: gerar PNGs via pngjs
  PNG = (await import('pngjs')).PNG;
} catch {}

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

(async function main() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  if (sharp) {
    // Gera imagens a partir de um SVG simples com as iniciais "RF"
    const svgTemplate = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="${Math.round(size*0.18)}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" fill="#ffffff" font-size="${Math.round(size*0.4)}">RF</text>
  <rect x="${Math.round(size*0.08)}" y="${Math.round(size*0.76)}" width="${Math.round(size*0.84)}" height="${Math.round(size*0.12)}" rx="${Math.round(size*0.06)}" fill="rgba(255,255,255,0.15)"/>
  <rect x="${Math.round(size*0.08)}" y="${Math.round(size*0.14)}" width="${Math.round(size*0.5)}" height="${Math.round(size*0.08)}" rx="${Math.round(size*0.04)}" fill="rgba(255,255,255,0.18)"/>
  <rect x="${Math.round(size*0.08)}" y="${Math.round(size*0.26)}" width="${Math.round(size*0.34)}" height="${Math.round(size*0.06)}" rx="${Math.round(size*0.03)}" fill="rgba(255,255,255,0.12)"/>
  <rect x="${Math.round(size*0.58)}" y="${Math.round(size*0.26)}" width="${Math.round(size*0.12)}" height="${Math.round(size*0.06)}" rx="${Math.round(size*0.03)}" fill="rgba(255,255,255,0.12)"/>
  <rect x="${Math.round(size*0.74)}" y="${Math.round(size*0.26)}" width="${Math.round(size*0.18)}" height="${Math.round(size*0.06)}" rx="${Math.round(size*0.03)}" fill="rgba(255,255,255,0.12)"/>
  <circle cx="${Math.round(size*0.86)}" cy="${Math.round(size*0.14)}" r="${Math.round(size*0.04)}" fill="#22c55e"/>
  <circle cx="${Math.round(size*0.92)}" cy="${Math.round(size*0.14)}" r="${Math.round(size*0.04)}" fill="#f59e0b"/>
  <circle cx="${Math.round(size*0.80)}" cy="${Math.round(size*0.14)}" r="${Math.round(size*0.04)}" fill="#ef4444"/>
  <rect x="${Math.round(size*0.08)}" y="${Math.round(size*0.42)}" width="${Math.round(size*0.84)}" height="${Math.round(size*0.02)}" fill="rgba(255,255,255,0.25)"/>
</svg>`;
    const out192 = path.join(publicDir, 'pwa-192x192.png');
    const out512 = path.join(publicDir, 'pwa-512x512.png');
    const svg192 = Buffer.from(svgTemplate(192));
    const svg512 = Buffer.from(svgTemplate(512));
    await sharp(svg192).png({ compressionLevel: 9 }).toFile(out192);
    await sharp(svg512).png({ compressionLevel: 9 }).toFile(out512);
    console.log('[generateIcons] ícones gerados com sharp');
  } else if (PNG) {
    // Fallback: gera PNGs sólidos válidos nas dimensões exatas usando pngjs
    const out192 = path.join(publicDir, 'pwa-192x192.png');
    const out512 = path.join(publicDir, 'pwa-512x512.png');

    const makePng = (size, color = { r: 37, g: 99, b: 235, a: 255 }) => {
      const png = new PNG({ width: size, height: size });
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (size * y + x) << 2;
          png.data[idx] = color.r;
          png.data[idx + 1] = color.g;
          png.data[idx + 2] = color.b;
          png.data[idx + 3] = color.a;
        }
      }
      return PNG.sync.write(png);
    };

    fs.writeFileSync(out192, makePng(192));
    fs.writeFileSync(out512, makePng(512));
    console.log('[generateIcons] ícones gerados com pngjs');
  } else {
    writeIfNeeded(path.join(publicDir, 'pwa-192x192.png'), PNG_192_BASE64);
    writeIfNeeded(path.join(publicDir, 'pwa-512x512.png'), PNG_512_BASE64);
    console.log('[generateIcons] sharp/pngjs indisponíveis — usando fallback base64');
  }

  // favicon.svg simples com mesma identidade visual
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" fill="#fff" font-size="26">RF</text>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), Buffer.from(faviconSvg));
  console.log('[generateIcons] favicon.svg gerado');

  // manifest.webmanifest mínimo apontando para os ícones gerados
  const manifest = {
    name: 'ReciboFast',
    short_name: 'ReciboFast',
    description: 'Gestão de contratos, recibos e assinaturas',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
  fs.writeFileSync(
    path.join(publicDir, 'manifest.webmanifest'),
    Buffer.from(JSON.stringify(manifest, null, 2))
  );
  console.log('[generateIcons] manifest.webmanifest gerado');
})();
