// Autor: David Assef
// Descrição: Serviço para gerenciar pagamentos via API (alinhado ao backend real)
// Data: 31-08-2025
// MIT License

import { apiClient, ApiResponse } from './api';
import { Pagamento, PagamentoForm, FormaPagamento } from '../types/pagamento';

// Tipos DTO do backend (Go)
interface BackendPayment {
  id: string;
  income_id: string;
  valor: number;
  pago_em: string; // RFC3339
  metodo?: string | null;
  obs?: string | null;
  created_at?: string | null;
}

interface BackendPaymentRequest {
  income_id: string;
  valor: number;
  pago_em?: string; // RFC3339 opcional
  metodo?: string;
  obs?: string;
}

interface BackendPaymentResponse {
  payment: BackendPayment;
  // income atualizado é retornado pelo backend, mas não é utilizado aqui
  income: unknown;
}

// Interface para resposta de pagamentos de uma receita (compat com hook atual)
export interface ReceitaPagamentos {
  receita_id: number;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  pagamentos: Pagamento[];
}

// Interface para estatísticas de pagamentos (placeholder para compatibilidade)
export interface PagamentosStats {
  total_pagamentos: number;
  valor_total_recebido: number;
  pagamentos_hoje: number;
  valor_hoje: number;
  pagamentos_mes: number;
  valor_mes: number;
}

// Mapeadores entre domínio (frontend) e DTO (backend)
const toBackendPaymentRequest = (receitaId: string, form: PagamentoForm): BackendPaymentRequest => ({
  income_id: receitaId,
  valor: form.valor,
  pago_em: form.data_pagamento,
  metodo: form.forma_pagamento,
  obs: form.observacoes,
});

const fromBackendPayment = (p: BackendPayment): Pagamento => {
  const metodo = (p.metodo as FormaPagamento | null) ?? FormaPagamento.OUTROS;
  const createdAt = p.created_at ?? p.pago_em;
  return {
    id: p.id,
    receita_id: p.income_id,
    valor: p.valor,
    data_pagamento: p.pago_em,
    forma_pagamento: metodo,
    observacoes: p.obs ?? undefined,
    created_at: createdAt,
    updated_at: createdAt,
  };
};

// Classe do serviço de pagamentos
export class PagamentosService {
  private readonly basePath = '/payments';

  // Registrar novo pagamento
  async create(receitaId: string, pagamento: PagamentoForm): Promise<ApiResponse<Pagamento>> {
    if (!receitaId) {
      return { data: null, error: 'receita_id é obrigatório para registrar pagamento' };
    }

    const payload = toBackendPaymentRequest(receitaId, pagamento);
    const res = await apiClient.post<BackendPaymentResponse>(this.basePath, payload);
    if (res.error || !res.data) {
      return { data: null, error: res.error ?? 'Erro ao registrar pagamento' };
    }

    const mapped = fromBackendPayment(res.data.payment);
    return { data: mapped, error: null };
  }

  // Obter pagamentos de uma receita específica
  async getByReceita(receitaId: number): Promise<ApiResponse<ReceitaPagamentos>> {
    const res = await apiClient.get<{ payments: BackendPayment[] }>(`/incomes/${receitaId}/payments`);
    if (res.error || !res.data) {
      return { data: null, error: res.error ?? 'Erro ao buscar pagamentos' };
    }

    const pagamentos = res.data.payments.map(fromBackendPayment);
    const resposta: ReceitaPagamentos = {
      receita_id: receitaId,
      valor_total: 0, // não disponível nesta rota
      valor_pago: pagamentos.reduce((sum, p) => sum + p.valor, 0),
      valor_restante: 0, // não disponível nesta rota
      pagamentos,
    };

    return { data: resposta, error: null };
  }

  // Obter pagamento por ID (não suportado no backend atual)
  async getById(id: number): Promise<ApiResponse<Pagamento>> {
    void id;
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Listar todos os pagamentos do usuário (não suportado no backend atual)
  async list(params?: {
    page?: number;
    limit?: number;
    receita_id?: number;
    forma_pagamento?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<ApiResponse<{
    items: Pagamento[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }>> {
    void params;
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Obter estatísticas de pagamentos (não suportado no backend atual)
  async getStats(): Promise<ApiResponse<PagamentosStats>> {
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Cancelar/estornar pagamento (não suportado no backend atual)
  async cancel(_id: number, _motivo?: string): Promise<ApiResponse<void>> {
    void _id; void _motivo;
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Validar se um pagamento pode ser registrado (não suportado no backend atual)
  async validatePayment(_pagamento: PagamentoForm): Promise<ApiResponse<{ valid: boolean; errors?: string[]; warnings?: string[] }>> {
    void _pagamento;
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Obter histórico de pagamentos de uma receita (não suportado no backend atual)
  async getHistorico(_receitaId: number): Promise<ApiResponse<Pagamento[]>> {
    void _receitaId;
    return { data: null, error: 'Endpoint não suportado no backend' };
  }

  // Registrar pagamento com "validação" (degrada para create)
  async createWithValidation(pagamento: PagamentoForm): Promise<ApiResponse<Pagamento>> {
    // Esta função é mantida por compatibilidade, mas utiliza a criação direta
    return this.create('', pagamento);
  }
}

// Instância global do serviço
export const pagamentosService = new PagamentosService();

// Funções utilitárias para compatibilidade
export const {
  create: createPagamento,
  getByReceita: getPagamentosByReceita,
  getById: getPagamentoById,
  list: listPagamentos,
  getStats: getPagamentosStats,
  cancel: cancelPagamento,
  validatePayment: validatePagamento,
  getHistorico: getHistoricoPagamentos,
  createWithValidation: createPagamentoWithValidation,
} = pagamentosService;