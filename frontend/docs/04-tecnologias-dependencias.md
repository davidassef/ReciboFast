# MIT License
# Autor atual: David Assef
# Descrição: 04 tecnologias dependencias
# Data: 07-09-2025

# 🛠️ Tecnologias e Dependências - Frontend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha todas as tecnologias, bibliotecas e dependências utilizadas no frontend do ReciboFast, incluindo suas versões, propósitos e configurações específicas.

## 🏗️ Stack Principal

### ⚛️ **React Ecosystem**

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.1"
}
```

**Propósito:** Framework principal para construção da interface de usuário

**Configurações:**
- React 18 com Concurrent Features
- Strict Mode habilitado
- React Router para navegação SPA

**Exemplo de uso:**
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StrictMode } from 'react';

function App() {
  return (
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/receitas" element={<ReceitasPage />} />
          <Route path="/receitas/:id" element={<ReceitaDetalhePage />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
```

### 🔷 **TypeScript**

```json
{
  "typescript": "^5.0.2",
  "@types/react": "^18.0.28",
  "@types/react-dom": "^18.0.11",
  "@types/node": "^18.15.0"
}
```

**Propósito:** Tipagem estática e melhor experiência de desenvolvimento

**Configurações:**
- Target ES2020
- Strict mode habilitado
- Path mapping configurado
- JSX React runtime

### ⚡ **Vite**

```json
{
  "vite": "^4.4.5",
  "@vitejs/plugin-react": "^4.0.3"
}
```

**Propósito:** Build tool e servidor de desenvolvimento

**Características:**
- Hot Module Replacement (HMR)
- Build otimizado com Rollup
- Suporte nativo ao TypeScript
- Plugin ecosystem

## 🎨 Styling e UI

### 🌊 **Tailwind CSS**

```json
{
  "tailwindcss": "^3.3.0",
  "@tailwindcss/forms": "^0.5.3",
  "@tailwindcss/typography": "^0.5.9",
  "@tailwindcss/aspect-ratio": "^0.4.2",
  "@tailwindcss/container-queries": "^0.1.1"
}
```

**Propósito:** Framework CSS utility-first

**Plugins utilizados:**
- **@tailwindcss/forms:** Estilos para formulários
- **@tailwindcss/typography:** Tipografia para conteúdo
- **@tailwindcss/aspect-ratio:** Controle de aspect ratio
- **@tailwindcss/container-queries:** Container queries

**Configuração customizada:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### 🎭 **Headless UI**

```json
{
  "@headlessui/react": "^1.7.14",
  "@heroicons/react": "^2.0.17"
}
```

**Propósito:** Componentes UI acessíveis e sem estilo

**Componentes utilizados:**
- Dialog (Modais)
- Menu (Dropdowns)
- Listbox (Select customizado)
- Switch (Toggle)
- Disclosure (Accordion)
- Combobox (Autocomplete)

**Exemplo:**
```typescript
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function Modal({ isOpen, onClose, children }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
        
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 🎨 **Utilitários de Styling**

```json
{
  "clsx": "^1.2.1",
  "tailwind-merge": "^1.12.0"
}
```

**Propósito:** Utilitários para manipulação de classes CSS

**Exemplo de uso:**
```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function para combinar classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso em componentes
function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        {
          'bg-primary-500 text-white hover:bg-primary-600': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
        },
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-11 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
```

## 📊 Gerenciamento de Estado

### 🐻 **Zustand**

```json
{
  "zustand": "^4.3.7"
}
```

**Propósito:** Gerenciamento de estado global simples e performático

**Exemplo de store:**
```typescript
// src/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(n  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### ⚛️ **React Context**

**Propósito:** Estado local e providers para funcionalidades específicas

**Exemplo:**
```typescript
// src/contexts/theme-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setActualTheme(systemTheme);
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      setActualTheme(theme);
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 📡 Comunicação com API

### 🌐 **Axios**

```json
{
  "axios": "^1.4.0"
}
```

**Propósito:** Cliente HTTP para comunicação com APIs

**Configuração:**
```typescript
// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { config } from '@/config/env';
import { useAuthStore } from '@/stores/auth-store';

// Instância principal do Axios
export const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const { user } = useAuthStore.getState();
    
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

### 🔄 **TanStack Query (React Query)**

```json
{
  "@tanstack/react-query": "^4.28.0",
  "@tanstack/react-query-devtools": "^4.28.0"
}
```

**Propósito:** Gerenciamento de estado do servidor, cache e sincronização

**Configuração:**
```typescript
// src/lib/react-query.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Exemplo de hook customizado:**
```typescript
// src/hooks/use-receitas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receitasService } from '@/services/receitas-service';
import { Receita, CreateReceitaData } from '@/types/receita';

export const useReceitas = () => {
  return useQuery({
    queryKey: ['receitas'],
    queryFn: receitasService.getAll,
  });
};

export const useReceita = (id: string) => {
  return useQuery({
    queryKey: ['receitas', id],
    queryFn: () => receitasService.getById(id),
    enabled: !!id,
  });
};

export const useCreateReceita = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: receitasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
    },
  });
};
```

## 🗄️ Backend as a Service

### 🚀 **Supabase**

```json
{
  "@supabase/supabase-js": "^2.21.0"
}
```

**Propósito:** Backend completo com banco de dados, autenticação e storage

**Configuração:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/env';
import { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Tipos gerados automaticamente
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
```

**Hooks para Supabase:**
```typescript
// src/hooks/use-supabase-auth.ts
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return {
    user,
    session,
    loading,
    signIn: supabase.auth.signInWithPassword,
    signUp: supabase.auth.signUp,
    signOut: supabase.auth.signOut,
  };
};
```

## 📝 Formulários e Validação

### 📋 **React Hook Form**

```json
{
  "react-hook-form": "^7.43.9",
  "@hookform/resolvers": "^3.0.1"
}
```

**Propósito:** Gerenciamento de formulários performático e flexível

### ✅ **Zod**

```json
{
  "zod": "^3.21.4"
}
```

**Propósito:** Validação de esquemas TypeScript-first

**Exemplo de uso conjunto:**
```typescript
// src/schemas/receita-schema.ts
import { z } from 'zod';

export const receitaSchema = z.object({
  paciente: z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
    telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
    endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  }),
  medicamentos: z.array(
    z.object({
      nome: z.string().min(1, 'Nome do medicamento é obrigatório'),
      dosagem: z.string().min(1, 'Dosagem é obrigatória'),
      quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
      instrucoes: z.string().min(1, 'Instruções são obrigatórias'),
    })
  ).min(1, 'Pelo menos um medicamento é obrigatório'),
  observacoes: z.string().optional(),
});

export type ReceitaFormData = z.infer<typeof receitaSchema>;
```

```typescript
// src/components/forms/receita-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { receitaSchema, ReceitaFormData } from '@/schemas/receita-schema';

export function ReceitaForm({ onSubmit }: { onSubmit: (data: ReceitaFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ReceitaFormData>({
    resolver: zodResolver(receitaSchema),
    defaultValues: {
      paciente: {
        nome: '',
        cpf: '',
        telefone: '',
        endereco: '',
      },
      medicamentos: [{
        nome: '',
        dosagem: '',
        quantidade: 1,
        instrucoes: '',
      }],
      observacoes: '',
    },
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campos do formulário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome do Paciente
          </label>
          <input
            {...register('paciente.nome')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.paciente?.nome && (
            <p className="mt-1 text-sm text-red-600">
              {errors.paciente.nome.message}
            </p>
          )}
        </div>
        
        {/* Mais campos... */}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Receita'}
      </button>
    </form>
  );
}
```

## 📅 Utilitários e Helpers

### 📆 **Date-fns**

```json
{
  "date-fns": "^2.29.3",
  "date-fns-tz": "^2.0.0"
}
```

**Propósito:** Manipulação de datas moderna e funcional

**Exemplo:**
```typescript
// src/utils/date.ts
import { format, parseISO, isValid, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export const dateUtils = {
  // Formatar data para exibição
  formatDate: (date: Date | string, pattern: string = 'dd/MM/yyyy'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const zonedDate = utcToZonedTime(dateObj, TIMEZONE);
    return format(zonedDate, pattern, { locale: ptBR });
  },
  
  // Formatar data e hora
  formatDateTime: (date: Date | string): string => {
    return dateUtils.formatDate(date, 'dd/MM/yyyy HH:mm');
  },
  
  // Converter para UTC
  toUTC: (date: Date): Date => {
    return zonedTimeToUtc(date, TIMEZONE);
  },
  
  // Obter data atual no timezone local
  now: (): Date => {
    return utcToZonedTime(new Date(), TIMEZONE);
  },
  
  // Adicionar dias
  addDays: (date: Date, amount: number): Date => {
    return addDays(date, amount);
  },
  
  // Subtrair dias
  subDays: (date: Date, amount: number): Date => {
    return subDays(date, amount);
  },
};
```

### 🔢 **Lodash**

```json
{
  "lodash": "^4.17.21",
  "@types/lodash": "^4.14.194"
}
```

**Propósito:** Utilitários JavaScript para manipulação de dados

**Funções mais utilizadas:**
```typescript
// src/utils/helpers.ts
import { 
  debounce, 
  throttle, 
  groupBy, 
  orderBy, 
  uniqBy, 
  isEmpty, 
  isEqual,
  pick,
  omit
} from 'lodash';

// Debounce para busca
export const debouncedSearch = debounce((query: string, callback: (query: string) => void) => {
  callback(query);
}, 300);

// Throttle para scroll
export const throttledScroll = throttle((callback: () => void) => {
  callback();
}, 100);

// Agrupar receitas por status
export const groupReceitasByStatus = (receitas: Receita[]) => {
  return groupBy(receitas, 'status');
};

// Ordenar receitas
export const sortReceitas = (receitas: Receita[], field: string, order: 'asc' | 'desc' = 'desc') => {
  return orderBy(receitas, [field], [order]);
};

// Remover duplicatas
export const uniqueReceitas = (receitas: Receita[]) => {
  return uniqBy(receitas, 'id');
};
```

## 🧪 Testes

### 🃏 **Vitest**

```json
{
  "vitest": "^0.31.0",
  "@vitest/ui": "^0.31.0",
  "jsdom": "^22.0.0"
}
```

**Propósito:** Framework de testes rápido e moderno

### 🧪 **Testing Library**

```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3"
}
```

**Propósito:** Utilitários para testes focados no usuário

**Configuração:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});
```

**Exemplo de teste:**
```typescript
// src/components/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('bg-primary-500');
  });
});
```

## 📱 PWA e Service Workers

### 🔧 **Vite PWA Plugin**

```json
{
  "vite-plugin-pwa": "^0.14.7",
  "workbox-window": "^6.5.4"
}
```

**Propósito:** Transformar a aplicação em PWA

**Configuração:**
```typescript
// vite.config.ts - PWA Config
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: 'ReciboFast',
    short_name: 'ReciboFast',
    description: 'Sistema de Gestão de Receitas',
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
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
    ],
  },
})
```

## 🛠️ Ferramentas de Desenvolvimento

### 📊 **Bundle Analyzer**

```json
{
  "rollup-plugin-visualizer": "^5.9.0"
}
```

**Propósito:** Análise do tamanho do bundle

### 🎨 **Storybook**

```json
{
  "@storybook/react": "^7.0.7",
  "@storybook/addon-essentials": "^7.0.7",
  "@storybook/addon-interactions": "^7.0.7",
  "@storybook/addon-links": "^7.0.7",
  "@storybook/blocks": "^7.0.7",
  "@storybook/testing-library": "^0.1.0",
  "@storybook/vite": "^7.0.7"
}
```

**Propósito:** Desenvolvimento e documentação de componentes isolados

**Configuração:**
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;
```

**Exemplo de story:**
```typescript
// src/components/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Button',
  },
};
```

## 📦 Dependências por Categoria

### 🏗️ **Core Dependencies**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.1",
  "typescript": "^5.0.2"
}
```

### 🎨 **UI & Styling**
```json
{
  "tailwindcss": "^3.3.0",
  "@headlessui/react": "^1.7.14",
  "@heroicons/react": "^2.0.17",
  "clsx": "^1.2.1",
  "tailwind-merge": "^1.12.0"
}
```

### 📊 **State Management**
```json
{
  "zustand": "^4.3.7",
  "@tanstack/react-query": "^4.28.0"
}
```

### 📡 **API & Backend**
```json
{
  "axios": "^1.4.0",
  "@supabase/supabase-js": "^2.21.0"
}
```

### 📝 **Forms & Validation**
```json
{
  "react-hook-form": "^7.43.9",
  "@hookform/resolvers": "^3.0.1",
  "zod": "^3.21.4"
}
```

### 🛠️ **Utilities**
```json
{
  "date-fns": "^2.29.3",
  "lodash": "^4.17.21"
}
```

### 🧪 **Testing**
```json
{
  "vitest": "^0.31.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^5.16.5"
}
```

### 🔧 **Development Tools**
```json
{
  "vite": "^4.4.5",
  "@vitejs/plugin-react": "^4.0.3",
  "eslint": "^8.38.0",
  "prettier": "^2.8.7",
  "@storybook/react": "^7.0.7"
}
```

### 📱 **PWA**
```json
{
  "vite-plugin-pwa": "^0.14.7",
  "workbox-window": "^6.5.4"
}
```

## 🔄 Atualizações e Manutenção

### 📅 **Cronograma de Atualizações**

- **Semanalmente:** Patches de segurança
- **Mensalmente:** Minor updates
- **Trimestralmente:** Major updates (com planejamento)

### 🔍 **Comandos de Manutenção**

```bash
# Verificar dependências desatualizadas
npm outdated

# Auditoria de segurança
npm audit
npm audit fix

# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit --audit-level moderate

# Limpar cache
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### ⚠️ **Dependências Críticas**

Dependências que requerem atenção especial ao atualizar:

1. **React** - Mudanças podem afetar toda a aplicação
2. **TypeScript** - Pode quebrar tipagens existentes
3. **Vite** - Pode afetar build e desenvolvimento
4. **Tailwind CSS** - Mudanças podem afetar estilos
5. **React Router** - Mudanças podem afetar navegação

### 📋 **Checklist de Atualização**

- [ ] Verificar changelog das dependências
- [ ] Testar em ambiente de desenvolvimento
- [ ] Executar todos os testes
- [ ] Verificar build de produção
- [ ] Testar funcionalidades críticas
- [ ] Atualizar documentação se necessário
- [ ] Deploy em staging para testes
- [ ] Deploy em produção

## 📚 Recursos e Documentação

### 📖 **Documentação Oficial**

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

### 🎓 **Recursos de Aprendizado**

- [React Beta Docs](https://beta.reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Play](https://play.tailwindcss.com/)
- [Headless UI Examples](https://headlessui.com/)

### 🛠️ **Ferramentas Úteis**

- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)

---

*Última atualização: 29-08-2025*