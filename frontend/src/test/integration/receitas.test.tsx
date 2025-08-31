// MIT License
// Autor atual: David Assef
// Descrição: Testes de integração para fluxo de receitas
// Data: 21-01-2025

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabase, mockUser, mockSession, mockReceitas } from '../utils'
import Receitas from '../../pages/Receitas'
import ReceitaForm from '../../components/ReceitaForm'

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
    useParams: () => ({ id: undefined }),
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

// Mock do hook useReceitas
const mockUseReceitas = {
  receitas: mockReceitas,
  loading: false,
  error: null,
  searchTerm: '',
  setSearchTerm: vi.fn(),
  statusFilter: 'todos' as const,
  setStatusFilter: vi.fn(),
  createReceita: vi.fn(),
  updateReceita: vi.fn(),
  deleteReceita: vi.fn(),
  refreshReceitas: vi.fn(),
}

vi.mock('../../hooks/useReceitas', () => ({
  default: () => mockUseReceitas,
}))

describe('Fluxo de Receitas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Reset mock values
    mockUseReceitas.receitas = mockReceitas
    mockUseReceitas.loading = false
    mockUseReceitas.error = null
    mockUseReceitas.searchTerm = ''
    mockUseReceitas.statusFilter = 'todos'
  })

  describe('Lista de Receitas', () => {
    it('deve renderizar a lista de receitas corretamente', () => {
      render(<Receitas />)
      
      expect(screen.getByText('Receitas')).toBeInTheDocument()
      expect(screen.getByText('Cliente Teste 1')).toBeInTheDocument()
      expect(screen.getByText('Cliente Teste 2')).toBeInTheDocument()
      expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
      expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument()
    })

    it('deve exibir estado de carregamento', () => {
      mockUseReceitas.loading = true
      mockUseReceitas.receitas = []
      
      render(<Receitas />)
      
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })

    it('deve exibir mensagem quando não há receitas', () => {
      mockUseReceitas.receitas = []
      
      render(<Receitas />)
      
      expect(screen.getByText(/nenhuma receita encontrada/i)).toBeInTheDocument()
    })

    it('deve permitir buscar receitas', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const searchInput = screen.getByPlaceholderText(/buscar receitas/i)
      await user.type(searchInput, 'Cliente Teste 1')
      
      expect(mockUseReceitas.setSearchTerm).toHaveBeenCalledWith('Cliente Teste 1')
    })

    it('deve permitir filtrar por status', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const statusFilter = screen.getByDisplayValue(/todos/i)
      await user.selectOptions(statusFilter, 'pendente')
      
      expect(mockUseReceitas.setStatusFilter).toHaveBeenCalledWith('pendente')
    })

    it('deve navegar para criação de nova receita', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const newButton = screen.getByRole('button', { name: /nova receita/i })
      await user.click(newButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas/nova')
    })

    it('deve permitir editar receita', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const editButtons = screen.getAllByRole('button', { name: /editar/i })
      await user.click(editButtons[0])
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas/1/editar')
    })

    it('deve permitir excluir receita', async () => {
      const user = userEvent.setup()
      mockUseReceitas.deleteReceita.mockResolvedValue(undefined)
      
      render(<Receitas />)
      
      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i })
      await user.click(deleteButtons[0])
      
      // Confirmar exclusão
      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockUseReceitas.deleteReceita).toHaveBeenCalledWith('1')
      })
    })
  })

  describe('Formulário de Receita', () => {
    it('deve renderizar o formulário corretamente', () => {
      render(<ReceitaForm />)
      
      expect(screen.getByLabelText(/número da receita/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nome do cliente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email do cliente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/data de vencimento/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    })

    it('deve validar campos obrigatórios', async () => {
      const user = userEvent.setup()
      render(<ReceitaForm />)
      
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/número é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/nome do cliente é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/valor é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/data de vencimento é obrigatória/i)).toBeInTheDocument()
      })
    })

    it('deve validar formato de email', async () => {
      const user = userEvent.setup()
      render(<ReceitaForm />)
      
      const emailInput = screen.getByLabelText(/email do cliente/i)
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      
      await user.type(emailInput, 'email-invalido')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email deve ter um formato válido/i)).toBeInTheDocument()
      })
    })

    it('deve validar valor mínimo', async () => {
      const user = userEvent.setup()
      render(<ReceitaForm />)
      
      const valorInput = screen.getByLabelText(/valor/i)
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      
      await user.type(valorInput, '0')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/valor deve ser maior que zero/i)).toBeInTheDocument()
      })
    })

    it('deve criar receita com sucesso', async () => {
      const user = userEvent.setup()
      mockUseReceitas.createReceita.mockResolvedValue({
        id: '3',
        numero: 'REC-003',
        cliente_nome: 'Novo Cliente',
        cliente_email: 'novo@cliente.com',
        valor: 1500.00,
        data_vencimento: '2024-03-01',
        status: 'pendente',
        descricao: 'Nova receita teste',
        created_at: '2024-01-21T00:00:00.000Z',
        updated_at: '2024-01-21T00:00:00.000Z',
        user_id: mockUser.id,
      })
      
      render(<ReceitaForm />)
      
      // Preencher formulário
      await user.type(screen.getByLabelText(/número da receita/i), 'REC-003')
      await user.type(screen.getByLabelText(/nome do cliente/i), 'Novo Cliente')
      await user.type(screen.getByLabelText(/email do cliente/i), 'novo@cliente.com')
      await user.type(screen.getByLabelText(/valor/i), '1500')
      await user.type(screen.getByLabelText(/data de vencimento/i), '2024-03-01')
      await user.type(screen.getByLabelText(/descrição/i), 'Nova receita teste')
      
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUseReceitas.createReceita).toHaveBeenCalledWith({
          numero: 'REC-003',
          cliente_nome: 'Novo Cliente',
          cliente_email: 'novo@cliente.com',
          valor: 1500,
          data_vencimento: '2024-03-01',
          descricao: 'Nova receita teste',
        })
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas')
    })

    it('deve exibir erro ao falhar na criação', async () => {
      const user = userEvent.setup()
      mockUseReceitas.createReceita.mockRejectedValue(new Error('Erro ao criar receita'))
      
      render(<ReceitaForm />)
      
      // Preencher formulário
      await user.type(screen.getByLabelText(/número da receita/i), 'REC-003')
      await user.type(screen.getByLabelText(/nome do cliente/i), 'Novo Cliente')
      await user.type(screen.getByLabelText(/email do cliente/i), 'novo@cliente.com')
      await user.type(screen.getByLabelText(/valor/i), '1500')
      await user.type(screen.getByLabelText(/data de vencimento/i), '2024-03-01')
      
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUseReceitas.createReceita).toHaveBeenCalled()
      })
    })

    it('deve formatar valor monetário corretamente', async () => {
      const user = userEvent.setup()
      render(<ReceitaForm />)
      
      const valorInput = screen.getByLabelText(/valor/i)
      await user.type(valorInput, '1234.56')
      
      expect(valorInput).toHaveValue('1234.56')
    })

    it('deve cancelar e voltar para lista', async () => {
      const user = userEvent.setup()
      render(<ReceitaForm />)
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas')
    })
  })
})