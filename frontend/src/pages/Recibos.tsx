// Autor: David Assef
// Descrição: Página de gerenciamento de recibos
// Data: 20-01-2025
// MIT License

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Recibo {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  status: 'emitido' | 'enviado' | 'pago' | 'vencido';
  descricao: string;
  formaPagamento?: string;
}

const mockRecibos: Recibo[] = [
  {
    id: '1',
    numero: 'RB-001',
    cliente: 'João Silva',
    valor: 500.00,
    dataEmissao: '2025-01-15',
    dataVencimento: '2025-01-30',
    status: 'pago',
    descricao: 'Consultoria em TI - Janeiro 2025',
    formaPagamento: 'PIX'
  },
  {
    id: '2',
    numero: 'RB-002',
    cliente: 'Maria Santos',
    valor: 750.00,
    dataEmissao: '2025-01-18',
    dataVencimento: '2025-02-02',
    status: 'enviado',
    descricao: 'Desenvolvimento de sistema - Fase 1'
  },
  {
    id: '3',
    numero: 'RB-003',
    cliente: 'Pedro Costa',
    valor: 300.00,
    dataEmissao: '2025-01-10',
    dataVencimento: '2025-01-25',
    status: 'vencido',
    descricao: 'Manutenção de software'
  },
  {
    id: '4',
    numero: 'RB-004',
    cliente: 'Ana Oliveira',
    valor: 1200.00,
    dataEmissao: '2025-01-20',
    dataVencimento: '2025-02-05',
    status: 'emitido',
    descricao: 'Consultoria estratégica'
  }
];

const getStatusColor = (status: Recibo['status']) => {
  switch (status) {
    case 'pago':
      return 'bg-green-100 text-green-800';
    case 'enviado':
      return 'bg-blue-100 text-blue-800';
    case 'emitido':
      return 'bg-yellow-100 text-yellow-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: Recibo['status']) => {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'enviado':
      return 'Enviado';
    case 'emitido':
      return 'Emitido';
    case 'vencido':
      return 'Vencido';
    default:
      return status;
  }
};

const Recibos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredRecibos = mockRecibos.filter(recibo => {
    const matchesSearch = recibo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || recibo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRecibos = filteredRecibos.reduce((sum, recibo) => sum + recibo.valor, 0);
  const recibosPagos = filteredRecibos.filter(r => r.status === 'pago').length;
  const recibosVencidos = filteredRecibos.filter(r => r.status === 'vencido').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recibos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus recibos emitidos
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Novo Recibo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalRecibos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pagos</p>
              <p className="text-2xl font-bold text-gray-900">
                {recibosPagos}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {recibosVencidos}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredRecibos.length}
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
                placeholder="Buscar por cliente, número ou descrição..."
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
              <option value="emitido">Emitido</option>
              <option value="enviado">Enviado</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recibos List */}
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
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
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
              {filteredRecibos.map((recibo) => (
                <tr key={recibo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {recibo.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {recibo.cliente}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {recibo.descricao}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        R$ {recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {recibo.formaPagamento && (
                        <div className="text-xs text-gray-500">
                          {recibo.formaPagamento}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recibo.dataEmissao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recibo.dataVencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(recibo.status)
                    )}>
                      {getStatusLabel(recibo.status)}
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
                      {recibo.status === 'emitido' && (
                        <button className="text-purple-600 hover:text-purple-900" title="Enviar">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
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

      {filteredRecibos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum recibo encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou criar um novo recibo.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibos;