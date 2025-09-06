// Autor: David Assef
// Descrição: Configuração do Vitest para testes unitários (ambiente Node) no frontend
// Data: 05-09-2025
// MIT License

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/unit/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src/test/integration/**'],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    deps: {
      // Evitar transformações complexas; estes módulos são mockados nos testes
      inline: ['jspdf', 'qrcode', '@supabase/supabase-js'],
    },
  },
});
