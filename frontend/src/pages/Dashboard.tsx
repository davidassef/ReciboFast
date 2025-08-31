// Autor: David Assef
// Descrição: Página principal do dashboard
// Data: 20-01-2025
// MIT License

import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    stats, 
    recentActivity, 
    loading, 
    error, 
    calcularEstatisticas, 
    formatarMoeda, 
    formatarTempoRelativo 
  } = useDashboard();

  // Preparar dados dos cards de estatísticas
  const statCards: StatCard[] = [
    {
      title: 'Receita Total',
      value: formatarMoeda(stats.receita_total),
      change: `${stats.crescimento_receita >= 0 ? '+' : ''}${stats.crescimento_receita}%`,
      changeType: stats.crescimento_receita > 0 ? 'positive' : stats.crescimento_receita < 0 ? 'negative' : 'neutral',
      icon: DollarSign
    },
    {
      title: 'Receitas Criadas',
      value: stats.total_receitas.toString(),
      change: `${stats.crescimento_receitas >= 0 ? '+' : ''}${stats.crescimento_receitas}%`,
      changeType: stats.crescimento_receitas > 0 ? 'positive' : stats.crescimento_receitas < 0 ? 'negative' : 'neutral',
      icon: FileText
    },
    {
      title: 'Receitas Pagas',
      value: stats.receitas_pagas.toString(),
      change: `${stats.receitas_pendentes} pendentes`,
      changeType: 'neutral',
      icon: Users
    },
    {
      title: 'Este Mês',
      value: formatarMoeda(stats.receita_mes_atual),
      change: `${stats.pagamentos_mes} pagamentos`,
      changeType: 'neutral',
      icon: Calendar
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Erro ao carregar dashboard</h3>
          <p className="text-gray-600 mt-1">{error}</p>
          <button
            onClick={calcularEstatisticas}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral das suas receitas e pagamentos
          </p>
        </div>
        <button
          onClick={calcularEstatisticas}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.changeType === 'positive' ? ArrowUpRight : 
                           stat.changeType === 'negative' ? ArrowDownRight : null;
          
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {ChangeIcon && (
                  <ChangeIcon className={`w-4 h-4 ${
                    stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                  }`} />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
                {stat.changeType !== 'neutral' && (
                  <span className="text-sm text-gray-500 ml-1">
                    vs mês anterior
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Atividade Recente
          </h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const ActivityIcon = activity.type === 'receita' ? FileText : DollarSign;
                
                return (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center flex-1">
                      <div className={`p-2 rounded-full mr-3 ${
                        activity.type === 'receita' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <ActivityIcon className={`w-4 h-4 ${
                          activity.type === 'receita' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatarTempoRelativo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        activity.type === 'receita' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {formatarMoeda(activity.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/receitas')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
              Nova Receita
            </p>
          </button>
          <button 
            onClick={() => navigate('/contratos')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
              Novo Contrato
            </p>
          </button>
          <button 
            onClick={() => navigate('/recibos')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
              Ver Recibos
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;