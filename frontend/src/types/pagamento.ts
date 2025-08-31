// MIT License
// Autor: David Assef
// Descrição: Interfaces TypeScript para Pagamentos
// Data: 29-01-2025

/**
 * Interface principal para Pagamento
 * Representa um pagamento de receita no sistema
 */
export interface Pagamento {
  id: string;
  receita_id: string;
  valor: number;
  data_pagamento: string; // ISO date string
  forma_pagamento: FormaPagamento;
  observacoes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Interface para formulário de Pagamento
 * Campos necessários para registrar um pagamento
 */
export interface PagamentoForm {
  valor: number;
  data_pagamento: string; // ISO date string
  forma_pagamento: FormaPagamento;
  observacoes?: string;
}

/**
 * Enum para formas de pagamento
 */
export enum FormaPagamento {
  DINHEIRO = 'dinheiro',
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  TRANSFERENCIA = 'transferencia',
  BOLETO = 'boleto',
  OUTROS = 'outros'
}

/**
 * Interface para histórico de pagamentos de uma receita
 */
export interface HistoricoPagamentos {
  receita_id: string;
  pagamentos: Pagamento[];
  valor_total_receita: number;
  valor_total_pago: number;
  valor_restante: number;
  status_pagamento: 'pendente' | 'parcial' | 'completo';
}

/**
 * Interface para resposta de pagamentos
 */
export interface PagamentosResponse {
  data: Pagamento[];
  total: number;
  valor_total_pago: number;
  valor_restante: number;
}

/**
 * Interface para validação de pagamento
 */
export interface PagamentoValidation {
  valor_maximo: number;
  valor_restante: number;
  permite_pagamento_parcial: boolean;
}

/**
 * Type para eventos de pagamento
 */
export type PagamentoEvent = 
  | { type: 'CREATE'; payload: Pagamento }
  | { type: 'UPDATE'; payload: Pagamento }
  | { type: 'DELETE'; payload: string };

/**
 * Interface para estatísticas de pagamentos
 */
export interface PagamentoStats {
  total_pagamentos: number;
  valor_total_pago: number;
  pagamentos_hoje: number;
  valor_pago_hoje: number;
}

/**
 * Interface para histórico de pagamentos
 */
export interface PagamentoHistorico {
  id: string;
  receita_id: string;
  valor: number;
  tipo_pagamento: FormaPagamento;
  data_pagamento: string;
  observacoes?: string;
  created_at: string;
}

/**
 * Interface para ações de pagamento
 */
export interface PagamentoActions {
  create: (receitaId: string, pagamento: PagamentoForm) => Promise<Pagamento>;
  getByReceita: (receitaId: string) => Promise<PagamentosResponse>;
  delete: (id: string) => Promise<void>;
}

/**
 * Utilitários para formatação
 */
export const getFormaPagamentoLabel = (forma: FormaPagamento): string => {
  switch (forma) {
    case FormaPagamento.DINHEIRO:
      return 'Dinheiro';
    case FormaPagamento.PIX:
      return 'PIX';
    case FormaPagamento.CARTAO_CREDITO:
      return 'Cartão de Crédito';
    case FormaPagamento.CARTAO_DEBITO:
      return 'Cartão de Débito';
    case FormaPagamento.TRANSFERENCIA:
      return 'Transferência Bancária';
    case FormaPagamento.BOLETO:
      return 'Boleto';
    case FormaPagamento.OUTROS:
      return 'Outros';
    default:
      return forma;
  }
};