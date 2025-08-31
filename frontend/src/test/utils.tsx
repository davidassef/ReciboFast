// MIT License
// Autor atual: David Assef
// Descrição: Utilitários e helpers para testes
// Data: 21-01-2025

import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

// Mock do usuário autenticado
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Usuário Teste',
  },
  created_at: '2024-01-01T00:00:00.000Z',
}

// Mock da sessão
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
}

// Mock do Supabase - definido como função para evitar problemas de inicialização
export const createMockSupabase = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession, user: mockUser }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: mockSession, user: mockUser }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://mock-oauth-url.com' }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
})

export const mockSupabase = createMockSupabase()

// Mock de receitas
export const mockReceitas = [
  {
    id: '1',
    numero: 'REC-001',
    cliente_nome: 'Cliente Teste 1',
    cliente_email: 'cliente1@test.com',
    valor: 1000.00,
    data_vencimento: '2024-02-01',
    status: 'pendente' as const,
    descricao: 'Serviços de consultoria',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    user_id: mockUser.id,
  },
  {
    id: '2',
    numero: 'REC-002',
    cliente_nome: 'Cliente Teste 2',
    cliente_email: 'cliente2@test.com',
    valor: 2500.00,
    data_vencimento: '2024-02-15',
    status: 'pago' as const,
    descricao: 'Desenvolvimento de sistema',
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-20T00:00:00.000Z',
    user_id: mockUser.id,
  },
]

// Mock de pagamentos
export const mockPagamentos = [
  {
    id: '1',
    receita_id: '2',
    valor: 2500.00,
    data_pagamento: '2024-01-20',
    metodo_pagamento: 'pix' as const,
    observacoes: 'Pagamento via PIX',
    created_at: '2024-01-20T00:00:00.000Z',
    user_id: mockUser.id,
  },
]

// Provider customizado para testes
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  user?: typeof mockUser | null
  session?: typeof mockSession | null
}

const AllTheProviders: React.FC<{
  children: React.ReactNode
  initialEntries?: string[]
  user?: typeof mockUser | null
  session?: typeof mockSession | null
}> = ({ children, initialEntries = ['/'], user = mockUser, session = mockSession }) => {
  // Mock do contexto de autenticação
  const mockAuthContext = {
    user,
    session,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
  }

  return (
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <Toaster position="top-right" />
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, user, session, ...renderOptions } = options
  
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        initialEntries={initialEntries} 
        user={user} 
        session={session}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper para aguardar carregamento
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100))
}

// Helper para simular delay de API
export const mockApiDelay = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}