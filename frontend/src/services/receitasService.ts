// Autor: David Assef
// Descrição: Serviço para gerenciar receitas via API
// Data: 29-01-2025
// MIT License

import { apiClient, ApiResponse, PaginatedResponse } from './api';
import { Receita, ReceitaForm, ReceitaFilters, ReceitasStats } from '../types/receita';

// Interface para parâmetros de listagem
export interface ListReceitasParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

// Classe do serviço de receitas
export class ReceitasService {
  private readonly basePath = '/incomes';

  // Listar receitas com filtros e paginação
  async list(params: ListReceitasParams = {}): Promise<ApiResponse<PaginatedResponse<Receita>>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    return apiClient.get<PaginatedResponse<Receita>>(endpoint);
  }

  // Obter receita por ID
  async getById(id: number): Promise<ApiResponse<Receita>> {
    return apiClient.get<Receita>(`${this.basePath}/${id}`);
  }

  // Criar nova receita
  async create(receita: ReceitaForm): Promise<ApiResponse<Receita>> {
    return apiClient.post<Receita>(this.basePath, receita);
  }

  // Atualizar receita existente
  async update(id: number, receita: Partial<ReceitaForm>): Promise<ApiResponse<Receita>> {
    return apiClient.put<Receita>(`${this.basePath}/${id}`, receita);
  }

  // Excluir receita
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // Obter estatísticas das receitas
  async getStats(): Promise<ApiResponse<ReceitasStats>> {
    return apiClient.get<ReceitasStats>(`${this.basePath}/stats`);
  }

  // Converter filtros do frontend para parâmetros da API
  private convertFiltersToParams(filters: ReceitaFilters): ListReceitasParams {
    const params: ListReceitasParams = {};

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.categoria) {
      params.categoria = filters.categoria;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.data_inicio) {
      params.data_inicio = filters.data_inicio;
    }

    if (filters.data_fim) {
      params.data_fim = filters.data_fim;
    }

    if (filters.valor_min !== undefined && filters.valor_min > 0) {
      params.valor_min = filters.valor_min;
    }

    if (filters.valor_max !== undefined && filters.valor_max > 0) {
      params.valor_max = filters.valor_max;
    }

    return params;
  }

  // Método conveniente para buscar com filtros do frontend
  async searchWithFilters(
    filters: ReceitaFilters,
    page: number = 1,
    limit: number = 10,
    sortField?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ApiResponse<PaginatedResponse<Receita>>> {
    const params: ListReceitasParams = {
      ...this.convertFiltersToParams(filters),
      page,
      limit,
    };

    if (sortField) {
      params.sort_field = sortField;
      params.sort_order = sortOrder || 'asc';
    }

    return this.list(params);
  }
}

// Instância global do serviço
export const receitasService = new ReceitasService();

// Funções utilitárias para compatibilidade
export const {
  list: listReceitas,
  getById: getReceitaById,
  create: createReceita,
  update: updateReceita,
  delete: deleteReceita,
  getStats: getReceitasStats,
  searchWithFilters: searchReceitas
} = receitasService;