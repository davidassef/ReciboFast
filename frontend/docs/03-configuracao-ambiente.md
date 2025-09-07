# MIT License
# Autor atual: David Assef
# Descrição: 03 configuracao ambiente
# Data: 07-09-2025

# ⚙️ Configuração e Ambiente - Frontend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha as configurações de ambiente, variáveis de ambiente, ferramentas de desenvolvimento e setup necessário para o frontend do ReciboFast.

## 🌍 Variáveis de Ambiente

### 📄 **Arquivo `.env.example`**

```bash
# =============================================================================
# CONFIGURAÇÕES DO FRONTEND - RECIBOFAST
# =============================================================================
# Autor: David Assef
# Data: 29-08-2025
# Licença: MIT License

# -----------------------------------------------------------------------------
# SUPABASE CONFIGURATION
# -----------------------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# -----------------------------------------------------------------------------
# API CONFIGURATION
# -----------------------------------------------------------------------------
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=30000

# -----------------------------------------------------------------------------
# APPLICATION CONFIGURATION
# -----------------------------------------------------------------------------
VITE_APP_NAME="ReciboFast"
VITE_APP_VERSION="1.0.0"
VITE_APP_DESCRIPTION="Sistema de Gestão de Receitas"
VITE_APP_URL=http://localhost:5173

# -----------------------------------------------------------------------------
# ENVIRONMENT SETTINGS
# -----------------------------------------------------------------------------
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# -----------------------------------------------------------------------------
# PWA CONFIGURATION
# -----------------------------------------------------------------------------
VITE_PWA_ENABLED=true
VITE_PWA_CACHE_NAME="recibofast-cache-v1"
VITE_PWA_OFFLINE_ENABLED=true

# -----------------------------------------------------------------------------
# SECURITY CONFIGURATION
# -----------------------------------------------------------------------------
VITE_ENABLE_HTTPS=false
VITE_CORS_ENABLED=true
VITE_CSP_ENABLED=true

# -----------------------------------------------------------------------------
# ANALYTICS & MONITORING
# -----------------------------------------------------------------------------
VITE_ANALYTICS_ENABLED=false
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=
VITE_HOTJAR_ID=

# -----------------------------------------------------------------------------
# FEATURE FLAGS
# -----------------------------------------------------------------------------
VITE_FEATURE_DARK_MODE=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_OFFLINE_MODE=true
VITE_FEATURE_EXPORT_PDF=true
VITE_FEATURE_BULK_OPERATIONS=true

# -----------------------------------------------------------------------------
# DEVELOPMENT TOOLS
# -----------------------------------------------------------------------------
VITE_DEVTOOLS_ENABLED=true
VITE_MOCK_API=false
VITE_STORYBOOK_ENABLED=true

# -----------------------------------------------------------------------------
# PERFORMANCE SETTINGS
# -----------------------------------------------------------------------------
VITE_LAZY_LOADING=true
VITE_IMAGE_OPTIMIZATION=true
VITE_BUNDLE_ANALYZER=false

# -----------------------------------------------------------------------------
# LOCALIZATION
# -----------------------------------------------------------------------------
VITE_DEFAULT_LOCALE=pt-BR
VITE_SUPPORTED_LOCALES=pt-BR,en-US
VITE_TIMEZONE=America/Sao_Paulo
```

### 🔧 **Configuração de Ambiente em TypeScript**

```typescript
// src/config/env.ts
interface EnvironmentConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // API
  api: {
    baseUrl: string;
    timeout: number;
  };
  
  // Application
  app: {
    name: string;
    version: string;
    description: string;
    url: string;
  };
  
  // Environment
  env: {
    nodeEnv: 'development' | 'production' | 'test';
    debug: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // PWA
  pwa: {
    enabled: boolean;
    cacheName: string;
    offlineEnabled: boolean;
  };
  
  // Security
  security: {
    enableHttps: boolean;
    corsEnabled: boolean;
    cspEnabled: boolean;
  };
  
  // Analytics
  analytics: {
    enabled: boolean;
    googleAnalyticsId?: string;
    sentryDsn?: string;
    hotjarId?: string;
  };
  
  // Feature Flags
  features: {
    darkMode: boolean;
    notifications: boolean;
    offlineMode: boolean;
    exportPdf: boolean;
    bulkOperations: boolean;
  };
  
  // Development
  dev: {
    devtoolsEnabled: boolean;
    mockApi: boolean;
    storybookEnabled: boolean;
  };
  
  // Performance
  performance: {
    lazyLoading: boolean;
    imageOptimization: boolean;
    bundleAnalyzer: boolean;
  };
  
  // Localization
  localization: {
    defaultLocale: string;
    supportedLocales: string[];
    timezone: string;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Variável de ambiente ${key} não encontrada`);
  }
  return value;
};

const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Variável de ambiente ${key} deve ser um número`);
  }
  return parsed;
};

export const config: EnvironmentConfig = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080/api'),
    timeout: getNumberEnvVar('VITE_API_TIMEOUT', 30000),
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', 'ReciboFast'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    description: getEnvVar('VITE_APP_DESCRIPTION', 'Sistema de Gestão de Receitas'),
    url: getEnvVar('VITE_APP_URL', 'http://localhost:5173'),
  },
  
  env: {
    nodeEnv: (getEnvVar('VITE_NODE_ENV', 'development') as any),
    debug: getBooleanEnvVar('VITE_DEBUG', true),
    logLevel: (getEnvVar('VITE_LOG_LEVEL', 'debug') as any),
  },
  
  pwa: {
    enabled: getBooleanEnvVar('VITE_PWA_ENABLED', true),
    cacheName: getEnvVar('VITE_PWA_CACHE_NAME', 'recibofast-cache-v1'),
    offlineEnabled: getBooleanEnvVar('VITE_PWA_OFFLINE_ENABLED', true),
  },
  
  security: {
    enableHttps: getBooleanEnvVar('VITE_ENABLE_HTTPS', false),
    corsEnabled: getBooleanEnvVar('VITE_CORS_ENABLED', true),
    cspEnabled: getBooleanEnvVar('VITE_CSP_ENABLED', true),
  },
  
  analytics: {
    enabled: getBooleanEnvVar('VITE_ANALYTICS_ENABLED', false),
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    hotjarId: import.meta.env.VITE_HOTJAR_ID,
  },
  
  features: {
    darkMode: getBooleanEnvVar('VITE_FEATURE_DARK_MODE', true),
    notifications: getBooleanEnvVar('VITE_FEATURE_NOTIFICATIONS', true),
    offlineMode: getBooleanEnvVar('VITE_FEATURE_OFFLINE_MODE', true),
    exportPdf: getBooleanEnvVar('VITE_FEATURE_EXPORT_PDF', true),
    bulkOperations: getBooleanEnvVar('VITE_FEATURE_BULK_OPERATIONS', true),
  },
  
  dev: {
    devtoolsEnabled: getBooleanEnvVar('VITE_DEVTOOLS_ENABLED', true),
    mockApi: getBooleanEnvVar('VITE_MOCK_API', false),
    storybookEnabled: getBooleanEnvVar('VITE_STORYBOOK_ENABLED', true),
  },
  
  performance: {
    lazyLoading: getBooleanEnvVar('VITE_LAZY_LOADING', true),
    imageOptimization: getBooleanEnvVar('VITE_IMAGE_OPTIMIZATION', true),
    bundleAnalyzer: getBooleanEnvVar('VITE_BUNDLE_ANALYZER', false),
  },
  
  localization: {
    defaultLocale: getEnvVar('VITE_DEFAULT_LOCALE', 'pt-BR'),
    supportedLocales: getEnvVar('VITE_SUPPORTED_LOCALES', 'pt-BR,en-US').split(','),
    timezone: getEnvVar('VITE_TIMEZONE', 'America/Sao_Paulo'),
  },
};

// Validação de configuração
export const validateConfig = (): void => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`
    );
  }
  
  // Validações específicas
  if (!config.supabase.url.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL deve começar com https://');
  }
  
  if (config.api.timeout < 1000) {
    throw new Error('VITE_API_TIMEOUT deve ser pelo menos 1000ms');
  }
};

// Executar validação na inicialização
if (config.env.nodeEnv !== 'test') {
  validateConfig();
}
```

### 🔄 **Hook para Configuração**

```typescript
// src/hooks/useConfig.ts
import { config } from '@/config/env';

export const useConfig = () => {
  return {
    config,
    
    // Helpers
    isDevelopment: config.env.nodeEnv === 'development',
    isProduction: config.env.nodeEnv === 'production',
    isTest: config.env.nodeEnv === 'test',
    
    // Feature flags
    isFeatureEnabled: (feature: keyof typeof config.features): boolean => {
      return config.features[feature];
    },
    
    // API helpers
    getApiUrl: (endpoint: string): string => {
      return `${config.api.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    },
    
    // Supabase helpers
    getSupabaseConfig: () => ({
      url: config.supabase.url,
      key: config.supabase.anonKey,
    }),
  };
};
```

## 🛠️ Configuração de Ferramentas

### ⚡ **Vite Configuration**

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Configurações do React
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      
      // PWA Plugin
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: env.VITE_APP_NAME || 'ReciboFast',
          short_name: 'ReciboFast',
          description: env.VITE_APP_DESCRIPTION || 'Sistema de Gestão de Receitas',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      
      // Bundle Analyzer (apenas em desenvolvimento)
      ...(env.VITE_BUNDLE_ANALYZER === 'true' ? [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ] : []),
    ],
    
    // Aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@services': resolve(__dirname, './src/services'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@assets': resolve(__dirname, './src/assets'),
        '@config': resolve(__dirname, './src/config'),
      },
    },
    
    // Servidor de desenvolvimento
    server: {
      port: 5173,
      host: true,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Preview server
    preview: {
      port: 4173,
      host: true,
    },
    
    // Build configuration
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['@headlessui/react', '@heroicons/react'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    
    // Otimizações
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@headlessui/react',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
      ],
    },
    
    // Definir variáveis globais
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  };
});
```

### 📝 **TypeScript Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@assets/*": ["./src/assets/*"],
      "@config/*": ["./src/config/*"]
    },
    
    /* Type definitions */
    "types": ["vite/client", "node", "@testing-library/jest-dom"]
  },
  "include": [
    "src",
    "tests",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ],
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js"
  ]
}
```

### 🎨 **Tailwind CSS Configuration**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cores do brand
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};
```

### 📦 **PostCSS Configuration**

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: 'default',
      },
    } : {}),
  },
};
```

### 🧹 **ESLint Configuration**

```json
// .eslintrc.json
{
  "root": true,
  "env": {
    "browser": true,
    "es2020": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "react-hooks/exhaustive-deps",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  "ignorePatterns": [
    "dist",
    ".eslintrc.cjs",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "react",
    "react-hooks",
    "react-refresh",
    "@typescript-eslint",
    "jsx-a11y",
    "import"
  ],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-noninteractive-element-interactions": "warn",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "import/no-unresolved": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true
      }
    }
  }
}
```

### 💅 **Prettier Configuration**

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```
# .prettierignore
dist
build
node_modules
*.min.js
*.min.css
public
coverage
.next
.nuxt
.vuepress/dist
.serverless
.fusebox
.dynamodb
.tern-port
.vscode-test
.nyc_output
lib-cov
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pids
*.pid
*.seed
*.pid.lock
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🌍 Ambientes de Execução

### 🔧 **Development Environment**

```bash
# Configuração para desenvolvimento
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
VITE_DEVTOOLS_ENABLED=true
VITE_MOCK_API=false
VITE_BUNDLE_ANALYZER=false

# Scripts de desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run dev:host     # Servidor acessível na rede
npm run dev:debug    # Modo debug ativado
npm run dev:mock     # Com API mockada
```

### 🧪 **Testing Environment**

```bash
# Configuração para testes
VITE_NODE_ENV=test
VITE_DEBUG=false
VITE_LOG_LEVEL=error
VITE_MOCK_API=true
VITE_ANALYTICS_ENABLED=false

# Scripts de teste
npm run test              # Executar testes
npm run test:watch        # Modo watch
npm run test:coverage     # Com cobertura
npm run test:ui           # Interface gráfica
```

### 🚀 **Production Environment**

```bash
# Configuração para produção
VITE_NODE_ENV=production
VITE_DEBUG=false
VITE_LOG_LEVEL=error
VITE_DEVTOOLS_ENABLED=false
VITE_ANALYTICS_ENABLED=true
VITE_PWA_ENABLED=true

# Scripts de produção
npm run build            # Build de produção
npm run preview          # Preview do build
npm run build:analyze    # Com análise de bundle
```

## 🔒 Configurações de Segurança

### 🛡️ **Content Security Policy**

```typescript
// src/utils/security.ts
export const generateCSP = (): string => {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  
  return policies.join('; ');
};

// Aplicar CSP no index.html
export const applySecurityHeaders = (): void => {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSP();
    document.head.appendChild(meta);
  }
};
```

### 🔐 **Environment Validation**

```typescript
// src/utils/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('URL do Supabase inválida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Chave anônima do Supabase obrigatória'),
  VITE_API_BASE_URL: z.string().url('URL da API inválida'),
  VITE_NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const validateEnvironment = (): void => {
  try {
    envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n');
      
      throw new Error(`Configuração de ambiente inválida:\n${issues}`);
    }
    throw error;
  }
};
```

## 📊 Monitoramento e Logging

### 📝 **Sistema de Logging**

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  
  constructor(level: LogLevel = 'info') {
    this.level = level;
    this.isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
  
  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
    
    const formattedMessage = this.formatMessage(entry);
    
    // Console output
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, error);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage, error);
        break;
      case 'error':
        console.error(formattedMessage, error);
        break;
    }
    
    // Enviar para serviço de logging em produção
    if (!this.isDevelopment && level === 'error') {
      this.sendToLoggingService(entry);
    }
  }
  
  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    try {
      // Implementar envio para Sentry, LogRocket, etc.
      if (import.meta.env.VITE_SENTRY_DSN) {
        // Sentry.captureException(entry.error || new Error(entry.message));
      }
    } catch (error) {
      console.error('Erro ao enviar log:', error);
    }
  }
  
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('warn', message, context, error);
  }
  
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger(
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info'
);
```

## ✅ Checklist de Configuração

### 🎯 **Configuração Básica**

- [x] Variáveis de ambiente configuradas
- [x] Vite configurado com plugins necessários
- [x] TypeScript configurado com paths
- [x] Tailwind CSS configurado com tema customizado
- [x] ESLint e Prettier configurados
- [x] PWA configurado

### 🔒 **Segurança**

- [x] Validação de variáveis de ambiente
- [x] Content Security Policy
- [x] Headers de segurança
- [x] Sanitização de dados

### 📊 **Monitoramento**

- [x] Sistema de logging
- [x] Error boundary
- [x] Performance monitoring
- [x] Analytics (opcional)

### 🚀 **Performance**

- [x] Code splitting configurado
- [x] Bundle optimization
- [x] Lazy loading
- [x] Service Workers (PWA)

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Servidor de desenvolvimento
npm run dev:host              # Servidor acessível na rede
npm run build                 # Build de produção
npm run preview               # Preview do build

# Qualidade de código
npm run lint                  # Executar ESLint
npm run lint:fix              # Corrigir problemas do ESLint
npm run format                # Formatar código com Prettier
npm run type-check            # Verificar tipos TypeScript

# Testes
npm run test                  # Executar testes
npm run test:watch            # Testes em modo watch
npm run test:coverage         # Testes com cobertura
npm run test:ui               # Interface gráfica de testes

# Análise
npm run analyze               # Analisar bundle
npm run audit                 # Auditoria de segurança
npm run outdated              # Verificar dependências desatualizadas

# Limpeza
npm run clean                 # Limpar cache e build
npm run clean:deps            # Reinstalar dependências
```

## 📚 Referências

- [Vite Configuration](https://vitejs.dev/config/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Security Headers](https://securityheaders.com/)

---

*Última atualização: 29-08-2025*