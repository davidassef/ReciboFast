// MIT License
// Autor: David Assef
// Descrição: Interfaces TypeScript para Receitas
// Data: 20-01-2025

/**
 * Interface principal para Receita
 * Representa uma receita completa no sistema
 */
export interface Receita {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  valor: number;
  data_vencimento: string; // ISO date string
  status: 'pendente' | 'pago' | 'vencido';
  cliente_id?: string;
  cliente_nome?: string;
  categoria?: string;
  observacoes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  synced_at?: string; // ISO datetime string
}

/**
 * Interface para formulário de Receita
 * Campos necessários para criar/editar uma receita
 */
export interface ReceitaForm {
  titulo: string;
  descricao?: string;
  valor: number;
  data_vencimento: string; // ISO date string
  status: 'pendente' | 'pago' | 'vencido';
  cliente_nome?: string;
  categoria?: string;
  observacoes?: string;
}

/**
 * Interface para filtros de Receitas
 * Parâmetros para busca e filtragem
 */
export interface ReceitaFilters {
  search?: string; // Busca por título, descrição ou cliente
  status?: 'pendente' | 'pago' | 'vencido' | 'all';
  categoria?: string;
  data_inicio?: string; // ISO date string
  data_fim?: string; // ISO date string
  valor_min?: number;
  valor_max?: number;
  cliente_nome?: string;
  page?: number;
  limit?: number;
  sort_by?: 'data_vencimento' | 'valor' | 'titulo' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Interface para resposta paginada de Receitas
 */
export interface ReceitasPaginatedResponse {
  data: Receita[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Interface para estatísticas de Receitas
 */
export interface ReceitasStats {
  total_receitas: number;
  total_valor: number;
  receitas_pendentes: number;
  receitas_pagas: number;
  receitas_vencidas: number;
  valor_pendente: number;
  valor_pago: number;
  valor_vencido: number;
}

/**
 * Interface para dados de sincronização
 */
export interface SyncData {
  last_sync: string; // ISO datetime string
  pending_sync: number;
  sync_errors: string[];
}

/**
 * Type para status de Receita
 */
export type ReceitaStatus = 'pendente' | 'pago' | 'vencido';

/**
 * Enum para categorias padrão
 */
export enum ReceitaCategoria {
  SERVICOS = 'Serviços',
  PRODUTOS = 'Produtos',
  CONSULTORIA = 'Consultoria',
  FREELANCE = 'Freelance',
  OUTROS = 'Outros'
}

/**
 * Type para ordenação
 */
export type ReceitaSortField = 'data_vencimento' | 'valor' | 'titulo' | 'created_at';
export type SortOrder = 'asc' | 'desc';

/**
 * Interface para ações de CRUD
 */
export interface ReceitaActions {
  create: (receita: ReceitaForm) => Promise<Receita>;
  update: (id: string, receita: Partial<ReceitaForm>) => Promise<Receita>;
  delete: (id: string) => Promise<void>;
  getById: (id: string) => Promise<Receita | null>;
  getAll: (filters?: ReceitaFilters) => Promise<ReceitasPaginatedResponse>;
  getStats: () => Promise<ReceitasStats>;
  sync: () => Promise<SyncData>;
}

/**
 * Interface para estado do hook useReceitas
 */
export interface ReceitasState {
  receitas: Receita[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters: ReceitaFilters;
  stats: ReceitasStats | null;
  sync_data: SyncData | null;
}

/**
 * Interface para configurações de paginação
 */
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Type para eventos de receita
 */
export type ReceitaEvent = 
  | { type: 'CREATE'; payload: Receita }
  | { type: 'UPDATE'; payload: Receita }
  | { type: 'DELETE'; payload: string }
  | { type: 'SYNC'; payload: SyncData };