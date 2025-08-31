// Autor: David Assef
// Descrição: Página de gerenciamento de contratos
// Data: 20-01-2025
// MIT License

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Contrato {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativo' | 'inativo' | 'vencido';
  tipo: string;
  descricao: string;
}

const mockContratos: Contrato[] = [
  {
    id: '1',
    numero: 'CONT-001',
    cliente: 'João Silva',
    valor: 5000.00,
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31',
    status: 'ativo',
    tipo: 'Consultoria',
    descricao: 'Consultoria em TI - Suporte técnico mensal'
  },
  {
    id: '2',
    numero: 'CONT-002',
    cliente: 'Maria Santos',
    valor: 8000.00,
    dataInicio: '2024-06-01',
    dataFim: '2025-05-31',
    status: 'ativo',
    tipo: 'Desenvolvimento',
    descricao: 'Desenvolvimento de sistema web'
  },
  {
    id: '3',
    numero: 'CONT-003',
    cliente: 'Pedro Costa',
    valor: 3000.00,
    dataInicio: '2024-01-01',
    dataFim: '2024-12-31',
    status: 'vencido',
    tipo: 'Manutenção',
    descricao: 'Manutenção de software'
  }
];

const getStatusColor = (status: Contrato['status']) => {
  switch (status) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: Contrato['status']) => {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'inativo':
      return 'Inativo';
    case 'vencido':
      return 'Vencido';
    default:
      return status;
  }
};

const Contratos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredContratos = mockContratos.filter(contrato => {
    const matchesSearch = contrato.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || contrato.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContratos = filteredContratos.reduce((sum, contrato) => sum + contrato.valor, 0);
  const contratosAtivos = filteredContratos.filter(c => c.status === 'ativo').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus contratos de prestação de serviços
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalContratos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratosAtivos}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredContratos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente, número ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contratos List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contrato.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contrato.cliente}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {contrato.descricao}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contrato.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs">até {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(contrato.status)
                    )}>
                      {getStatusLabel(contrato.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredContratos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum contrato encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou criar um novo contrato.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contratos;