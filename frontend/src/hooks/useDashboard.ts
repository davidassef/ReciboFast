// Autor: David Assef
// Descrição: Hook para gerenciar dados do dashboard
// Data: 05-09-2025
// MIT License

import { useState, useEffect, useCallback } from 'react';
import { usePagamentos } from './usePagamentos';
import { supabase } from '../lib/supabase';

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

  const { buscarEstatisticas: buscarEstatisticasPagamentos } = usePagamentos();

  /**
   * Calcula estatísticas do dashboard
   */
  const calcularEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats({
          receita_total: 0, receita_mes_atual: 0, receitas_pendentes: 0, receitas_pagas: 0,
          total_receitas: 0, pagamentos_mes: 0, crescimento_receita: 0, crescimento_receitas: 0, crescimento_pagamentos: 0
        });
        setRecentActivity([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);

      // Buscar dados mínimos em paralelo para reduzir tempo de carregamento
      const [incomesRes, paymentsRes] = await Promise.all([
        supabase
          .from('rf_incomes')
          .select('id, valor, created_at, status')
          .eq('owner_id', user.id),
        supabase
          .from('rf_payments')
          .select('id, valor, pago_em, income_id, owner_id')
          .eq('owner_id', user.id)
      ]);

      if (incomesRes.error) console.warn('Falha rf_incomes:', incomesRes.error.message);
      if (paymentsRes.error) console.warn('Falha rf_payments:', paymentsRes.error.message);

      const incomes = incomesRes.data || [];
      const payments = (paymentsRes.data || []).map(p => ({
        ...p,
        pago_em: p.pago_em || p.created_at || null
      }));

      const receita_total = payments.reduce((sum, p:any) => sum + (Number(p.valor) || 0), 0);
      const receita_mes_atual = payments
        .filter((p:any) => (p.pago_em || '').slice(0,10) >= monthStart && (p.pago_em || '').slice(0,10) <= monthEnd)
        .reduce((sum, p:any) => sum + (Number(p.valor) || 0), 0);
      const pagamentos_mes = payments
        .filter((p:any) => (p.pago_em || '').slice(0,10) >= monthStart && (p.pago_em || '').slice(0,10) <= monthEnd)
        .length;

      const total_receitas = incomes.length;
      const distintosPagos = new Set((payments || []).map((p:any) => p.income_id).filter(Boolean));
      const receitas_pagas = distintosPagos.size; // quantidade de rendas com ao menos um pagamento
      const receitas_pendentes = Math.max(total_receitas - receitas_pagas, 0);

      // Crescimentos: manter 0 até termos histórico (poderíamos comparar com mês anterior futuramente)
      const novasStats: DashboardStats = {
        receita_total,
        receita_mes_atual,
        receitas_pendentes,
        receitas_pagas,
        total_receitas,
        pagamentos_mes,
        crescimento_receita: 0,
        crescimento_receitas: 0,
        crescimento_pagamentos: 0,
      };

      setStats(novasStats);
      await buscarAtividadeRecente();
    } catch (err) {
      console.error('Erro ao calcular estatísticas do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [buscarEstatisticasPagamentos]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRecentActivity([]); return; }

      // Buscar últimas rendas (rf_incomes)
      const { data: incomes, error: incErr } = await supabase
        .from('rf_incomes')
        .select('id, valor, created_at, categoria, competencia, status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (incErr) console.warn('Falha ao buscar rendas recentes:', incErr.message);

      // Buscar últimos pagamentos (rf_payments) juntando valor e pago_em
      const { data: payments, error: payErr } = await supabase
        .from('rf_payments')
        .select('id, valor, pago_em, created_at, income_id, owner_id')
        .eq('owner_id', user.id)
        .order('pago_em', { ascending: false })
        .limit(5);

      if (payErr) console.warn('Falha ao buscar pagamentos recentes:', payErr.message);

      const recent: RecentActivity[] = [];

      (incomes || []).forEach((inc: any) => {
        recent.push({
          id: inc.id,
          type: 'receita',
          action: 'Renda criada',
          description: inc.categoria ? `${inc.categoria} - competência ${inc.competencia || ''}`.trim() : 'Nova renda',
          time: '',
          amount: Number(inc.valor) || 0,
          created_at: inc.created_at || new Date().toISOString(),
        });
      });

      (payments || []).forEach((p: any) => {
        recent.push({
          id: p.id,
          type: 'pagamento',
          action: 'Pagamento recebido',
          description: p.income_id ? `Pagamento vinculado à renda ${p.income_id}` : 'Pagamento registrado',
          time: '',
          amount: Number(p.valor) || 0,
          created_at: p.pago_em || p.created_at || new Date().toISOString(),
        });
      });

      // Ordenar por data decrescente e limitar a 10 itens
      recent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(recent.slice(0, 10));
    } catch (err) {
      console.error('Erro ao buscar atividade recente:', err);
      setRecentActivity([]);
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

  // Removido efeito adicional para evitar re-render loop; apenas cálculo inicial

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