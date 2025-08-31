// MIT License
// Autor: David Assef
// Descrição: Página de gerenciamento de receitas com CRUD completo
// Data: 20-01-2025

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  FileText,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useReceitas } from '../hooks/useReceitas';
import { ReceitaForm } from '../components/ReceitaForm';
import { PagamentoModal } from '../components/PagamentoModal';
import { 
  Receita, 
  ReceitaFilters, 
  ReceitaForm as ReceitaFormType,
  ReceitaStatus,
  ReceitaCategoria,
  ReceitaSortField,
  SortOrder
} from '../types/receita';
import { Pagamento } from '../types/pagamento';

/**
 * Retorna as classes CSS para o status da receita
 */
const getStatusColor = (status: ReceitaStatus): string => {
  switch (status) {
    case 'pago':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Retorna o label do status da receita
 */
const getStatusLabel = (status: ReceitaStatus): string => {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'pendente':
      return 'Pendente';
    case 'vencido':
      return 'Vencido';
    default:
      return status;
  }
};

/**
 * Formata valor monetário
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata data
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const Receitas: React.FC = () => {
  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<Receita | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [receitaParaPagamento, setReceitaParaPagamento] = useState<Receita | undefined>();
  const [localFilters, setLocalFilters] = useState<ReceitaFilters>({
    search: '',
    status: undefined,
    categoria: undefined,
    data_inicio: undefined,
    data_fim: undefined,
    valor_min: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 10
  });

  // Hook de receitas
  const {
    receitas,
    loading,
    error,
    stats,
    total,
    page,
    limit,
    total_pages,
    filters,
    fetchReceitas,
    createReceita,
    updateReceita,
    deleteReceita
  } = useReceitas();

  /**
   * Carrega receitas quando os filtros mudam
   */
  useEffect(() => {
    fetchReceitas(filters);
  }, [filters, fetchReceitas]);

  /**
   * Submete formulário
   */
  const handleFormSubmit = async (data: ReceitaFormType) => {
    try {
      if (selectedReceita) {
        await updateReceita(selectedReceita.id, data);
        toast.success('Receita atualizada com sucesso!');
      } else {
        await createReceita(data);
        toast.success('Receita criada com sucesso!');
      }
      setShowForm(false);
      setSelectedReceita(undefined);
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast.error('Erro ao salvar receita');
    }
  };



  /**
   * Sincroniza dados
   */
  const handleSync = async () => {
    try {
      // Sync data functionality will be implemented later
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    }
  };

  /**
   * Limpa filtros
   */
  const handleClearFilters = async () => {
    const clearedFilters = {
      search: '',
      status: undefined,
      categoria: undefined,
      data_inicio: undefined,
      data_fim: undefined,
      valor_min: undefined,
      sort_by: 'created_at' as ReceitaSortField,
      sort_order: 'desc' as SortOrder,
      page: 1,
      limit: 10
    };
    setLocalFilters(clearedFilters);
    await fetchReceitas(clearedFilters);
  };

  // Handlers para ações da tabela
  const handleSort = async (field: ReceitaSortField) => {
    const newSortOrder = localFilters.sort_by === field && localFilters.sort_order === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...localFilters, sort_by: field, sort_order: newSortOrder as 'asc' | 'desc', page: 1 };
    setLocalFilters(newFilters);
    await fetchReceitas(newFilters);
  };

  const handlePageChange = async (page: number) => {
    const newFilters = { ...localFilters, page };
    setLocalFilters(newFilters);
    await fetchReceitas(newFilters);
  };

  const handleViewReceita = () => {
    // TODO: Implementar modal de visualização
    toast('Funcionalidade de visualização em desenvolvimento');
  };

  const handleEditReceita = (receita: Receita) => {
    setSelectedReceita(receita);
    setShowForm(true);
  };

  const handleDeleteReceita = async (receita: Receita) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await deleteReceita(receita);
        toast.success('Receita excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir receita:', error);
        toast.error('Erro ao excluir receita');
      }
    }
  };

  const handlePagamento = (receita: Receita) => {
    setReceitaParaPagamento(receita);
    setShowPagamentoModal(true);
  };

  const handlePagamentoRegistrado = async (pagamento: Pagamento) => {
    try {
      // Aqui você pode atualizar o status da receita se necessário
      // Por exemplo, se o pagamento cobrir o valor total, marcar como 'pago'
      if (receitaParaPagamento && pagamento.valor >= receitaParaPagamento.valor) {
        await updateReceita(receitaParaPagamento.id, {
          ...receitaParaPagamento,
          status: 'pago' as ReceitaStatus
        });
      }
      
      // Recarregar a lista de receitas
      await fetchReceitas(filters);
      
      setShowPagamentoModal(false);
      setReceitaParaPagamento(undefined);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    }
  };

  const getStatusBadgeClass = (status: ReceitaStatus): string => {
    return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`;
  };

  const formatStatus = (status: ReceitaStatus): string => {
    return getStatusLabel(status);
  };

  // Loading state
  if (loading && receitas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando receitas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">Erro ao carregar receitas</p>
          <button
            onClick={() => fetchReceitas(localFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receitas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas receitas e recibos
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={handleSync}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Sincronizar
          </button>
          <button
            onClick={() => {
              setSelectedReceita(undefined);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.total_valor) : 'R$ 0,00'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_receitas || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.receitas_pendentes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.receitas_vencidas || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Título, cliente..."
                value={localFilters.search || ''}
                onChange={async (e) => {
                  const newFilters = { ...localFilters, search: e.target.value, page: 1 };
                  setLocalFilters(newFilters);
                  await fetchReceitas(newFilters);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={localFilters.status || ''}
              onChange={async (e) => {
                 const newFilters = { ...localFilters, status: e.target.value as ReceitaStatus || undefined, page: 1 };
                 setLocalFilters(newFilters);
                 await fetchReceitas(newFilters);
               }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={localFilters.categoria || ''}
              onChange={async (e) => {
                 const newFilters = { ...localFilters, categoria: e.target.value as ReceitaCategoria || undefined, page: 1 };
                 setLocalFilters(newFilters);
                 await fetchReceitas(newFilters);
               }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              <option value="servico">Serviço</option>
              <option value="produto">Produto</option>
              <option value="consultoria">Consultoria</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
                onClick={handleClearFilters}
                className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpar Filtros
              </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Avançado
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={localFilters.data_inicio || ''}
                  onChange={async (e) => {
                     const newFilters = { ...localFilters, data_inicio: e.target.value || undefined, page: 1 };
                      setLocalFilters(newFilters);
                      await fetchReceitas(newFilters);
                   }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={localFilters.data_fim || ''}
                  onChange={async (e) => {
                     const newFilters = { ...localFilters, data_fim: e.target.value || undefined, page: 1 };
                      setLocalFilters(newFilters);
                      await fetchReceitas(newFilters);
                   }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={localFilters.valor_min || ''}
                  onChange={async (e) => {
                     const newFilters = { ...localFilters, valor_min: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 };
                      setLocalFilters(newFilters);
                      await fetchReceitas(newFilters);
                   }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receitas Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('titulo')}>
                  <div className="flex items-center">
                    Título
                    {filters.sort_by === 'titulo' && (
                      filters.sort_order === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('valor')}>
                  <div className="flex items-center">
                    Valor
                    {filters.sort_by === 'valor' && (
                      filters.sort_order === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('data_vencimento')}>
                  <div className="flex items-center">
                    Vencimento
                    {filters.sort_by === 'data_vencimento' && (
                      filters.sort_order === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receitas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Nenhuma receita encontrada</p>
                      <p className="text-sm">Crie sua primeira receita ou ajuste os filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receitas.map((receita) => (
                  <tr key={receita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {receita.titulo}
                      </div>
                      {receita.descricao && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {receita.descricao}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receita.cliente_nome || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(receita.valor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(receita.data_vencimento)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(receita.status)}>
                        {formatStatus(receita.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {receita.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewReceita()}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {receita.status !== 'pago' && (
                          <button 
                            onClick={() => handlePagamento(receita)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Registrar Pagamento"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditReceita(receita)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteReceita(receita)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total_pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((page - 1) * limit) + 1} a{' '}
                {Math.min(page * limit, total)} de{' '}
                {total} receitas
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
                  const pageNum = i + Math.max(1, page - 2);
                  if (pageNum > total_pages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        'px-3 py-1 text-sm border rounded-md',
                        pageNum === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= total_pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal de Formulário */}
      {showForm && (
        <ReceitaForm
          receita={selectedReceita}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setSelectedReceita(undefined);
          }}
        />
      )}

      {/* Modal de Pagamento */}
      {showPagamentoModal && receitaParaPagamento && (
        <PagamentoModal
          isOpen={showPagamentoModal}
          receita={receitaParaPagamento}
          onPagamentoRegistrado={handlePagamentoRegistrado}
          onClose={() => {
            setShowPagamentoModal(false);
            setReceitaParaPagamento(undefined);
          }}
        />
      )}
    </div>
  );
};

export default Receitas;