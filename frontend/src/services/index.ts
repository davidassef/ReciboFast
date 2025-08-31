// Autor: David Assef
// Descrição: Exportações centralizadas dos serviços de API
// Data: 29-01-2025
// MIT License

// Cliente base da API
export { apiClient, type ApiResponse, type PaginatedResponse } from './api';

// Serviço de receitas
export {
  ReceitasService,
  receitasService,
  listReceitas,
  getReceitaById,
  createReceita,
  updateReceita,
  deleteReceita,
  getReceitasStats,
  searchReceitas,
  type ListReceitasParams
} from './receitasService';

// Serviço de pagamentos
export {
  PagamentosService,
  pagamentosService,
  createPagamento,
  getPagamentosByReceita,
  getPagamentoById,
  listPagamentos,
  getPagamentosStats,
  cancelPagamento,
  validatePagamento,
  getHistoricoPagamentos,
  createPagamentoWithValidation,
  type ReceitaPagamentos,
  type PagamentosStats
} from './pagamentosService';