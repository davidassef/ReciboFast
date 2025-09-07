# MIT License
# Autor atual: David Assef
# Descrição: 05 design system componentes
# Data: 07-09-2025

# 🎨 Design System e Componentes UI - Frontend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha o design system do ReciboFast, incluindo tokens de design, componentes UI, padrões visuais e diretrizes de interface que garantem consistência e qualidade em toda a aplicação.

## 🎯 Princípios de Design

### 🎨 **Filosofia Visual**

1. **Simplicidade** - Interface limpa e intuitiva
2. **Consistência** - Padrões visuais uniformes
3. **Acessibilidade** - Inclusivo para todos os usuários
4. **Performance** - Componentes otimizados
5. **Responsividade** - Adaptável a todos os dispositivos
6. **Profissionalismo** - Visual adequado ao contexto médico

### 🎭 **Personalidade da Marca**

- **Confiável** - Transmite segurança e profissionalismo
- **Moderno** - Interface atual e tecnológica
- **Eficiente** - Foco na produtividade do usuário
- **Acessível** - Fácil de usar e entender

## 🎨 Tokens de Design

### 🌈 **Paleta de Cores**

```typescript
// src/styles/tokens/colors.ts
export const colors = {
  // Cores Primárias
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Cor principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Cores Secundárias
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
  
  // Estados
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
  
  // Neutros
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
};
```

### 📏 **Espaçamento**

```typescript
// src/styles/tokens/spacing.ts
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
};

// Espaçamentos semânticos
export const semanticSpacing = {
  xs: spacing[1],    // 4px
  sm: spacing[2],    // 8px
  md: spacing[4],    // 16px
  lg: spacing[6],    // 24px
  xl: spacing[8],    // 32px
  '2xl': spacing[12], // 48px
  '3xl': spacing[16], // 64px
};
```

### 🔤 **Tipografia**

```typescript
// src/styles/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
  },
  
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
    '5xl': ['48px', { lineHeight: '1' }],
    '6xl': ['60px', { lineHeight: '1' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};
```

### 🔘 **Border Radius**

```typescript
// src/styles/tokens/radius.ts
export const borderRadius = {
  none: '0px',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
};
```

### 🌫️ **Sombras**

```typescript
// src/styles/tokens/shadows.ts
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
};
```

## 🧩 Componentes Base

### 🔘 **Button**

```typescript
// src/components/ui/button.tsx
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white shadow hover:bg-primary-600',
        destructive: 'bg-error-500 text-white shadow-sm hover:bg-error-600',
        outline: 'border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-primary-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 📝 **Input**

```typescript
// src/components/ui/input.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const inputVariants = cva(
  'flex w-full rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-200 focus-visible:ring-primary-500',
        error: 'border-error-500 focus-visible:ring-error-500',
        success: 'border-success-500 focus-visible:ring-success-500',
      },
      size: {
        default: 'h-9',
        sm: 'h-8 text-xs',
        lg: 'h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
```

### 🏷️ **Label**

```typescript
// src/components/ui/label.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-gray-700',
        error: 'text-error-600',
        success: 'text-success-600',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label, labelVariants };
```

### 📋 **Card**

```typescript
// src/components/ui/card.tsx
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-200 bg-white text-gray-950 shadow',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### 🎭 **Badge**

```typescript
// src/components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500 text-white shadow hover:bg-primary-600',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'border-transparent bg-error-500 text-white shadow hover:bg-error-600',
        success: 'border-transparent bg-success-500 text-white shadow hover:bg-success-600',
        warning: 'border-transparent bg-warning-500 text-white shadow hover:bg-warning-600',
        outline: 'text-gray-950 border-gray-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

## 🎯 Componentes Compostos

### 📝 **FormField**

```typescript
// src/components/ui/form-field.tsx
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Label } from './label';
import { Input, type InputProps } from './input';

export interface FormFieldProps extends InputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    hint, 
    required, 
    className, 
    containerClassName,
    id,
    ...props 
  }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label 
            htmlFor={fieldId}
            variant={error ? 'error' : 'default'}
            className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-error-500')}
          >
            {label}
          </Label>
        )}
        
        <Input
          id={fieldId}
          ref={ref}
          variant={error ? 'error' : 'default'}
          className={className}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-error-600">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { FormField };
```

### 🎭 **Modal**

```typescript
// src/components/ui/modal.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { Button } from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog 
        onClose={closeOnOverlayClick ? onClose : () => {}} 
        className="relative z-50"
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all',
                  sizeClasses[size],
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-6 pb-0">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-gray-500">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 📊 **DataTable**

```typescript
// src/components/ui/data-table.tsx
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum item encontrado',
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filtrar dados
  const filteredData = searchable
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Ordenar dados
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      })
    : filteredData;

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getValue = (item: T, key: string) => {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {searchTerm && (
            <Badge variant="secondary">
              {sortedData.length} resultado{sortedData.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-primary-500">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    <span className="text-gray-500">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-gray-50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(getValue(item, String(column.key)), item, index)
                        : getValue(item, String(column.key))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## 🎨 Componentes Específicos do Domínio

### 🏥 **ReceitaCard**

```typescript
// src/components/receitas/receita-card.tsx
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, UserIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receita } from '@/types/receita';
import { cn } from '@/utils/cn';

interface ReceitaCardProps {
  receita: Receita;
  onView?: (receita: Receita) => void;
  onEdit?: (receita: Receita) => void;
  onDelete?: (receita: Receita) => void;
  className?: string;
}

const statusConfig = {
  rascunho: {
    label: 'Rascunho',
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800',
  },
  ativa: {
    label: 'Ativa',
    variant: 'success' as const,
    color: 'bg-success-100 text-success-800',
  },
  vencida: {
    label: 'Vencida',
    variant: 'warning' as const,
    color: 'bg-warning-100 text-warning-800',
  },
  cancelada: {
    label: 'Cancelada',
    variant: 'destructive' as const,
    color: 'bg-error-100 text-error-800',
  },
};

export function ReceitaCard({
  receita,
  onView,
  onEdit,
  onDelete,
  className,
}: ReceitaCardProps) {
  const status = statusConfig[receita.status] || statusConfig.rascunho;
  
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              Receita #{receita.numero}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>{receita.paciente.nome}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {format(new Date(receita.dataEmissao), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <Badge variant={status.variant}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Medicamentos */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span>Medicamentos ({receita.medicamentos.length})</span>
          </div>
          
          <div className="space-y-1">
            {receita.medicamentos.slice(0, 2).map((medicamento, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">{medicamento.nome}</span>
                <span className="text-gray-400"> - {medicamento.dosagem}</span>
              </div>
            ))}
            
            {receita.medicamentos.length > 2 && (
              <div className="text-sm text-gray-400">
                +{receita.medicamentos.length - 2} medicamento(s)
              </div>
            )}
          </div>
        </div>
        
        {/* Observações */}
        {receita.observacoes && (
          <div className="text-sm text-gray-600 line-clamp-2">
            {receita.observacoes}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(receita)}>
              Visualizar
            </Button>
          )}
          
          {onEdit && receita.status !== 'cancelada' && (
            <Button variant="outline" size="sm" onClick={() => onEdit(receita)}>
              Editar
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(receita)}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 📊 **StatusIndicator**

```typescript
// src/components/ui/status-indicator.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const statusIndicatorVariants = cva(
  'inline-flex items-center space-x-2',
  {
    variants: {
      variant: {
        success: 'text-success-700',
        warning: 'text-warning-700',
        error: 'text-error-700',
        info: 'text-primary-700',
        neutral: 'text-gray-700',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

const dotVariants = cva(
  'rounded-full',
  {
    variants: {
      variant: {
        success: 'bg-success-500',
        warning: 'bg-warning-500',
        error: 'bg-error-500',
        info: 'bg-primary-500',
        neutral: 'bg-gray-500',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label: string;
  showDot?: boolean;
}

export function StatusIndicator({
  variant,
  size,
  label,
  showDot = true,
  className,
  ...props
}: StatusIndicatorProps) {
  return (
    <div
      className={cn(statusIndicatorVariants({ variant, size }), className)}
      {...props}
    >
      {showDot && (
        <div className={cn(dotVariants({ variant, size }))} />
      )}
      <span>{label}</span>
    </div>
  );
}
```

## 🎨 Padrões de Layout

### 📱 **Responsive Grid**

```typescript
// src/components/layout/responsive-grid.tsx
import { cn } from '@/utils/cn';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  className?: string;
}

const getGridCols = (cols: number) => {
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };
  return gridColsMap[cols] || 'grid-cols-1';
};

const getResponsiveGridCols = (cols: ResponsiveGridProps['cols']) => {
  if (!cols) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  
  const classes = [];
  
  if (cols.default) classes.push(getGridCols(cols.default));
  if (cols.sm) classes.push(`sm:${getGridCols(cols.sm)}`);
  if (cols.md) classes.push(`md:${getGridCols(cols.md)}`);
  if (cols.lg) classes.push(`lg:${getGridCols(cols.lg)}`);
  if (cols.xl) classes.push(`xl:${getGridCols(cols.xl)}`);
  if (cols['2xl']) classes.push(`2xl:${getGridCols(cols['2xl'])}`);
  
  return classes.join(' ');
};

const getGap = (gap: number) => {
  const gapMap: Record<number, string> = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };
  return gapMap[gap] || 'gap-4';
};

export function ResponsiveGrid({
  children,
  cols,
  gap = 4,
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid',
        getResponsiveGridCols(cols),
        getGap(gap),
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 📄 **PageHeader**

```typescript
// src/components/layout/page-header.tsx
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumb && (
        <div className="text-sm text-gray-500">
          {breadcrumb}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🎯 Diretrizes de Uso

### ✅ **Boas Práticas**

1. **Consistência**
   - Use sempre os tokens de design definidos
   - Mantenha padrões visuais uniformes
   - Siga as convenções de nomenclatura

2. **Acessibilidade**
   - Garanta contraste adequado (WCAG AA)
   - Use labels e aria-labels apropriados
   - Implemente navegação por teclado
   - Teste com leitores de tela

3. **Performance**
   - Use lazy loading para componentes pesados
   - Otimize re-renders com React.memo
   - Minimize o bundle size

4. **Responsividade**
   - Design mobile-first
   - Teste em diferentes dispositivos
   - Use breakpoints consistentes

### ❌ **Evitar**

1. **Inconsistências**
   - Cores hardcoded
   - Espaçamentos arbitrários
   - Tipografia inconsistente

2. **Problemas de Acessibilidade**
   - Contraste insuficiente
   - Elementos não focáveis
   - Falta de textos alternativos

3. **Performance**
   - Componentes muito pesados
   - Re-renders desnecessários
   - Imports desnecessários

## 📊 Métricas de Qualidade

### 🎯 **Objetivos**

- **Consistência Visual:** 95%+ dos componentes seguem o design system
- **Acessibilidade:** WCAG AA compliance
- **Performance:** Componentes carregam em <100ms
- **Cobertura de Testes:** 80%+ dos componentes testados
- **Bundle Size:** <50KB para componentes base

### 📈 **Monitoramento**

```typescript
// src/utils/design-system-metrics.ts
export const designSystemMetrics = {
  // Componentes que seguem o design system
  compliantComponents: 0,
  totalComponents: 0,
  
  // Tokens utilizados vs disponíveis
  usedTokens: 0,
  availableTokens: 0,
  
  // Acessibilidade
  accessibilityScore: 0,
  
  // Performance
  averageLoadTime: 0,
  bundleSize: 0,
};

// Função para calcular compliance
export const calculateCompliance = () => {
  const { compliantComponents, totalComponents } = designSystemMetrics;
  return totalComponents > 0 ? (compliantComponents / totalComponents) * 100 : 0;
};
```

## 🔄 Evolução e Manutenção

### 📅 **Roadmap**

**Q1 2025:**
- [ ] Implementar tema escuro
- [ ] Adicionar mais variantes de componentes
- [ ] Melhorar documentação no Storybook

**Q2 2025:**
- [ ] Componentes de data visualization
- [ ] Sistema de notificações avançado
- [ ] Componentes de upload de arquivos

**Q3 2025:**
- [ ] Animações e transições
- [ ] Componentes de formulário avançados
- [ ] Sistema de temas customizáveis

### 🔧 **Processo de Atualização**

1. **Proposta de Mudança**
   - Documentar necessidade
   - Avaliar impacto
   - Obter aprovação

2. **Implementação**
   - Atualizar tokens
   - Modificar componentes
   - Atualizar documentação

3. **Testes**
   - Testes visuais
   - Testes de acessibilidade
   - Testes de performance

4. **Deploy**
   - Versioning semântico
   - Changelog detalhado
   - Comunicação para equipe

## 📚 Recursos

### 🎨 **Design**
- [Figma Design System](https://figma.com/recibo-fast-design-system)
- [Color Palette Generator](https://coolors.co/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 🧪 **Testes**
- [Storybook](http://localhost:6006)
- [Chromatic](https://chromatic.com/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### 📖 **Documentação**
- [Component Library](./storybook)
- [Design Tokens](./tokens)
- [Usage Guidelines](./guidelines)

---

*Última atualização: 29-08-2025*