// Autor: David Assef
// Descrição: Testes E2E de fumaça com Playwright (abre rotas principais)
// Data: 07-09-2025
// MIT License

import { test, expect } from '@playwright/test';

// Bypass de autenticação para E2E (somente em dev/test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('e2e_bypass_auth', '1'); } catch {}
  });
});

// Abre a página de Recibos e valida título
test('Recibos: página carrega e exibe título', async ({ page }) => {
  await page.goto('/recibos');
  // Aguarda loader global desaparecer, se presente
  const loadingText = page.getByText('Carregando').first();
  await loadingText.waitFor({ state: 'detached', timeout: 5000 }).catch(async () => {
    await expect(loadingText).toBeHidden({ timeout: 5000 });
  });
  await expect(page.getByRole('heading', { name: /recibos/i })).toBeVisible();
});

// Abre a página de Contratos e valida título
test('Contratos: página carrega e exibe título', async ({ page }) => {
  await page.goto('/contratos');
  // Aguarda loader global desaparecer, se presente
  const loadingText = page.getByText('Carregando').first();
  await loadingText.waitFor({ state: 'detached', timeout: 5000 }).catch(async () => {
    await expect(loadingText).toBeHidden({ timeout: 5000 });
  });
  await expect(page.getByRole('heading', { name: /contratos/i })).toBeVisible();
});
