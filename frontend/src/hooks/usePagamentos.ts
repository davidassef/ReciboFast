// MIT License
// Autor: David Assef
// Descrição: Hook personalizado para gerenciar CRUD de pagamentos via API com fallback
// Data: 05-09-2025

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { pagamentosService, apiClient } from '../services';
import type {
  Pagamento,
  PagamentoForm,
  PagamentoStats,
  PagamentoHistorico
} from '../types/pagamento';

interface PagamentosState {
  pagamentos: Pagamento[];
  loading: boolean;
  error: string | null;
  stats: PagamentoStats | null;
}

/**
 * Hook personalizado para gerenciar pagamentos com CRUD/fallback
 */
export const usePagamentos = () => {
  const [state, setState] = useState<PagamentosState>({
    pagamentos: [],
    loading: false,
    error: null,
    stats: null
  });

  // Offline (localStorage) helpers
  const LS_KEY = 'offline_pagamentos';
  const readOffline = useCallback((): Pagamento[] => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const writeOffline = useCallback((arr: Pagamento[]) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
  }, []);

  // Atualiza o estado de forma segura
  const updateState = useCallback((updates: Partial<PagamentosState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Registrar um novo pagamento via API
  const registrarPagamento = useCallback(async (receitaId: string, pagamentoData: PagamentoForm): Promise<Pagamento> => {
    try {
      updateState({ loading: true, error: null });

      const isApiAvailable = await apiClient.isApiAvailable();

      if (isApiAvailable) {
        const response = await pagamentosService.create(receitaId, pagamentoData);
        if (response.error || !response.data) {
          throw new Error(response.error ?? 'Erro ao registrar pagamento');
        }
        const novoPagamento = response.data;

        updateState({ pagamentos: [novoPagamento, ...state.pagamentos], loading: false });
        toast.success('Pagamento registrado com sucesso!');
        return novoPagamento;
      } else {
        // Fallback offline
        const off = await registrarPagamentoOffline(receitaId, pagamentoData);
        updateState({ loading: false });
        return off;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar pagamento';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);

      // Tenta fallback offline
      return await registrarPagamentoOffline(receitaId, pagamentoData);
    }
  }, [updateState, state.pagamentos]);

  // Registra pagamento offline (fallback)
  const registrarPagamentoOffline = useCallback(async (receitaId: string, pagamentoData: PagamentoForm): Promise<Pagamento> => {
    const now = new Date();
    const id = `offline-${now.getTime()}`;
    const novoPagamento: Pagamento = {
      id,
      receita_id: receitaId,
      valor: pagamentoData.valor,
      data_pagamento: pagamentoData.data_pagamento || now.toISOString(),
      forma_pagamento: pagamentoData.forma_pagamento,
      observacoes: pagamentoData.observacoes,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    } as Pagamento;
    const arr = [novoPagamento, ...readOffline()];
    writeOffline(arr);
    updateState({ pagamentos: [novoPagamento, ...state.pagamentos] });
    toast.success('Pagamento registrado offline.');
    return novoPagamento;
  }, [readOffline, writeOffline, state.pagamentos, updateState]);

  // Busca pagamentos por receita via API
  const buscarPagamentosPorReceita = useCallback(async (receitaId: string): Promise<Pagamento[]> => {
    try {
      updateState({ loading: true, error: null });
      const isApiAvailable = await apiClient.isApiAvailable();

      if (isApiAvailable) {
        const response = await pagamentosService.getByReceita(Number(receitaId));
        if (response.error || !response.data) {
          console.error('Erro ao buscar pagamentos:', response.error);
          return await buscarPagamentosOffline(receitaId);
        }
        const pagamentos = response.data.pagamentos || [];
        updateState({ pagamentos, loading: false });
        return pagamentos;
      } else {
        return await buscarPagamentosOffline(receitaId);
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return await buscarPagamentosOffline(receitaId);
    }
  }, [updateState]);

  // Busca pagamentos offline (fallback)
  const buscarPagamentosOffline = useCallback(async (receitaId: string): Promise<Pagamento[]> => {
    const all = readOffline();
    const list = all.filter(p => String(p.receita_id) === String(receitaId));
    updateState({ pagamentos: list, loading: false });
    return list;
  }, [readOffline, updateState]);

  // Cancela um pagamento via API (não suportado: degrada para offline)
  const cancelarPagamento = useCallback(async (pagamentoId: string): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      const isApiAvailable = await apiClient.isApiAvailable();

      if (isApiAvailable) {
        const response = await pagamentosService.cancel(Number(pagamentoId));
        if (response.error) {
          throw new Error(response.error);
        }
        updateState({ pagamentos: state.pagamentos.filter(p => p.id !== pagamentoId), loading: false });
        toast.success('Pagamento cancelado com sucesso!');
      } else {
        await cancelarPagamentoOffline(pagamentoId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cancelamento não suportado no backend';
      updateState({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      await cancelarPagamentoOffline(pagamentoId);
    }
  }, [updateState, state.pagamentos]);

  // Cancela pagamento offline (fallback)
  const cancelarPagamentoOffline = useCallback(async (pagamentoId: string): Promise<void> => {
    const remaining = readOffline().filter(p => p.id !== pagamentoId);
    writeOffline(remaining);
    updateState({ pagamentos: state.pagamentos.filter(p => p.id !== pagamentoId), loading: false });
    toast.success('Pagamento cancelado offline.');
  }, [readOffline, writeOffline, state.pagamentos, updateState]);

  // Busca estatísticas offline (fallback)
  const buscarEstatisticasOffline = useCallback(async (): Promise<PagamentoStats> => {
    const all = readOffline();
    const total_pagamentos = all.length;
    const valor_total_pago = all.reduce((sum, p) => sum + (p.valor || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayList = all.filter(p => (p.data_pagamento || '').slice(0,10) === today);
    const pagamentos_hoje = todayList.length;
    const valor_pago_hoje = todayList.reduce((sum, p) => sum + (p.valor || 0), 0);
    const stats: PagamentoStats = {
      total_pagamentos,
      valor_total_pago,
      pagamentos_hoje,
      valor_pago_hoje,
    };
    updateState({ stats });
    return stats;
  }, [readOffline, updateState]);

  // Busca estatísticas de pagamentos via API (não suportado: retorna estatísticas vazias)
  const buscarEstatisticas = useCallback(async (): Promise<PagamentoStats> => {
    try {
      const isApiAvailable = await apiClient.isApiAvailable();
      if (isApiAvailable) {
        const response = await pagamentosService.getStats();
        if (response.error || !response.data) {
          return await buscarEstatisticasOffline();
        }
        const s = response.data;
        const converted: PagamentoStats = {
          total_pagamentos: s.total_pagamentos,
          valor_total_pago: s.valor_total_recebido,
          pagamentos_hoje: s.pagamentos_hoje,
          valor_pago_hoje: s.valor_hoje,
        };
        updateState({ stats: converted });
        return converted;
      } else {
        return await buscarEstatisticasOffline();
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return await buscarEstatisticasOffline();
    }
  }, [updateState]);

  // Busca histórico offline (fallback)
  const buscarHistoricoOffline = useCallback(async (receitaId?: string): Promise<PagamentoHistorico[]> => {
    // TODO: Implementar cache local
    console.log('Buscando histórico offline para receita:', receitaId);
    return [];
  }, []);

  // Busca histórico de pagamentos via API (não suportado: retorna vazio)
  const buscarHistorico = useCallback(async (receitaId?: string): Promise<PagamentoHistorico[]> => {
    try {
      const isApiAvailable = await apiClient.isApiAvailable();
      if (isApiAvailable && receitaId) {
        const response = await pagamentosService.getHistorico(Number(receitaId));
        if (response.error || !response.data) {
          return await buscarHistoricoOffline(receitaId);
        }
        const pagamentos = response.data || [];
        const historico: PagamentoHistorico[] = pagamentos.map(p => ({
          ...p,
          tipo_pagamento: p.forma_pagamento,
        }));
        return historico;
      } else {
        return await buscarHistoricoOffline(receitaId);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return await buscarHistoricoOffline(receitaId);
    }
  }, []);

  return {
    ...state,
    registrarPagamento,
    buscarPagamentosPorReceita,
    cancelarPagamento,
    buscarEstatisticas,
    buscarHistorico,
  };
};

export default usePagamentos;