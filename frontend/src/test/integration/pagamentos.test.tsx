// MIT License
// Autor atual: David Assef
// Descrição: Testes de integração para fluxo de pagamentos
// Data: 21-01-2025

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabase, mockUser, mockSession, mockPagamentos } from '../utils'
import Receitas from '../../pages/Receitas'
import { PagamentoModal } from '../../components/PagamentoModal'

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

// Mock do hook usePagamentos
const mockUsePagamentos = {
  pagamentos: mockPagamentos,
  loading: false,
  error: null,
  searchTerm: '',
  setSearchTerm: vi.fn(),
  statusFilter: 'todos' as const,
  setStatusFilter: vi.fn(),
  createPagamento: vi.fn(),
  updatePagamento: vi.fn(),
  deletePagamento: vi.fn(),
  refreshPagamentos: vi.fn(),
}

vi.mock('../../hooks/usePagamentos', () => ({
  default: () => mockUsePagamentos,
}))

// Mock do hook useReceitas para o select de receitas
const mockUseReceitas = {
  receitas: [
    {
      id: '1',
      numero: 'REC-001',
      cliente_nome: 'Cliente Teste 1',
      valor: 1000.00,
      status: 'pendente',
    },
    {
      id: '2',
      numero: 'REC-002',
      cliente_nome: 'Cliente Teste 2',
      valor: 2500.00,
      status: 'pendente',
    },
  ],
  loading: false,
  error: null,
}

vi.mock('../../hooks/useReceitas', () => ({
  default: () => mockUseReceitas,
}))

describe('Fluxo de Pagamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.loading.mockClear()
    
    // Reset mock values
    mockUsePagamentos.pagamentos = mockPagamentos
    mockUsePagamentos.loading = false
    mockUsePagamentos.error = null
    mockUsePagamentos.searchTerm = ''
    mockUsePagamentos.statusFilter = 'todos'
  })

  describe('Página de Receitas com Pagamentos', () => {
    it('deve renderizar a página de receitas', async () => {
      render(<Receitas />)
      
      expect(screen.getByText('Receitas')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /nova receita/i })).toBeInTheDocument()
    })

    it('deve mostrar estado de carregamento', async () => {
      mockUseReceitas.loading = true
      mockUseReceitas.receitas = []
      
      render(<Receitas />)
      
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })

    it('deve mostrar estado vazio', async () => {
      mockUseReceitas.receitas = []
      
      render(<Receitas />)
      
      expect(screen.getByText(/nenhuma receita encontrada/i)).toBeInTheDocument()
    })

    it('deve permitir busca por receitas', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const searchInput = screen.getByPlaceholderText(/buscar receitas/i)
      await user.type(searchInput, 'Receita teste')
      
      expect(searchInput).toHaveValue('Receita teste')
    })

    it('deve permitir filtrar por status', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const statusFilter = screen.getByRole('combobox', { name: /status/i })
      await user.selectOptions(statusFilter, 'pago')
      
      expect(statusFilter).toHaveValue('pago')
    })

    it('deve navegar para criação de receita', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const newButton = screen.getByRole('button', { name: /nova receita/i })
      await user.click(newButton)
      
      // Verificar se o modal/formulário foi aberto
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('deve navegar para edição de receita', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const editButtons = screen.getAllByRole('button', { name: /editar/i })
      await user.click(editButtons[0])
      
      // Verificar se o modal/formulário foi aberto
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('deve permitir exclusão de receita', async () => {
      const user = userEvent.setup()
      render(<Receitas />)
      
      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i })
      await user.click(deleteButtons[0])
      
      // Verificar se o modal de confirmação foi aberto
      expect(screen.getByText(/confirmar exclusão/i)).toBeInTheDocument()
    })

    it('deve exibir status com cores corretas', () => {
      render(<Receitas />)
      
      // Verificar se os status estão sendo exibidos com as classes corretas
      const statusPago = screen.getByText('Pago')
      expect(statusPago).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('deve mostrar botão de pagamento para receitas não pagas', () => {
      render(<Receitas />)
      
      const pagamentoButtons = screen.getAllByTitle('Registrar Pagamento')
      expect(pagamentoButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Modal de Pagamento', () => {
    const mockReceita = {
      id: '1',
      titulo: 'Receita Teste',
      valor: 1000,
      status: 'pendente' as const,
      cliente_nome: 'Cliente Teste',
      data_vencimento: '2024-01-15',
      categoria: 'servico' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      user_id: 'user-1'
    }

    it('deve renderizar o modal de pagamento', () => {
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={vi.fn()} />)
      
      expect(screen.getByText(/registrar pagamento/i)).toBeInTheDocument()
      expect(screen.getByText('Receita Teste')).toBeInTheDocument()
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/método de pagamento/i)).toBeInTheDocument()
    })

    it('deve validar campos obrigatórios', async () => {
      const user = userEvent.setup()
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={vi.fn()} />)
      
      const submitButton = screen.getByRole('button', { name: /registrar/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/valor é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/método de pagamento é obrigatório/i)).toBeInTheDocument()
    })

    it('deve registrar pagamento com sucesso', async () => {
      const user = userEvent.setup()
      const mockOnPagamentoRegistrado = vi.fn()
      
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={mockOnPagamentoRegistrado} />)
      
      // Preencher formulário
      await user.type(screen.getByLabelText(/valor/i), '1000')
      await user.selectOptions(screen.getByLabelText(/método de pagamento/i), 'pix')
      
      const submitButton = screen.getByRole('button', { name: /registrar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnPagamentoRegistrado).toHaveBeenCalled()
      })
    })

    it('deve preencher valor automaticamente com valor da receita', () => {
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={vi.fn()} />)
      
      const valorInput = screen.getByLabelText(/valor/i) as HTMLInputElement
      expect(valorInput.value).toBe('1000')
    })

    it('deve validar valor máximo baseado na receita', async () => {
      const user = userEvent.setup()
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={vi.fn()} />)
      
      await user.clear(screen.getByLabelText(/valor/i))
      await user.type(screen.getByLabelText(/valor/i), '2000')
      
      const submitButton = screen.getByRole('button', { name: /registrar/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/valor não pode ser maior que o valor da receita/i)).toBeInTheDocument()
    })

    it('deve exibir métodos de pagamento disponíveis', () => {
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={vi.fn()} onPagamentoRegistrado={vi.fn()} />)
      
      const metodoPagamento = screen.getByLabelText(/método de pagamento/i)
      expect(metodoPagamento).toBeInTheDocument()
      
      // Verificar se as opções estão disponíveis
      expect(screen.getByText('PIX')).toBeInTheDocument()
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument()
      expect(screen.getByText('Dinheiro')).toBeInTheDocument()
    })

    it('deve permitir fechar modal', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(<PagamentoModal isOpen={true} receita={mockReceita} onClose={mockOnClose} onPagamentoRegistrado={vi.fn()} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Integração Receitas-Pagamentos', () => {
    it('deve atualizar status da receita após pagamento completo', async () => {
      const user = userEvent.setup()
      mockUsePagamentos.createPagamento.mockResolvedValue({
        id: '3',
        receita_id: '1',
        valor_pago: 1000.00,
        data_pagamento: '2024-01-21',
        metodo_pagamento: 'pix',
        status: 'confirmado',
        observacoes: '',
        created_at: '2024-01-21T00:00:00.000Z',
        updated_at: '2024-01-21T00:00:00.000Z',
        user_id: mockUser.id,
      })
      
      render(<PagamentoForm />)
      
      // Registrar pagamento completo
      await user.selectOptions(screen.getByLabelText(/receita/i), '1')
      await user.type(screen.getByLabelText(/data do pagamento/i), '2024-01-21')
      await user.selectOptions(screen.getByLabelText(/método de pagamento/i), 'pix')
      
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUsePagamentos.createPagamento).toHaveBeenCalled()
      })
    })

    it('deve permitir pagamento parcial', async () => {
      const user = userEvent.setup()
      mockUsePagamentos.createPagamento.mockResolvedValue({
        id: '3',
        receita_id: '1',
        valor_pago: 500.00,
        data_pagamento: '2024-01-21',
        metodo_pagamento: 'pix',
        status: 'confirmado',
        observacoes: 'Pagamento parcial',
        created_at: '2024-01-21T00:00:00.000Z',
        updated_at: '2024-01-21T00:00:00.000Z',
        user_id: mockUser.id,
      })
      
      render(<PagamentoForm />)
      
      // Registrar pagamento parcial
      await user.selectOptions(screen.getByLabelText(/receita/i), '1')
      await user.clear(screen.getByLabelText(/valor pago/i))
      await user.type(screen.getByLabelText(/valor pago/i), '500')
      await user.type(screen.getByLabelText(/data do pagamento/i), '2024-01-21')
      await user.selectOptions(screen.getByLabelText(/método de pagamento/i), 'pix')
      await user.type(screen.getByLabelText(/observações/i), 'Pagamento parcial')
      
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUsePagamentos.createPagamento).toHaveBeenCalledWith({
          receita_id: '1',
          valor_pago: 500,
          data_pagamento: '2024-01-21',
          metodo_pagamento: 'pix',
          observacoes: 'Pagamento parcial',
        })
      })
    })
  })
})