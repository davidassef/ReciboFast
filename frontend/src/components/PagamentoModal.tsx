// MIT License
// Autor: David Assef
// Descrição: Modal para baixa de pagamentos de receitas
// Data: 29-01-2025

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
// Tipo mínimo local para evitar dependência de '../types/receita'
interface ReceitaResumo {
  id: string;
  valor: number;
  titulo: string;
  cliente_nome?: string;
}
import { Pagamento, FormaPagamento, PagamentoForm, getFormaPagamentoLabel } from '../types/pagamento';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { usePagamentos } from '../hooks/usePagamentos';

interface PagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  receita: ReceitaResumo;
  onPagamentoRegistrado: (pagamento: Pagamento) => void;
  pagamentosExistentes?: Pagamento[];
}

/**
 * Modal para registrar pagamentos de rendas
 * Permite pagamento total ou parcial com diferentes formas de pagamento
 */
export const PagamentoModal: React.FC<PagamentoModalProps> = ({
  isOpen,
  onClose,
  receita,
  onPagamentoRegistrado,
  pagamentosExistentes = []
}) => {
  const [formData, setFormData] = useState<PagamentoForm>({
    valor: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: FormaPagamento.PIX,
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof PagamentoForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registrarPagamento } = usePagamentos();

  // Calcular valores
  const valorTotalPago = pagamentosExistentes.reduce((total, pag) => total + pag.valor, 0);
  const valorRestante = receita.valor - valorTotalPago;
  const isPagamentoCompleto = valorRestante <= 0;

  /**
   * Inicializa o formulário quando o modal abre
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        valor: valorRestante > 0 ? valorRestante : 0,
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: FormaPagamento.PIX,
        observacoes: ''
      });
      setErrors({});
    }
  }, [isOpen, valorRestante]);

  /**
   * Atualiza campo do formulário
   */
  const updateField = <K extends keyof PagamentoForm>(
    field: K,
    value: PagamentoForm[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Valida o formulário
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PagamentoForm, string>> = {};

    if (!formData.valor || formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    } else if (formData.valor > valorRestante) {
      newErrors.valor = `Valor não pode ser maior que ${formatCurrency(valorRestante)}`;
    }

    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data do pagamento é obrigatória';
    }

    if (!formData.forma_pagamento) {
      newErrors.forma_pagamento = 'Forma de pagamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const novoPagamento = await registrarPagamento(receita.id, {
        valor: formData.valor,
        data_pagamento: formData.data_pagamento,
        forma_pagamento: formData.forma_pagamento,
        observacoes: formData.observacoes
      });

      if (novoPagamento) {
        onPagamentoRegistrado(novoPagamento);
        toast.success('Pagamento registrado com sucesso!');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-x-0 top-0 bottom-20 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-xl w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Registrar Pagamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Informações da Renda */}
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="font-medium text-gray-900 mb-2">{receita.titulo}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Valor Total:</span>
                <p className="font-medium">{formatCurrency(receita.valor)}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor Pago:</span>
                <p className="font-medium text-green-600">{formatCurrency(valorTotalPago)}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor Restante:</span>
                <p className="font-medium text-blue-600">{formatCurrency(valorRestante)}</p>
              </div>
              <div>
                <span className="text-gray-500">Cliente:</span>
                <p className="font-medium">{receita.cliente_nome || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Valor */}
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
              Valor do Pagamento *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="valor"
                type="text"
                value={formatCurrency(formData.valor)}
                onChange={(e) => {
                  const valor = parseCurrency(e.target.value);
                  updateField('valor', valor);
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="R$ 0,00"
                disabled={isSubmitting || isPagamentoCompleto}
              />
            </div>
            {errors.valor && (
              <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
            )}
          </div>

          {/* Data do Pagamento */}
          <div>
            <label htmlFor="data_pagamento" className="block text-sm font-medium text-gray-700 mb-2">
              Data do Pagamento *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="data_pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => updateField('data_pagamento', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_pagamento ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.data_pagamento && (
              <p className="mt-1 text-sm text-red-600">{errors.data_pagamento}</p>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                id="forma_pagamento"
                value={formData.forma_pagamento}
                onChange={(e) => updateField('forma_pagamento', e.target.value as FormaPagamento)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.forma_pagamento ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {Object.values(FormaPagamento).map((forma) => (
                  <option key={forma} value={forma}>
                    {getFormaPagamentoLabel(forma)}
                  </option>
                ))}
              </select>
            </div>
            {errors.forma_pagamento && (
              <p className="mt-1 text-sm text-red-600">{errors.forma_pagamento}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <textarea
                id="observacoes"
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Informações adicionais sobre o pagamento..."
                disabled={isSubmitting}
              />
            </div>
          </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || isPagamentoCompleto || valorRestante <= 0}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Pagamento'}
              </button>
            </div>
          </form>
        </div>

        {/* Aviso se já está pago */}
        {isPagamentoCompleto && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <p className="text-sm text-green-800 text-center">
              ✅ Esta renda já foi paga integralmente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagamentoModal;