# Guia de Implementação - Componentes UI ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Descrição:** Guia prático para implementação dos componentes base do Design System  
**MIT License**

## 📋 Visão Geral

Este documento fornece instruções detalhadas para implementar os componentes base do Design System do ReciboFast, incluindo código completo, exemplos de uso e boas práticas.

---

## 🛠️ 1. Setup Inicial

### 1.1 Instalação de Dependências

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências do Design System
npm install @tailwindcss/forms @tailwindcss/typography clsx tailwind-merge

# Instalar fonte Inter (opcional)
npm install @fontsource/inter
```

### 1.2 Configuração do Tailwind CSS

**Atualizar `tailwind.config.js`:**
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

### 1.3 Utilitário para Classes CSS

**Criar `src/lib/utils.ts`:**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para combinar classes CSS condicionalmente
 * Combina clsx com tailwind-merge para resolver conflitos de classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utilitário para formatar texto em formato de título
 */
export function formatTitle(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Utilitário para truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
```

---

## 🎨 2. Componentes Base

### 2.1 Componente Button

**Criar `src/components/ui/Button.tsx`:**
```typescript
import React from 'react';
import { cn } from '../../lib/utils';

// Ícone de loading
const LoadingIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4" 
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
    />
  </svg>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Tamanho do botão */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Estado de carregamento */
  loading?: boolean;
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  /** Ícone à direita do texto */
  rightIcon?: React.ReactNode;
  /** Botão ocupa toda a largura disponível */
  fullWidth?: boolean;
  /** Conteúdo do botão */
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    ].filter(Boolean).join(' ');
    
    const variants = {
      primary: [
        'bg-primary-600 text-white border border-transparent',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus:ring-primary-500',
        'shadow-sm hover:shadow-md'
      ].join(' '),
      
      secondary: [
        'bg-white text-gray-700 border border-gray-300',
        'hover:bg-gray-50 active:bg-gray-100',
        'focus:ring-primary-500',
        'shadow-sm hover:shadow-md'
      ].join(' '),
      
      outline: [
        'bg-transparent text-primary-600 border border-primary-600',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus:ring-primary-500'
      ].join(' '),
      
      ghost: [
        'bg-transparent text-gray-600 border border-transparent',
        'hover:bg-gray-100 hover:text-gray-900',
        'active:bg-gray-200',
        'focus:ring-primary-500'
      ].join(' '),
      
      danger: [
        'bg-error-600 text-white border border-transparent',
        'hover:bg-error-700 active:bg-error-800',
        'focus:ring-error-500',
        'shadow-sm hover:shadow-md'
      ].join(' ')
    };
    
    const sizes = {
      xs: 'px-2 py-1 text-xs rounded-md gap-1',
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-3 text-base rounded-lg gap-2',
      xl: 'px-8 py-4 text-lg rounded-xl gap-3',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <LoadingIcon />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
```

### 2.2 Componente Input

**Criar `src/components/ui/Input.tsx`:**
```typescript
import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label do input */
  label?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Mensagem de erro */
  error?: string;
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  /** Elemento à direita (ex: botão) */
  rightElement?: React.ReactNode;
  /** Tamanho do input */
  size?: 'sm' | 'md' | 'lg';
  /** Estado visual */
  state?: 'default' | 'error' | 'success' | 'warning';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    rightElement,
    size = 'md',
    state = 'default',
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = error || state === 'error';
    const actualState = hasError ? 'error' : state;
    
    const baseClasses = [
      'block w-full border rounded-lg',
      'placeholder-gray-500 text-gray-900',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
    ].join(' ');
    
    const stateClasses = {
      default: [
        'border-gray-300 bg-white',
        'focus:border-primary-500 focus:ring-primary-500'
      ].join(' '),
      
      error: [
        'border-error-500 bg-white',
        'focus:border-error-500 focus:ring-error-500'
      ].join(' '),
      
      success: [
        'border-success-500 bg-white',
        'focus:border-success-500 focus:ring-success-500'
      ].join(' '),
      
      warning: [
        'border-warning-500 bg-white',
        'focus:border-warning-500 focus:ring-warning-500'
      ].join(' ')
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };
    
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const inputClasses = cn(
      baseClasses,
      stateClasses[actualState],
      sizes[size],
      leftIcon && 'pl-10',
      (rightIcon || rightElement) && 'pr-10',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={cn('text-gray-400', iconSizes[size])}>
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          
          {(rightIcon || rightElement) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement ? (
                rightElement
              ) : (
                <span className={cn('text-gray-400', iconSizes[size])}>
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>
        
        {(helperText || error) && (
          <p className={cn(
            'mt-1 text-xs',
            hasError ? 'text-error-600' : 'text-gray-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
```

### 2.3 Componente Card

**Criar `src/components/ui/Card.tsx`:**
```typescript
import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual do card */
  variant?: 'default' | 'elevated' | 'bordered' | 'interactive';
  /** Padding interno */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Conteúdo do card */
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'bg-white rounded-xl border transition-all duration-200';
    
    const variants = {
      default: 'border-gray-200 shadow-sm hover:shadow-md',
      elevated: 'border-gray-200 shadow-lg hover:shadow-xl',
      bordered: 'border-2 border-gray-200 shadow-sm',
      interactive: 'border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-primary cursor-pointer'
    };
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps };
```

### 2.4 Componente Badge

**Criar `src/components/ui/Badge.tsx`:**
```typescript
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Variante visual do badge */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  /** Conteúdo do badge */
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'gray', 
    size = 'md',
    leftIcon,
    rightIcon,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center font-medium rounded-full',
      'transition-colors duration-200'
    ].join(' ');
    
    const variants = {
      primary: 'bg-primary-100 text-primary-800 border border-primary-200',
      secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
      success: 'bg-success-100 text-success-800 border border-success-200',
      warning: 'bg-warning-100 text-warning-800 border border-warning-200',
      error: 'bg-error-100 text-error-800 border border-error-200',
      gray: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-0.5 text-xs gap-1',
      lg: 'px-3 py-1 text-sm gap-1.5'
    };
    
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-3 w-3',
      lg: 'h-4 w-4'
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span className={cn('flex-shrink-0', iconSizes[size])}>
            {leftIcon}
          </span>
        )}
        
        <span>{children}</span>
        
        {rightIcon && (
          <span className={cn('flex-shrink-0', iconSizes[size])}>
            {rightIcon}
          </span>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
```

### 2.5 Barrel Export

**Criar `src/components/ui/index.ts`:**
```typescript
// Exportar todos os componentes UI
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

---

## 📝 3. Exemplos de Uso

### 3.1 Exemplo de Formulário

```typescript
import React, { useState } from 'react';
import { Button, Input, Card, CardHeader, CardBody, CardFooter } from '../components/ui';

const ExampleForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular validação
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    if (!formData.password) newErrors.password = 'Senha é obrigatória';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Processar formulário
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Login</h2>
        <p className="text-sm text-gray-600">Entre com suas credenciais</p>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            error={errors.password}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
        </CardBody>
        
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Entrar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ExampleForm;
```

### 3.2 Exemplo de Lista com Cards

```typescript
import React from 'react';
import { Card, CardBody, Badge, Button } from '../components/ui';

interface Receipt {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const ReceiptList = ({ receipts }: { receipts: Receipt[] }) => {
  const getStatusBadge = (status: Receipt['status']) => {
    const variants = {
      pending: 'warning' as const,
      approved: 'success' as const,
      rejected: 'error' as const
    };
    
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    };
    
    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <Card key={receipt.id} variant="interactive">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{receipt.title}</h3>
                <p className="text-sm text-gray-500">{receipt.date}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    R$ {receipt.amount.toFixed(2)}
                  </p>
                  {getStatusBadge(receipt.status)}
                </div>
                
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default ReceiptList;
```

---

## 🎯 4. Próximos Passos

### 4.1 Implementação Imediata

1. **Criar estrutura de arquivos:**
   ```bash
   mkdir -p src/components/ui
   mkdir -p src/lib
   ```

2. **Implementar utilitários:**
   - Criar `src/lib/utils.ts`
   - Atualizar `tailwind.config.js`

3. **Implementar componentes base:**
   - Button
   - Input
   - Card
   - Badge

4. **Testar componentes:**
   - Criar página de exemplo
   - Validar acessibilidade
   - Testar responsividade

### 4.2 Integração com Páginas Existentes

1. **Atualizar página de Login:**
   ```typescript
   import { Button, Input, Card } from '../components/ui';
   ```

2. **Atualizar página de Register:**
   ```typescript
   import { Button, Input, Card } from '../components/ui';
   ```

3. **Atualizar Dashboard:**
   ```typescript
   import { Card, Badge, Button } from '../components/ui';
   ```

### 4.3 Validação e Testes

1. **Testes de Acessibilidade:**
   - Navegação por teclado
   - Screen readers
   - Contraste de cores

2. **Testes Responsivos:**
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)

3. **Testes de Performance:**
   - Bundle size
   - Render performance
   - Lighthouse audit

---

**Status:** 📋 Guia completo - Pronto para implementação

**Estimativa:** 2-3 dias para implementação completa

**Benefícios Esperados:**
- ✅ Consistência visual em todo o projeto
- ✅ Redução de 50% no tempo de desenvolvimento de UI
- ✅ Melhor acessibilidade e experiência do usuário
- ✅ Facilidade de manutenção e escalabilidade
