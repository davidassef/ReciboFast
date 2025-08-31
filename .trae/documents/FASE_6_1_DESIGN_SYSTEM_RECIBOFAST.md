# Fase 6.1 - Design System ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Descrição:** Documentação completa do Design System para o projeto ReciboFast  
**MIT License**

## 📋 Visão Geral

Este documento define o Design System do ReciboFast, estabelecendo uma linguagem visual consistente e escalável que melhora a experiência do usuário e facilita o desenvolvimento de novos componentes.

### Objetivos
- ✅ Criar identidade visual consistente
- ✅ Estabelecer padrões reutilizáveis
- ✅ Melhorar acessibilidade
- ✅ Facilitar manutenção e escalabilidade
- ✅ Otimizar experiência do desenvolvedor

---

## 🎨 1. Design Tokens

### 1.1 Paleta de Cores

#### Cores Primárias
```css
/* Azul Principal - Confiança e Profissionalismo */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Cor principal */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;
```

#### Cores Secundárias
```css
/* Verde - Sucesso e Confirmação */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-200: #bbf7d0;
--color-success-300: #86efac;
--color-success-400: #4ade80;
--color-success-500: #22c55e;  /* Verde principal */
--color-success-600: #16a34a;
--color-success-700: #15803d;
--color-success-800: #166534;
--color-success-900: #14532d;

/* Laranja - Atenção e Avisos */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-200: #fde68a;
--color-warning-300: #fcd34d;
--color-warning-400: #fbbf24;
--color-warning-500: #f59e0b;  /* Laranja principal */
--color-warning-600: #d97706;
--color-warning-700: #b45309;
--color-warning-800: #92400e;
--color-warning-900: #78350f;

/* Vermelho - Erros e Exclusões */
--color-error-50: #fef2f2;
--color-error-100: #fee2e2;
--color-error-200: #fecaca;
--color-error-300: #fca5a5;
--color-error-400: #f87171;
--color-error-500: #ef4444;  /* Vermelho principal */
--color-error-600: #dc2626;
--color-error-700: #b91c1c;
--color-error-800: #991b1b;
--color-error-900: #7f1d1d;
```

#### Cores Neutras
```css
/* Escala de Cinzas */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
--color-gray-950: #030712;

/* Cores Especiais */
--color-white: #ffffff;
--color-black: #000000;
```

### 1.2 Tipografia

#### Família de Fontes
```css
/* Fonte Principal - Inter (Sans-serif moderna) */
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fonte Secundária - JetBrains Mono (Monospace para códigos) */
--font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### Escala Tipográfica
```css
/* Tamanhos de Fonte */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
--font-size-5xl: 3rem;      /* 48px */

/* Pesos de Fonte */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;

/* Altura de Linha */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### 1.3 Espaçamento

#### Sistema de Espaçamento (8px base)
```css
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
--spacing-24: 6rem;    /* 96px */
```

### 1.4 Sombras e Elevação

```css
/* Sombras */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Sombras Internas */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

/* Sombras Coloridas */
--shadow-primary: 0 4px 14px 0 rgba(59, 130, 246, 0.15);
--shadow-success: 0 4px 14px 0 rgba(34, 197, 94, 0.15);
--shadow-warning: 0 4px 14px 0 rgba(245, 158, 11, 0.15);
--shadow-error: 0 4px 14px 0 rgba(239, 68, 68, 0.15);
```

### 1.5 Bordas e Raios

```css
/* Raios de Borda */
--border-radius-none: 0;
--border-radius-sm: 0.125rem;  /* 2px */
--border-radius-md: 0.375rem;  /* 6px */
--border-radius-lg: 0.5rem;    /* 8px */
--border-radius-xl: 0.75rem;   /* 12px */
--border-radius-2xl: 1rem;     /* 16px */
--border-radius-full: 9999px;

/* Larguras de Borda */
--border-width-0: 0;
--border-width-1: 1px;
--border-width-2: 2px;
--border-width-4: 4px;
```

---

## 🧩 2. Sistema de Componentes Base

### 2.1 Botões

#### Variantes de Botão

**Primary Button**
```css
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white;
  @apply bg-primary-600 border border-transparent rounded-lg;
  @apply hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

**Secondary Button**
```css
.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700;
  @apply bg-white border border-gray-300 rounded-lg;
  @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

**Outline Button**
```css
.btn-outline {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600;
  @apply bg-transparent border border-primary-600 rounded-lg;
  @apply hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

**Ghost Button**
```css
.btn-ghost {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600;
  @apply bg-transparent border border-transparent rounded-lg;
  @apply hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

#### Tamanhos de Botão
```css
.btn-xs { @apply px-2 py-1 text-xs; }
.btn-sm { @apply px-3 py-1.5 text-sm; }
.btn-md { @apply px-4 py-2 text-sm; }     /* Padrão */
.btn-lg { @apply px-6 py-3 text-base; }
.btn-xl { @apply px-8 py-4 text-lg; }
```

### 2.2 Inputs e Formulários

#### Input Base
```css
.input-base {
  @apply block w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500;
  @apply bg-white border border-gray-300 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

#### Estados de Input
```css
.input-error {
  @apply border-error-500 focus:ring-error-500 focus:border-error-500;
}

.input-success {
  @apply border-success-500 focus:ring-success-500 focus:border-success-500;
}

.input-warning {
  @apply border-warning-500 focus:ring-warning-500 focus:border-warning-500;
}
```

#### Labels e Helpers
```css
.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.helper-text {
  @apply mt-1 text-xs text-gray-500;
}

.error-text {
  @apply mt-1 text-xs text-error-600;
}
```

### 2.3 Cards

#### Card Base
```css
.card {
  @apply bg-white rounded-xl border border-gray-200 shadow-sm;
  @apply hover:shadow-md transition-shadow duration-200;
}

.card-header {
  @apply px-6 py-4 border-b border-gray-200;
}

.card-body {
  @apply px-6 py-4;
}

.card-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl;
}
```

#### Variantes de Card
```css
.card-elevated {
  @apply shadow-lg hover:shadow-xl;
}

.card-bordered {
  @apply border-2 border-gray-200;
}

.card-interactive {
  @apply cursor-pointer hover:border-primary-300 hover:shadow-primary;
}
```

### 2.4 Modais

#### Modal Base
```css
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-gray-200;
}

.modal-body {
  @apply px-6 py-4;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200;
}
```

### 2.5 Badges e Tags

```css
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-primary {
  @apply bg-primary-100 text-primary-800;
}

.badge-success {
  @apply bg-success-100 text-success-800;
}

.badge-warning {
  @apply bg-warning-100 text-warning-800;
}

.badge-error {
  @apply bg-error-100 text-error-800;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800;
}
```

---

## 🛠️ 3. Guia de Implementação Técnica

### 3.1 Estrutura de Arquivos

```
frontend/src/
├── styles/
│   ├── globals.css          # Estilos globais e reset
│   ├── tokens.css           # Design tokens CSS
│   ├── components.css       # Classes de componentes
│   └── utilities.css        # Classes utilitárias
├── components/
│   ├── ui/                  # Componentes base do design system
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── index.ts         # Barrel export
│   └── ...
└── lib/
    ├── utils.ts             # Utilitários (cn, etc.)
    └── design-tokens.ts     # Tokens em TypeScript
```

### 3.2 Configuração do Tailwind CSS

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        },
        error: {
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
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
        'success': '0 4px 14px 0 rgba(34, 197, 94, 0.15)',
        'warning': '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
        'error': '0 4px 14px 0 rgba(239, 68, 68, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 3.3 Componente Button Exemplo

**components/ui/Button.tsx**
```typescript
import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-600 text-white border border-transparent hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
      outline: 'bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 hover:text-gray-900 focus:ring-primary-500',
    };
    
    const sizes = {
      xs: 'px-2 py-1 text-xs rounded-md',
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
```

---

## ♿ 4. Padrões de Acessibilidade

### 4.1 Contraste de Cores

- **Texto normal**: Mínimo 4.5:1 contra o fundo
- **Texto grande**: Mínimo 3:1 contra o fundo
- **Elementos interativos**: Mínimo 3:1 contra elementos adjacentes

### 4.2 Estados de Foco

```css
/* Padrão de foco consistente */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

/* Foco visível para navegação por teclado */
.focus-visible:focus-visible {
  @apply ring-2 ring-primary-500 ring-offset-2;
}
```

### 4.3 Navegação por Teclado

- **Tab**: Navegar entre elementos focáveis
- **Enter/Space**: Ativar botões e links
- **Escape**: Fechar modais e dropdowns
- **Arrow keys**: Navegar em menus e listas

### 4.4 ARIA Labels e Roles

```typescript
// Exemplo de botão com loading
<button
  aria-label={loading ? 'Carregando...' : 'Salvar receita'}
  aria-disabled={loading}
  disabled={loading}
>
  {loading ? 'Carregando...' : 'Salvar'}
</button>

// Exemplo de modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Título do Modal</h2>
  <p id="modal-description">Descrição do modal</p>
</div>
```

### 4.5 Texto Alternativo

```typescript
// Ícones decorativos
<Icon aria-hidden="true" />

// Ícones informativos
<Icon aria-label="Sucesso" role="img" />

// Imagens
<img src="chart.png" alt="Gráfico mostrando crescimento de 25% nas vendas" />
```

---

## 📱 5. Responsividade

### 5.1 Breakpoints

```css
/* Breakpoints do Tailwind CSS */
sm: 640px   /* Tablets pequenos */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Desktops grandes */
```

### 5.2 Padrões Responsivos

```css
/* Layout responsivo */
.container-responsive {
  @apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Grid responsivo */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Texto responsivo */
.text-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}
```

---

## 🚀 6. Implementação Prática

### 6.1 Checklist de Implementação

#### Fase 1: Setup Inicial
- [ ] Instalar dependências necessárias
- [ ] Configurar Tailwind CSS com tokens personalizados
- [ ] Criar estrutura de arquivos CSS
- [ ] Implementar utilitário `cn()` para classes condicionais

#### Fase 2: Componentes Base
- [ ] Implementar componente Button
- [ ] Implementar componente Input
- [ ] Implementar componente Card
- [ ] Implementar componente Modal
- [ ] Implementar componente Badge

#### Fase 3: Aplicação nos Componentes Existentes
- [ ] Refatorar páginas Login e Register
- [ ] Atualizar Dashboard com novos componentes
- [ ] Aplicar design system nas páginas de receitas
- [ ] Atualizar componentes de navegação

#### Fase 4: Testes e Refinamentos
- [ ] Testar acessibilidade com screen readers
- [ ] Validar contraste de cores
- [ ] Testar navegação por teclado
- [ ] Verificar responsividade em diferentes dispositivos

### 6.2 Dependências Necessárias

```json
{
  "dependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

### 6.3 Comandos de Instalação

```bash
# Instalar dependências
npm install @tailwindcss/forms @tailwindcss/typography clsx tailwind-merge

# Instalar fonte Inter (opcional)
npm install @fontsource/inter
```

---

## 📊 7. Métricas e Validação

### 7.1 Métricas de Qualidade

- **Consistência Visual**: 95% dos componentes seguem o design system
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse score > 90
- **Manutenibilidade**: Redução de 50% no tempo de desenvolvimento de novos componentes

### 7.2 Ferramentas de Validação

- **axe-core**: Testes automatizados de acessibilidade
- **Lighthouse**: Auditoria de performance e acessibilidade
- **Storybook**: Documentação e testes visuais de componentes
- **Chromatic**: Testes de regressão visual

---

## 🎯 8. Próximos Passos

### 8.1 Implementação Imediata
1. Configurar Tailwind CSS com tokens personalizados
2. Criar componentes Button e Input
3. Aplicar nas páginas de autenticação
4. Testar acessibilidade básica

### 8.2 Evolução Futura
1. Adicionar mais componentes (Dropdown, Tooltip, etc.)
2. Implementar tema escuro
3. Criar biblioteca de ícones personalizada
4. Desenvolver animações e micro-interações

### 8.3 Documentação
1. Criar Storybook para componentes
2. Documentar padrões de uso
3. Criar guias de contribuição
4. Estabelecer processo de review de design

---

**Status:** 📋 Documentação completa - Pronto para implementação

**Estimativa de Implementação:** 3-4 dias

**Impacto Esperado:** Melhoria significativa na consistência visual, experiência do usuário e velocidade de desenvolvimento de novos componentes.
