// Autor: David
// Descrição: Configuração Vite para o frontend do ReciboFast, incluindo plugins para React e PWA.
// Data: 04-09-2025
// Licença: MIT License

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Garante injeção explícita da variável em tempo de build (fallback para ambientes CI como Vercel)
  define: {
    'import.meta.env.VITE_HCAPTCHA_SITE_KEY': JSON.stringify(process.env.VITE_HCAPTCHA_SITE_KEY || ''),
  },
  server: {
    proxy: {
      // Proxy para API em desenvolvimento: evita CORS
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // sem rewrite: já usamos caminho base '/api/v1' no cliente
      },
      // Healthcheck do backend
      '/healthz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'ReciboFast',
        short_name: 'ReciboFast',
        description: 'Sistema de gestão de receitas, contratos e recibos',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          // Backend do app (proxy /api em dev, backend real em prod)
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-api-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
            }
          },
          // Supabase: evitar cache para endpoints de auth
          {
            urlPattern: ({ url }) => /supabase\.co\/auth\//.test(url.href),
            handler: 'NetworkOnly',
          },
          // Supabase rest/storage (pode usar NetworkFirst com TTL curto)
          {
            urlPattern: ({ url }) => /supabase\.co\/(rest|storage)\//.test(url.href),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
            }
          }
        ]
      }
    }),
    tsconfigPaths()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})

