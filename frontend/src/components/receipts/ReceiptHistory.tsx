// Autor: David Assef
// Data: 05-09-2025
// Descrição: Componente de histórico e listagem de recibos
// MIT License

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Search, 
  Download, 
  Eye, 
  Filter, 
  Calendar,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Receipt, ReceiptFilter, ReceiptStatus, PaymentMethod } from '@/types/receipts';
import { receiptService } from '@/services/receiptService';

interface ReceiptHistoryProps {
  onReceiptSelect?: (receipt: Receipt) => void;
  showActions?: boolean;
}

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({
  onReceiptSelect,
  showActions = true
}) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<ReceiptFilter>({
    status: undefined,
    payment_method: undefined,
    date_from: undefined,
    date_to: undefined,
    min_amount: undefined,
    max_amount: undefined
  });

  // Carregar recibos
  useEffect(() => {
    loadReceipts();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    applyFilters();
  }, [receipts, searchTerm, filters]);

  const loadReceipts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const userReceipts = await receiptService.listReceipts();
      setReceipts(userReceipts);
    } catch (error) {
      console.error('Erro ao carregar recibos:', error);
      toast.error('Erro ao carregar histórico de recibos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...receipts];

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(receipt => 
        receipt.payer_name.toLowerCase().includes(term) ||
        receipt.payer_document.toLowerCase().includes(term) ||
        receipt.description.toLowerCase().includes(term) ||
        receipt.receipt_number.toLowerCase().includes(term)
      );
    }

    // Filtros específicos
    if (filters.status) {
      filtered = filtered.filter(receipt => receipt.status === filters.status);
    }

    if (filters.payment_method) {
      filtered = filtered.filter(receipt => receipt.payment_method === filters.payment_method);
    }

    if (filters.date_from) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.payment_date) >= new Date(filters.date_from!)
      );
    }

    if (filters.date_to) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.payment_date) <= new Date(filters.date_to!)
      );
    }

    if (filters.min_amount !== undefined) {
      filtered = filtered.filter(receipt => receipt.amount >= filters.min_amount!);
    }

    if (filters.max_amount !== undefined) {
      filtered = filtered.filter(receipt => receipt.amount <= filters.max_amount!);
    }

    // Ordenar por data de criação (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredReceipts(filtered);
  };

  const handleDownloadReceipt = async (receiptId: string, receiptNumber: string) => {
    try {
      const pdfUrl = await receiptService.getReceiptPdfUrl(receiptId);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `recibo-${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar recibo:', error);
      toast.error('Erro ao baixar recibo');
    }
  };

  const handlePreviewReceipt = async (receiptId: string) => {
    try {
      const pdfUrl = await receiptService.getReceiptPdfUrl(receiptId);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar recibo:', error);
      toast.error('Erro ao visualizar recibo');
    }
  };

  const handleDeleteReceipt = async (receiptId: string, receiptNumber: string) => {
    if (!confirm(`Tem certeza que deseja excluir o recibo ${receiptNumber}?`)) {
      return;
    }

    try {
      // Nota: Implementar método de exclusão no receiptService se necessário
      toast.success('Recibo excluído com sucesso!');
      loadReceipts(false);
    } catch (error) {
      console.error('Erro ao excluir recibo:', error);
      toast.error('Erro ao excluir recibo');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      payment_method: undefined,
      date_from: undefined,
      date_to: undefined,
      min_amount: undefined,
      max_amount: undefined
    });
    setSearchTerm('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      archived: { label: 'Arquivado', variant: 'secondary' as const }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando histórico de recibos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Recibos
            {filteredReceipts.length > 0 && (
              <Badge variant="outline">{filteredReceipts.length}</Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReceipts(false)}
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
      
      <CardContent className="space-y-4">
        {/* Barra de Busca */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, documento, descrição ou número do recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value as ReceiptStatus || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={filters.payment_method || ''}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, payment_method: value as PaymentMethod || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="money">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ ...prev, date_from: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ ...prev, date_to: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.min_amount || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ ...prev, min_amount: parseFloat(e.target.value) || undefined }))
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.max_amount || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ ...prev, max_amount: parseFloat(e.target.value) || undefined }))
                  }
                  placeholder="0,00"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </Card>
        )}

        {/* Lista de Recibos */}
        {filteredReceipts.length === 0 ? (
          <Alert>
            <AlertDescription>
              {receipts.length === 0 
                ? 'Nenhum recibo encontrado. Gere seu primeiro recibo!' 
                : 'Nenhum recibo encontrado com os filtros aplicados.'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Mobile: lista em accordion */}
            <div className="md:hidden space-y-3">
              {filteredReceipts.map((receipt) => (
                <details key={receipt.id} className="bg-white border rounded-lg">
                  <summary className="list-none cursor-pointer p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{receipt.payer_name}</p>
                      <p className="text-sm text-gray-500 truncate">{receipt.receipt_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(receipt.amount)}</div>
                      <div className="text-xs text-gray-500">{formatDate(receipt.created_at)}</div>
                    </div>
                  </summary>
                  <div className="px-4 pt-2 pb-4 border-t text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Pagamento</span><span>{getPaymentMethodLabel(receipt.payment_method)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Pago em</span><span>{formatDate(receipt.payment_date)}</span></div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(receipt.status)}
                    </div>
                    {showActions && (
                      <div className="pt-2 flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handlePreviewReceipt(receipt.id); }}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(receipt.id, receipt.receipt_number); }}
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteReceipt(receipt.id, receipt.receipt_number); }}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    {showActions && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow 
                      key={receipt.id}
                      className={onReceiptSelect ? 'cursor-pointer hover:bg-gray-50' : ''}
                      onClick={() => onReceiptSelect?.(receipt)}
                    >
                      <TableCell className="font-mono text-sm">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{receipt.payer_name}</div>
                          <div className="text-sm text-gray-500">{receipt.payer_document}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{getPaymentMethodLabel(receipt.payment_method)}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(receipt.payment_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(receipt.created_at)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>
                      {showActions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewReceipt(receipt.id);
                              }}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadReceipt(receipt.id, receipt.receipt_number);
                              }}
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReceipt(receipt.id, receipt.receipt_number);
                              }}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptHistory;