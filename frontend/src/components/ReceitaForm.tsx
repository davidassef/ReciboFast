// MIT License
// Autor: David Assef
// Descrição: Componente de formulário para criar/editar receitas
// Data: 20-01-2025

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Calendar, User, Tag, FileText, MessageSquare } from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Receita, ReceitaForm as ReceitaFormType, ReceitaCategoria, ReceitaStatus } from '../types/receita';
import { receitaFormSchema, ReceitaFormData, RECEITA_CONSTANTS } from '../schemas/receita';

interface ReceitaFormProps {
  receita?: Receita;
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (data: ReceitaFormType) => Promise<void>;
  loading?: boolean;
}

/**
 * Componente de formulário para criar/editar receitas
 * Inclui validação Zod, formatação de valores e interface responsiva
 */
export const ReceitaForm: React.FC<ReceitaFormProps> = ({
  receita,
  isOpen = true,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<ReceitaFormData>({
    titulo: '',
    descricao: '',
    valor: 0,
    data_vencimento: '',
    status: 'pendente',
    cliente_nome: '',
    categoria: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Preenche o formulário quando uma receita é passada para edição
   */
  useEffect(() => {
    if (receita) {
      setFormData({
        titulo: receita.titulo,
        descricao: receita.descricao || '',
        valor: receita.valor,
        data_vencimento: receita.data_vencimento,
        status: receita.status,
        cliente_nome: receita.cliente_nome || '',
        categoria: receita.categoria || '',
        observacoes: receita.observacoes || ''
      });
    } else {
      // Reset form for new receita
      setFormData({
        titulo: '',
        descricao: '',
        valor: 0,
        data_vencimento: '',
        status: 'pendente',
        cliente_nome: '',
        categoria: '',
        observacoes: ''
      });
    }
    setErrors({});
  }, [receita, isOpen]);

  /**
   * Atualiza um campo do formulário
   */
  const updateField = (field: keyof ReceitaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remove erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
   * Parse valor monetário do input
   */
  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[R$\s\.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  /**
   * Valida o formulário
   */
  const validateForm = (): boolean => {
    try {
      receitaFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fecha o modal
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {receita ? 'Editar Receita' : 'Nova Receita'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="titulo"
                type="text"
                value={formData.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite o título da receita"
                maxLength={RECEITA_CONSTANTS.TITULO_MAX_LENGTH}
                disabled={isSubmitting}
              />
            </div>
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={RECEITA_CONSTANTS.VALOR_MAX}
                  value={formData.valor}
                  onChange={(e) => updateField('valor', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.valor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  disabled={isSubmitting}
                />
              </div>
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
              )}
            </div>

            {/* Data de Vencimento */}
            <div>
              <label htmlFor="data_vencimento" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => updateField('data_vencimento', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.data_vencimento ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.data_vencimento && (
                <p className="mt-1 text-sm text-red-600">{errors.data_vencimento}</p>
              )}
            </div>
          </div>

          {/* Status e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as ReceitaStatus)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Selecione uma categoria</option>
                  {Object.values(ReceitaCategoria).map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              {errors.categoria && (
                <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
              )}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label htmlFor="cliente_nome" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="cliente_nome"
                type="text"
                value={formData.cliente_nome}
                onChange={(e) => updateField('cliente_nome', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cliente_nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome do cliente"
                maxLength={RECEITA_CONSTANTS.CLIENTE_NOME_MAX_LENGTH}
                disabled={isSubmitting}
              />
            </div>
            {errors.cliente_nome && (
              <p className="mt-1 text-sm text-red-600">{errors.cliente_nome}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.descricao ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Descrição da receita"
              maxLength={RECEITA_CONSTANTS.DESCRICAO_MAX_LENGTH}
              disabled={isSubmitting}
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
                rows={3}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.observacoes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Observações adicionais"
                maxLength={RECEITA_CONSTANTS.OBSERVACOES_MAX_LENGTH}
                disabled={isSubmitting}
              />
            </div>
            {errors.observacoes && (
              <p className="mt-1 text-sm text-red-600">{errors.observacoes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {receita ? 'Atualizar' : 'Criar'} Receita
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceitaForm;