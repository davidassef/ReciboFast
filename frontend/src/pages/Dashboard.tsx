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
  ArrowUpRight
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ComponentType<{ className?: string }>;
}

const stats: StatCard[] = [
  {
    title: 'Receita Total',
    value: 'R$ 12.450,00',
    change: '+12%',
    changeType: 'positive',
    icon: DollarSign
  },
  {
    title: 'Recibos Emitidos',
    value: '48',
    change: '+8%',
    changeType: 'positive',
    icon: FileText
  },
  {
    title: 'Contratos Ativos',
    value: '12',
    change: '+2%',
    changeType: 'positive',
    icon: Users
  },
  {
    title: 'Este Mês',
    value: 'R$ 3.200,00',
    change: '+15%',
    changeType: 'positive',
    icon: Calendar
  }
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Visão geral dos seus recibos e contratos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
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
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 ml-1">
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs mês anterior
                </span>
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
          <div className="space-y-4">
            {[
              {
                action: 'Recibo emitido',
                description: 'Recibo #001 para João Silva',
                time: '2 horas atrás',
                amount: 'R$ 500,00'
              },
              {
                action: 'Contrato criado',
                description: 'Contrato de prestação de serviços',
                time: '1 dia atrás',
                amount: 'R$ 2.000,00'
              },
              {
                action: 'Pagamento recebido',
                description: 'Recibo #002 - Maria Santos',
                time: '2 dias atrás',
                amount: 'R$ 750,00'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {activity.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              Novo Recibo
            </p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              Novo Contrato
            </p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              Ver Relatórios
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;