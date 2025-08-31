// MIT License
// Autor atual: David Assef
// Descrição: Testes de integração para fluxo de autenticação
// Data: 21-01-2025

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabase, mockUser, mockSession } from '../utils'
import Login from '../../pages/Login'
import Register from '../../pages/Register'

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ 
        data: { 
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'test@example.com',
              user_metadata: { full_name: 'Usuário Teste' },
              created_at: '2024-01-01T00:00:00.000Z',
            }
          }
        }, 
        error: null 
      }),
      getUser: vi.fn().mockResolvedValue({ 
        data: { 
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            user_metadata: { full_name: 'Usuário Teste' },
            created_at: '2024-01-01T00:00:00.000Z',
          }
        }, 
        error: null 
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
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
  })),
}))

// Mock do react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}))

describe('Fluxo de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Login', () => {
    it('deve renderizar o formulário de login corretamente', () => {
      render(<Login />, { user: null, session: null })
      
      expect(screen.getByText('Entrar no ReciboFast')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
      expect(screen.getByText(/não tem uma conta/i)).toBeInTheDocument()
    })

    it('deve validar campos obrigatórios', async () => {
      const user = userEvent.setup()
      render(<Login />, { user: null, session: null })
      
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument()
      })
    })

    it('deve validar formato de email', async () => {
      const user = userEvent.setup()
      render(<Login />, { user: null, session: null })
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      
      await user.type(emailInput, 'email-invalido')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email deve ter um formato válido/i)).toBeInTheDocument()
      })
    })

    it('deve realizar login com sucesso', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      
      render(<Login />, { user: null, session: null })
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('deve exibir erro ao falhar no login', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Credenciais inválidas' },
      })
      
      render(<Login />, { user: null, session: null })
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'senhaerrada')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
      })
    })

    it('deve permitir login com Google', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://google.com/oauth' },
        error: null,
      })
      
      render(<Login />, { user: null, session: null })
      
      const googleButton = screen.getByRole('button', { name: /continuar com google/i })
      await user.click(googleButton)
      
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/dashboard'),
          },
        })
      })
    })
  })

  describe('Registro', () => {
    it('deve renderizar o formulário de registro corretamente', () => {
      render(<Register />, { user: null, session: null })
      
      expect(screen.getByText('Criar conta no ReciboFast')).toBeInTheDocument()
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
    })

    it('deve validar confirmação de senha', async () => {
      const user = userEvent.setup()
      render(<Register />, { user: null, session: null })
      
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /criar conta/i })
      
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
      })
    })

    it('deve realizar registro com sucesso', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })
      
      render(<Register />, { user: null, session: null })
      
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /criar conta/i })
      
      await user.type(nameInput, 'Usuário Teste')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Usuário Teste',
            },
          },
        })
      })
    })

    it('deve exibir erro ao falhar no registro', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email já está em uso' },
      })
      
      render(<Register />, { user: null, session: null })
      
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /criar conta/i })
      
      await user.type(nameInput, 'Usuário Teste')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email já está em uso/i)).toBeInTheDocument()
      })
    })
  })
})