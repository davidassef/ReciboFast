// MIT License
// Autor atual: David Assef
// Descrição: Verifica variáveis obrigatórias para o build do frontend (Vercel/produção)
// Data: 08-09-2025

/*
  Este script falha o build caso a variável VITE_HCAPTCHA_SITE_KEY não esteja definida
  no ambiente de build (ex.: Vercel/CI). Em desenvolvimento local (npm run dev), este
  script não é executado, pois está anexado ao prebuild.
*/

function fail(msg) {
  console.error(`\n[checkEnv] ERRO: ${msg}\n`);
  process.exit(1);
}

const isCI = process.env.CI === 'true' || !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const siteKey = process.env.VITE_HCAPTCHA_SITE_KEY;

if (isCI) {
  if (!siteKey || String(siteKey).trim() === '') {
    fail('VITE_HCAPTCHA_SITE_KEY ausente no ambiente de build. Configure no Vercel (Project > Settings > Environment Variables) e redeploy.');
  }
}

console.log('[checkEnv] OK: Variáveis obrigatórias presentes.');
