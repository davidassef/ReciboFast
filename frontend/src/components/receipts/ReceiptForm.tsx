// Autor: David Assef
// Data: 22-01-2025
// Descrição: Componente de formulário para geração de recibos
// MIT License

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptFormData, ReceiptValidation, PaymentMethod } from '@/types/receipts';
import { Signature } from '@/types/signatures';
import { receiptService } from '@/services/receiptService';
import { signatureService } from '@/services/signatureService';

interface ReceiptFormProps {
  onReceiptGenerated?: (receiptId: string) => void;
  initialData?: Partial<ReceiptFormData>;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  onReceiptGenerated,
  initialData
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    payer_name: '',
    payer_document: '',
    payer_address: '',
    amount: 0,
    description: '',
    payment_method: 'money' as PaymentMethod,
    payment_date: new Date().toISOString().split('T')[0],
    include_signature: false,
    signature_id: null,
    include_qr_code: true,
    ...initialData
  });

  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [validation, setValidation] = useState<ReceiptValidation>({ isValid: true, errors: {} });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);
  const [generatedReceiptId, setGeneratedReceiptId] = useState<string | null>(null);

  // Carregar assinaturas disponíveis
  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      setIsLoadingSignatures(true);
      const userSignatures = await signatureService.listSignatures();
      setSignatures(userSignatures);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      toast.error('Erro ao carregar assinaturas disponíveis');
    } finally {
      setIsLoadingSignatures(false);
    }
  };

  // Validar formulário
  const validateForm = (): ReceiptValidation => {
    const errors: Record<string, string> = {};

    if (!formData.payer_name.trim()) {
      errors.payer_name = 'Nome do pagador é obrigatório';
    }

    if (!formData.payer_document.trim()) {
      errors.payer_document = 'Documento do pagador é obrigatório';
    }

    if (formData.amount <= 0) {
      errors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    }

    if (!formData.payment_date) {
      errors.payment_date = 'Data de pagamento é obrigatória';
    }

    if (formData.include_signature && !formData.signature_id) {
      errors.signature_id = 'Selecione uma assinatura';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Atualizar campo do formulário
  const updateField = (field: keyof ReceiptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo se existir
    if (validation.errors[field]) {
      setValidation(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined }
      }));
    }
  };

  // Gerar recibo
  const handleGenerateReceipt = async () => {
    const formValidation = validateForm();
    setValidation(formValidation);

    if (!formValidation.isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setIsGenerating(true);
      const receipt = await receiptService.createReceipt(formData);
      setGeneratedReceiptId(receipt.id);
      
      toast.success('Recibo gerado com sucesso!');
      
      if (onReceiptGenerated) {
        onReceiptGenerated(receipt.id);
      }
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      toast.error('Erro ao gerar recibo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Baixar recibo gerado
  const handleDownloadReceipt = async () => {
    if (!generatedReceiptId) return;

    try {
      const pdfUrl = await receiptService.getReceiptPdfUrl(generatedReceiptId);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `recibo-${generatedReceiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar recibo:', error);
      toast.error('Erro ao baixar recibo');
    }
  };

  // Visualizar recibo gerado
  const handlePreviewReceipt = async () => {
    if (!generatedReceiptId) return;

    try {
      const pdfUrl = await receiptService.getReceiptPdfUrl(generatedReceiptId);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar recibo:', error);
      toast.error('Erro ao visualizar recibo');
    }
  };

  // Limpar formulário
  const handleClearForm = () => {
    setFormData({
      payer_name: '',
      payer_document: '',
      payer_address: '',
      amount: 0,
      description: '',
      payment_method: 'money' as PaymentMethod,
      payment_date: new Date().toISOString().split('T')[0],
      include_signature: false,
      signature_id: null,
      include_qr_code: true
    });
    setValidation({ isValid: true, errors: {} });
    setGeneratedReceiptId(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerar Novo Recibo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados do Pagador */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados do Pagador</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payer_name">Nome Completo *</Label>
              <Input
                id="payer_name"
                value={formData.payer_name}
                onChange={(e) => updateField('payer_name', e.target.value)}
                placeholder="Nome do pagador"
                className={validation.errors.payer_name ? 'border-red-500' : ''}
              />
              {validation.errors.payer_name && (
                <p className="text-sm text-red-500">{validation.errors.payer_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payer_document">CPF/CNPJ *</Label>
              <Input
                id="payer_document"
                value={formData.payer_document}
                onChange={(e) => updateField('payer_document', e.target.value)}
                placeholder="000.000.000-00"
                className={validation.errors.payer_document ? 'border-red-500' : ''}
              />
              {validation.errors.payer_document && (
                <p className="text-sm text-red-500">{validation.errors.payer_document}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payer_address">Endereço</Label>
            <Input
              id="payer_address"
              value={formData.payer_address}
              onChange={(e) => updateField('payer_address', e.target.value)}
              placeholder="Endereço completo (opcional)"
            />
          </div>
        </div>

        {/* Dados do Pagamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados do Pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className={validation.errors.amount ? 'border-red-500' : ''}
              />
              {validation.errors.amount && (
                <p className="text-sm text-red-500">{validation.errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => updateField('payment_method', value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="money">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Data do Pagamento *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => updateField('payment_date', e.target.value)}
              className={validation.errors.payment_date ? 'border-red-500' : ''}
            />
            {validation.errors.payment_date && (
              <p className="text-sm text-red-500">{validation.errors.payment_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição/Referente a *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descreva o motivo do pagamento"
              rows={3}
              className={validation.errors.description ? 'border-red-500' : ''}
            />
            {validation.errors.description && (
              <p className="text-sm text-red-500">{validation.errors.description}</p>
            )}
          </div>
        </div>

        {/* Opções Adicionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Opções Adicionais</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_qr_code"
                checked={formData.include_qr_code}
                onCheckedChange={(checked) => updateField('include_qr_code', checked)}
              />
              <Label htmlFor="include_qr_code">Incluir QR Code para verificação</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_signature"
                checked={formData.include_signature}
                onCheckedChange={(checked) => {
                  updateField('include_signature', checked);
                  if (!checked) {
                    updateField('signature_id', null);
                  }
                }}
              />
              <Label htmlFor="include_signature">Incluir assinatura digital</Label>
            </div>

            {formData.include_signature && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="signature_id">Selecionar Assinatura</Label>
                {isLoadingSignatures ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando assinaturas...
                  </div>
                ) : signatures.length > 0 ? (
                  <Select
                    value={formData.signature_id || ''}
                    onValueChange={(value) => updateField('signature_id', value)}
                  >
                    <SelectTrigger className={validation.errors.signature_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma assinatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {signatures.map((signature) => (
                        <SelectItem key={signature.id} value={signature.id}>
                          {signature.name} {signature.is_default && '(Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Nenhuma assinatura encontrada. 
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/assinaturas'}>
                        Clique aqui para adicionar uma assinatura
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {validation.errors.signature_id && (
                  <p className="text-sm text-red-500">{validation.errors.signature_id}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleGenerateReceipt}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Recibo
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleClearForm}
            disabled={isGenerating}
          >
            Limpar
          </Button>
        </div>

        {/* Ações do Recibo Gerado */}
        {generatedReceiptId && (
          <div className="border-t pt-4">
            <Alert className="mb-4">
              <AlertDescription>
                Recibo gerado com sucesso! ID: {generatedReceiptId}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
              
              <Button
                onClick={handlePreviewReceipt}
                variant="outline"
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptForm;