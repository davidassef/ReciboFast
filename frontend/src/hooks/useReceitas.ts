// MIT License
// Autor: David Assef
// Descrição: Hook personalizado para gerenciar CRUD de receitas via API
// Data: 29-01-2025

import { useState, useEffect, useCallback } from 'react';
// import { db } from '../lib/database'; // Removido - usando apenas API
import toast from 'react-hot-toast';
import {
  Receita,
  ReceitaForm,
  ReceitaFilters,
  ReceitasPaginatedResponse,
  ReceitasStats,
  ReceitasState
} from '../types/receita';
import { receitasService, apiClient } from '../services';
import type { ListReceitasParams } from '../services/receitasService';

/**
 * Hook personalizado para gerenciar receitas com CRUD completo
 * Inclui sincronização offline e integração com Supabase
 */
export const useReceitas = () => {
  const [state, setState] = useState<ReceitasState>({
    receitas: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
    filters: {},
    stats: null,
    sync_data: null
  });

  /**
   * Atualiza o estado de forma segura
   */
  const updateState = useCallback((updates: Partial<ReceitasState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);



  /**
   * Busca receitas com filtros e paginação via API
   */
  const fetchReceitas = useCallback(async (filters: ReceitaFilters = {}): Promise<ReceitasPaginatedResponse> => {
    try {
      updateState({ loading: true, error: null, filters });
      
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (!isApiAvailable) {
        // Fallback para IndexedDB se API não estiver disponível
        return await fetchReceitasOffline(filters);
      }

      // Converter filtros para parâmetros da API
      const params: ListReceitasParams = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        search: filters.search,
        categoria: filters.categoria,
        status: filters.status !== 'all' ? filters.status : undefined,
        data_inicio: filters.data_inicio,
        data_fim: filters.data_fim,
        valor_min: filters.valor_min,
        valor_max: filters.valor_max,
        sort_field: filters.sort_by || 'created_at',
        sort_order: filters.sort_order || 'desc'
      };

      const response = await receitasService.list(params);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const paginatedResponse: ReceitasPaginatedResponse = {
        data: response.data!.items,
        total: response.data!.total,
        page: response.data!.page,
        limit: response.data!.limit,
        total_pages: response.data!.total_pages
      };
      
      updateState({ 
        receitas: paginatedResponse.data, 
        total: paginatedResponse.total, 
        page: paginatedResponse.page, 
        limit: paginatedResponse.limit, 
        total_pages: paginatedResponse.total_pages,
        loading: false 
      });
      
      return paginatedResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar receitas';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      
      // Tentar fallback para dados offline
      try {
        return await fetchReceitasOffline(filters);
      } catch {
        throw error; // Retornar erro original se fallback também falhar
      }
    }
  }, [updateState, fetchReceitasOffline]);

  /**
   * Busca receitas offline (fallback)
   */
  const fetchReceitasOffline = useCallback(async (): Promise<ReceitasPaginatedResponse> => {
    // TODO: Implementar cache local para receitas
    throw new Error('Cache local não implementado. Verifique sua conexão com a internet.');
  }, []);

  /**
   * Cria uma nova receita via API
   */
  const createReceita = useCallback(async (receitaForm: ReceitaForm): Promise<Receita> => {
    try {
      updateState({ loading: true, error: null });
      
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (isApiAvailable) {
        // Criar via API
        const response = await receitasService.create(receitaForm);
        
        if (response.error) {
          throw new Error(response.error);
        }

        const receita = response.data!;
        
        // Atualizar estado local
        updateState({ 
          receitas: [receita, ...state.receitas],
          total: state.total + 1,
          loading: false 
        });
        
        toast.success('Receita criada com sucesso!');
        return receita;
      } else {
        // Fallback para IndexedDB
        return await createReceitaOffline();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar receita';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      
      // Tentar fallback offline
      try {
        return await createReceitaOffline();
      } catch {
        throw error;
      }
    }
  }, [updateState, state.receitas, state.total, createReceitaOffline]);

  /**
   * Cria receita offline (fallback)
   */
  const createReceitaOffline = useCallback(async (): Promise<Receita> => {
    // TODO: Implementar cache local para criação de receitas
    throw new Error('Cache local não implementado. Verifique sua conexão com a internet.');
  }, []);

  /**
   * Atualiza uma receita existente via API
   */
  const updateReceita = useCallback(async (id: string, updates: Partial<ReceitaForm>): Promise<Receita> => {
    try {
      updateState({ loading: true, error: null });
      
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (isApiAvailable) {
        // Atualizar via API
        const response = await receitasService.update(Number(id), updates);
        
        if (response.error) {
          throw new Error(response.error);
        }

        const updatedReceita = response.data!;
        
        // Atualizar estado local
        updateState({ 
          receitas: state.receitas.map(r => r.id === id ? updatedReceita : r),
          loading: false 
        });
        
        toast.success('Receita atualizada com sucesso!');
        return updatedReceita;
      } else {
        // Fallback para IndexedDB
        return await updateReceitaOffline(id, updates);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar receita';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      
      // Tentar fallback offline
      try {
        return await updateReceitaOffline();
      } catch {
        throw error;
      }
    }
  }, [updateState, state.receitas, updateReceitaOffline]);

  /**
   * Atualiza receita offline (fallback)
   */
  const updateReceitaOffline = useCallback(async (): Promise<Receita> => {
    // TODO: Implementar cache local para atualização de receitas
    throw new Error('Cache local não implementado. Verifique sua conexão com a internet.');
  }, []);

  /**
   * Exclui uma receita via API
   */
  const deleteReceita = useCallback(async (receita: Receita): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (isApiAvailable) {
        // Excluir via API
        const response = await receitasService.delete(Number(receita.id));
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        // Atualizar estado local
        updateState({ 
          receitas: state.receitas.filter(r => r.id !== receita.id),
          total: state.total - 1,
          loading: false 
        });
        
        toast.success('Receita excluída com sucesso!');
      } else {
        // Fallback para IndexedDB
        await deleteReceitaOffline(receita);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir receita';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      
      // Tentar fallback offline
      try {
        await deleteReceitaOffline();
      } catch {
        throw error;
      }
    }
  }, [updateState, state.receitas, state.total, deleteReceitaOffline]);

  /**
   * Exclui receita offline (fallback)
   */
  const deleteReceitaOffline = useCallback(async (): Promise<void> => {
    // TODO: Implementar cache local para exclusão de receitas
    throw new Error('Cache local não implementado. Verifique sua conexão com a internet.');
  }, []);

  /**
   * Busca uma receita por ID via API
   */
  const getReceitaById = useCallback(async (id: string): Promise<Receita | null> => {
    try {
      // Primeiro tentar buscar no estado local
      const localReceita = state.receitas.find(r => r.id === id);
      if (localReceita) return localReceita;
      
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (isApiAvailable) {
        // Buscar via API
        const response = await receitasService.getById(Number(id));
        
        if (response.error) {
          console.error('Erro ao buscar receita por ID:', response.error);
          return null;
        }
        
        return response.data || null;
      } else {
        // TODO: Implementar cache local para busca por ID
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar receita por ID:', error);
      return null;
    }
  }, [state.receitas]);

  /**
   * Calcula estatísticas das receitas via API
   */
  const getStats = useCallback(async (): Promise<ReceitasStats> => {
    try {
      // Verificar se a API está disponível
      const isApiAvailable = await apiClient.isApiAvailable();
      
      if (isApiAvailable) {
        // Buscar estatísticas via API
        const response = await receitasService.getStats();
        
        if (response.error) {
          console.error('Erro ao buscar estatísticas:', response.error);
          return await getStatsOffline();
        }
        
        const stats = response.data;
        updateState({ stats });
        return stats;
      } else {
        // Fallback para cálculo local
        return await getStatsOffline();
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      
      // Tentar fallback offline
      try {
        return await getStatsOffline();
      } catch {
        const errorMessage = 'Erro ao calcular estatísticas';
        toast.error(errorMessage);
        throw error;
      }
    }
  }, [updateState, getStatsOffline]);

  /**
   * Calcula estatísticas offline (fallback)
   */
  const getStatsOffline = useCallback(async (): Promise<ReceitasStats> => {
    // TODO: Implementar cálculo de estatísticas com cache local
    const stats: ReceitasStats = {
      total_receitas: 0,
      total_valor: 0,
      receitas_pendentes: 0,
      receitas_pagas: 0,
      receitas_vencidas: 0,
      valor_pendente: 0,
      valor_pago: 0,
      valor_vencido: 0
    };
    
    updateState({ stats });
    return stats;
  }, [updateState]);

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    fetchReceitas();
    getStats();
  }, [fetchReceitas, getStats]);

  return {
    // Estado
    ...state,
    
    // Ações CRUD
    fetchReceitas,
    createReceita,
    updateReceita,
    deleteReceita,
    getReceitaById,
    
    // Utilitários
    getStats
  };
};

export default useReceitas;