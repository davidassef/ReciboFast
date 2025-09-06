// Autor: David Assef
// Data: 22-01-2025
// Descrição: Componente de resumo e estatísticas de recibos
// MIT License

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptSummary as IReceiptSummary, PaymentMethod } from '@/types/receipts';
import { receiptService } from '@/services/receiptService';

interface ReceiptSummaryProps {
  period?: 'week' | 'month' | 'quarter' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  period = 'month',
  onPeriodChange
}) => {
  const [summary, setSummary] = useState<IReceiptSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Carregar resumo
  useEffect(() => {
    loadSummary();
  }, [selectedPeriod]);

  const loadSummary = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const summaryData = await receiptService.getReceiptSummary({
        period: selectedPeriod
      });
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
      toast.error('Erro ao carregar resumo de recibos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPeriodLabel = (periodKey: string) => {
    const labels = {
      week: 'Semana',
      month: 'Mês',
      quarter: 'Trimestre',
      year: 'Ano'
    };
    return labels[periodKey as keyof typeof labels] || periodKey;
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const methods = {
      money: 'Dinheiro',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque',
      card: 'Cartão',
      other: 'Outros'
    };
    return methods[method] || method;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando resumo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Alert>
        <AlertDescription>
          Erro ao carregar dados do resumo. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo de Recibos
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select
                value={selectedPeriod}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSummary(false)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Recibos */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Recibos</p>
                <p className="text-2xl font-bold">{summary.total_receipts}</p>
                {summary.receipts_change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${getTrendColor(summary.receipts_change)}`}>
                    {getTrendIcon(summary.receipts_change)}
                    <span>{formatPercentage(summary.receipts_change)}</span>
                    <span className="text-gray-500">vs período anterior</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</p>
                {summary.amount_change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${getTrendColor(summary.amount_change)}`}>
                    {getTrendIcon(summary.amount_change)}
                    <span>{formatPercentage(summary.amount_change)}</span>
                    <span className="text-gray-500">vs período anterior</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor Médio */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.average_amount)}</p>
                {summary.average_change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${getTrendColor(summary.average_change)}`}>
                    {getTrendIcon(summary.average_change)}
                    <span>{formatPercentage(summary.average_change)}</span>
                    <span className="text-gray-500">vs período anterior</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Período */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Período</p>
                <p className="text-2xl font-bold">{getPeriodLabel(selectedPeriod)}</p>
                <p className="text-sm text-gray-500">
                  {summary.period_start && summary.period_end && (
                    `${new Date(summary.period_start).toLocaleDateString('pt-BR')} - ${new Date(summary.period_end).toLocaleDateString('pt-BR')}`
                  )}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Forma de Pagamento */}
      {summary.payment_methods && summary.payment_methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.payment_methods.map((method) => {
                const percentage = summary.total_receipts > 0 
                  ? (method.count / summary.total_receipts) * 100 
                  : 0;
                
                return (
                  <div key={method.payment_method} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span className="font-medium">
                        {getPaymentMethodLabel(method.payment_method)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(method.total_amount)}</div>
                        <div className="text-sm text-gray-500">
                          {method.count} recibo{method.count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                      
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recibos Recentes */}
      {summary.recent_receipts && summary.recent_receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recibos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recent_receipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{receipt.payer_name}</div>
                    <div className="text-sm text-gray-500">
                      {receipt.receipt_number} • {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(receipt.amount)}</div>
                    <Badge variant="outline" className="text-xs">
                      {getPaymentMethodLabel(receipt.payment_method)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {summary.total_receipts === 0 && (
        <Alert>
          <AlertDescription>
            Nenhum recibo encontrado no período selecionado. 
            Gere seu primeiro recibo para ver as estatísticas aqui!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ReceiptSummary;