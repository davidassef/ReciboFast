// Autor: David Assef
// Descrição: Configuração do Playwright para testes E2E do frontend
// Data: 07-09-2025
// MIT License

/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: isCI ? 'npm run preview' : 'npm run dev',
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !isCI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
