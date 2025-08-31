// Autor: David Assef
// Descrição: Hook para gerenciar dados do dashboard
// Data: 20-01-2025
// MIT License

import { useState, useEffect, useCallback } from 'react';
import { useReceitas } from './useReceitas';
import { usePagamentos } from './usePagamentos';

export interface DashboardStats {
  receita_total: number;
  receita_mes_atual: number;
  receitas_pendentes: number;
  receitas_pagas: number;
  total_receitas: number;
  pagamentos_mes: number;
  crescimento_receita: number;
  crescimento_receitas: number;
  crescimento_pagamentos: number;
}

export interface RecentActivity {
  id: string;
  type: 'receita' | 'pagamento';
  action: string;
  description: string;
  time: string;
  amount: number;
  created_at: string;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    receita_total: 0,
    receita_mes_atual: 0,
    receitas_pendentes: 0,
    receitas_pagas: 0,
    total_receitas: 0,
    pagamentos_mes: 0,
    crescimento_receita: 0,
    crescimento_receitas: 0,
    crescimento_pagamentos: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { stats: receitasStats, buscarEstatisticas } = useReceitas();
  const { buscarEstatisticas: buscarEstatisticasPagamentos } = usePagamentos();

  /**
   * Calcula estatísticas do dashboard
   */
  const calcularEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas de receitas
      await buscarEstatisticas();
      
      // Buscar estatísticas de pagamentos
      const estatisticasPagamentos = await buscarEstatisticasPagamentos();

      // TODO: Implementar cálculos reais baseados nos dados
      // Por enquanto, usar dados das estatísticas existentes
      const novasStats: DashboardStats = {
        receita_total: receitasStats?.valor_total || 0,
        receita_mes_atual: receitasStats?.valor_mes_atual || 0,
        receitas_pendentes: receitasStats?.receitas_pendentes || 0,
        receitas_pagas: receitasStats?.receitas_pagas || 0,
        total_receitas: receitasStats?.total_receitas || 0,
        pagamentos_mes: estatisticasPagamentos?.pagamentos_mes || 0,
        crescimento_receita: calcularCrescimento(receitasStats?.valor_mes_atual || 0, receitasStats?.valor_mes_anterior || 0),
        crescimento_receitas: calcularCrescimento(receitasStats?.total_receitas || 0, receitasStats?.total_receitas_anterior || 0),
        crescimento_pagamentos: calcularCrescimento(estatisticasPagamentos?.pagamentos_mes || 0, estatisticasPagamentos?.pagamentos_mes_anterior || 0)
      };

      setStats(novasStats);
      
      // TODO: Implementar busca de atividade recente real
      await buscarAtividadeRecente();
      
    } catch (err) {
      console.error('Erro ao calcular estatísticas do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [buscarEstatisticas, buscarEstatisticasPagamentos, receitasStats]);

  /**
   * Calcula percentual de crescimento
   */
  const calcularCrescimento = (atual: number, anterior: number): number => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  };

  /**
   * Busca atividade recente (mock por enquanto)
   */
  const buscarAtividadeRecente = async () => {
    try {
      // TODO: Implementar busca real de atividade recente
      // Por enquanto, usar dados mock
      const atividadeMock: RecentActivity[] = [
        {
          id: '1',
          type: 'receita',
          action: 'Receita criada',
          description: 'Nova receita de consultoria',
          time: '2 horas atrás',
          amount: 500.00,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'pagamento',
          action: 'Pagamento recebido',
          description: 'Pagamento da receita #001',
          time: '1 dia atrás',
          amount: 750.00,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'receita',
          action: 'Receita atualizada',
          description: 'Receita de desenvolvimento web',
          time: '2 dias atrás',
          amount: 2000.00,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setRecentActivity(atividadeMock);
    } catch (err) {
      console.error('Erro ao buscar atividade recente:', err);
    }
  };

  /**
   * Formata valor monetário
   */
  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  /**
   * Formata tempo relativo
   */
  const formatarTempoRelativo = (dataISO: string): string => {
    const agora = new Date();
    const data = new Date(dataISO);
    const diffMs = agora.getTime() - data.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffHoras < 1) {
      return 'Agora mesmo';
    } else if (diffHoras < 24) {
      return `${diffHoras} hora${diffHoras > 1 ? 's' : ''} atrás`;
    } else if (diffDias < 7) {
      return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`;
    } else {
      return data.toLocaleDateString('pt-BR');
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    calcularEstatisticas();
  }, [calcularEstatisticas]);

  // Recarregar quando as estatísticas de receitas mudarem
  useEffect(() => {
    if (receitasStats) {
      calcularEstatisticas();
    }
  }, [receitasStats, calcularEstatisticas]);

  return {
    stats,
    recentActivity,
    loading,
    error,
    calcularEstatisticas,
    formatarMoeda,
    formatarTempoRelativo
  };
}