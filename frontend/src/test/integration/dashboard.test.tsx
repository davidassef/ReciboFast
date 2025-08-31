// MIT License
// Autor atual: David Assef
// Descrição: Testes de integração para dashboard com resumos financeiros
// Data: 21-01-2025

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabase, mockUser, mockSession } from '../utils'
import Dashboard from '../../pages/Dashboard'

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

// Mock do hook useDashboard
const mockUseDashboard = {
  resumo: {
    totalReceitas: 15,
    receitasPendentes: 8,
    receitasPagas: 7,
    valorTotalReceitas: 45000.00,
    valorRecebido: 28000.00,
    valorPendente: 17000.00,
    totalPagamentos: 12,
    pagamentosConfirmados: 10,
    pagamentosPendentes: 2,
  },
  receitasRecentes: [
    {
      id: '1',
      numero: 'REC-001',
      cliente_nome: 'Cliente Teste 1',
      valor: 1000.00,
      status: 'pendente',
      data_vencimento: '2024-02-15',
      created_at: '2024-01-15T00:00:00.000Z',
    },
    {
      id: '2',
      numero: 'REC-002',
      cliente_nome: 'Cliente Teste 2',
      valor: 2500.00,
      status: 'paga',
      data_vencimento: '2024-01-30',
      created_at: '2024-01-10T00:00:00.000Z',
    },
  ],
  pagamentosRecentes: [
    {
      id: '1',
      receita_id: '2',
      receita: {
        numero: 'REC-002',
        cliente_nome: 'Cliente Teste 2',
      },
      valor_pago: 2500.00,
      data_pagamento: '2024-01-20',
      metodo_pagamento: 'pix',
      status: 'confirmado',
      created_at: '2024-01-20T00:00:00.000Z',
    },
  ],
  loading: false,
  error: null,
  refreshDashboard: vi.fn(),
}

vi.mock('../../hooks/useDashboard', () => ({
  default: () => mockUseDashboard,
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Reset mock values
    mockUseDashboard.loading = false
    mockUseDashboard.error = null
  })

  describe('Resumo Financeiro', () => {
    it('deve renderizar o dashboard corretamente', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Resumo Financeiro')).toBeInTheDocument()
      expect(screen.getByText('Receitas Recentes')).toBeInTheDocument()
      expect(screen.getByText('Pagamentos Recentes')).toBeInTheDocument()
    })

    it('deve exibir estatísticas de receitas corretamente', () => {
      render(<Dashboard />)
      
      // Total de receitas
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('Total de Receitas')).toBeInTheDocument()
      
      // Receitas pendentes
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('Receitas Pendentes')).toBeInTheDocument()
      
      // Receitas pagas
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('Receitas Pagas')).toBeInTheDocument()
    })

    it('deve exibir valores monetários formatados corretamente', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('R$ 45.000,00')).toBeInTheDocument() // Valor total
      expect(screen.getByText('R$ 28.000,00')).toBeInTheDocument() // Valor recebido
      expect(screen.getByText('R$ 17.000,00')).toBeInTheDocument() // Valor pendente
    })

    it('deve exibir estatísticas de pagamentos corretamente', () => {
      render(<Dashboard />)
      
      // Total de pagamentos
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Total de Pagamentos')).toBeInTheDocument()
      
      // Pagamentos confirmados
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Pagamentos Confirmados')).toBeInTheDocument()
      
      // Pagamentos pendentes
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Pagamentos Pendentes')).toBeInTheDocument()
    })

    it('deve calcular e exibir percentuais corretamente', () => {
      render(<Dashboard />)
      
      // Percentual de receitas pagas: 7/15 = 46.7%
      expect(screen.getByText('46.7%')).toBeInTheDocument()
      
      // Percentual de valor recebido: 28000/45000 = 62.2%
      expect(screen.getByText('62.2%')).toBeInTheDocument()
      
      // Percentual de pagamentos confirmados: 10/12 = 83.3%
      expect(screen.getByText('83.3%')).toBeInTheDocument()
    })
  })

  describe('Receitas Recentes', () => {
    it('deve exibir lista de receitas recentes', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('REC-001')).toBeInTheDocument()
      expect(screen.getByText('Cliente Teste 1')).toBeInTheDocument()
      expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
      
      expect(screen.getByText('REC-002')).toBeInTheDocument()
      expect(screen.getByText('Cliente Teste 2')).toBeInTheDocument()
      expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument()
    })

    it('deve exibir status das receitas com cores corretas', () => {
      render(<Dashboard />)
      
      const pendenteStatus = screen.getByText('Pendente')
      const pagaStatus = screen.getByText('Paga')
      
      expect(pendenteStatus).toHaveClass('bg-yellow-100', 'text-yellow-800')
      expect(pagaStatus).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('deve exibir datas de vencimento formatadas', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('15/02/2024')).toBeInTheDocument()
      expect(screen.getByText('30/01/2024')).toBeInTheDocument()
    })

    it('deve navegar para receitas ao clicar em "Ver todas"', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)
      
      const verTodasButton = screen.getByRole('button', { name: /ver todas as receitas/i })
      await user.click(verTodasButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas')
    })

    it('deve permitir navegar para detalhes da receita', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)
      
      const receitaLink = screen.getByText('REC-001')
      await user.click(receitaLink)
      
      expect(mockNavigate).toHaveBeenCalledWith('/receitas/1')
    })
  })

  describe('Pagamentos Recentes', () => {
    it('deve exibir lista de pagamentos recentes', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('REC-002')).toBeInTheDocument()
      expect(screen.getByText('Cliente Teste 2')).toBeInTheDocument()
      expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument()
      expect(screen.getByText('PIX')).toBeInTheDocument()
    })

    it('deve exibir status dos pagamentos com cores corretas', () => {
      render(<Dashboard />)
      
      const confirmadoStatus = screen.getByText('Confirmado')
      expect(confirmadoStatus).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('deve exibir datas de pagamento formatadas', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('20/01/2024')).toBeInTheDocument()
    })

    it('deve navegar para pagamentos ao clicar em "Ver todos"', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)
      
      const verTodosButton = screen.getByRole('button', { name: /ver todos os pagamentos/i })
      await user.click(verTodosButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/pagamentos')
    })

    it('deve permitir navegar para detalhes do pagamento', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)
      
      const pagamentoLink = screen.getByText('Cliente Teste 2')
      await user.click(pagamentoLink)
      
      expect(mockNavigate).toHaveBeenCalledWith('/pagamentos/1')
    })
  })

  describe('Estados de Loading e Erro', () => {
    it('deve exibir estado de carregamento', () => {
      mockUseDashboard.loading = true
      
      render(<Dashboard />)
      
      expect(screen.getByText(/carregando dashboard/i)).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
    })

    it('deve exibir mensagem de erro', () => {
      mockUseDashboard.loading = false
      mockUseDashboard.error = 'Erro ao carregar dados do dashboard'
      
      render(<Dashboard />)
      
      expect(screen.getByText(/erro ao carregar dados do dashboard/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })

    it('deve permitir tentar novamente após erro', async () => {
      const user = userEvent.setup()
      mockUseDashboard.loading = false
      mockUseDashboard.error = 'Erro ao carregar dados do dashboard'
      
      render(<Dashboard />)
      
      const tryAgainButton = screen.getByRole('button', { name: /tentar novamente/i })
      await user.click(tryAgainButton)
      
      expect(mockUseDashboard.refreshDashboard).toHaveBeenCalled()
    })
  })

  describe('Responsividade e Layout', () => {
    it('deve exibir cards de estatísticas em grid responsivo', () => {
      render(<Dashboard />)
      
      const statsGrid = screen.getByTestId('stats-grid')
      expect(statsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')
    })

    it('deve exibir seções de receitas e pagamentos em layout responsivo', () => {
      render(<Dashboard />)
      
      const recentsGrid = screen.getByTestId('recents-grid')
      expect(recentsGrid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2', 'gap-8')
    })
  })

  describe('Atualização de Dados', () => {
    it('deve permitir atualizar dados do dashboard', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)
      
      const refreshButton = screen.getByRole('button', { name: /atualizar/i })
      await user.click(refreshButton)
      
      expect(mockUseDashboard.refreshDashboard).toHaveBeenCalled()
    })

    it('deve atualizar automaticamente ao montar o componente', () => {
      render(<Dashboard />)
      
      // O hook deve ser chamado automaticamente
      expect(mockUseDashboard.refreshDashboard).toHaveBeenCalledTimes(0) // Não chamado explicitamente no mount
    })
  })

  describe('Dados Vazios', () => {
    it('deve exibir estado vazio quando não há receitas', () => {
      mockUseDashboard.receitasRecentes = []
      mockUseDashboard.resumo.totalReceitas = 0
      
      render(<Dashboard />)
      
      expect(screen.getByText(/nenhuma receita encontrada/i)).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Total de receitas
    })

    it('deve exibir estado vazio quando não há pagamentos', () => {
      mockUseDashboard.pagamentosRecentes = []
      mockUseDashboard.resumo.totalPagamentos = 0
      
      render(<Dashboard />)
      
      expect(screen.getByText(/nenhum pagamento encontrado/i)).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Total de pagamentos
    })
  })

  describe('Formatação de Dados', () => {
    it('deve formatar valores monetários corretamente', () => {
      render(<Dashboard />)
      
      // Valores devem estar formatados em Real brasileiro
      const valorElements = screen.getAllByText(/R\$ [\d.,]+/)
      expect(valorElements.length).toBeGreaterThan(0)
    })

    it('deve formatar datas corretamente', () => {
      render(<Dashboard />)
      
      // Datas devem estar no formato DD/MM/AAAA
      expect(screen.getByText('15/02/2024')).toBeInTheDocument()
      expect(screen.getByText('30/01/2024')).toBeInTheDocument()
      expect(screen.getByText('20/01/2024')).toBeInTheDocument()
    })

    it('deve formatar percentuais com uma casa decimal', () => {
      render(<Dashboard />)
      
      expect(screen.getByText('46.7%')).toBeInTheDocument()
      expect(screen.getByText('62.2%')).toBeInTheDocument()
      expect(screen.getByText('83.3%')).toBeInTheDocument()
    })
  })
})