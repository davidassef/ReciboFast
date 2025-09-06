// Autor: David Assef
// Data: 05-09-2025
// Descrição: Serviço para geração e gerenciamento de recibos
// MIT License

import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type {
  Receipt,
  ReceiptFormData,
  ReceiptPreview,
  ReceiptPDF,
  ReceiptFilter,
  ReceiptSummary,
  QRCodeData
} from '../types/receipts';

export class ReceiptService {
  private static readonly BUCKET_NAME = 'receipts';
  // Evitar acesso a window no escopo de módulo para compatibilidade com testes/SSR
  private static get QR_BASE_URL(): string {
    const origin = (typeof window !== 'undefined' && (window as any)?.location?.origin)
      ? (window as any).location.origin
      : 'http://localhost';
    return origin + '/verificar-recibo';
  }

  /**
   * Gera um novo número de recibo
   */
  private static async generateReceiptNumber(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar último número de recibo do usuário
    const { data: lastReceipt } = await supabase
      .from('rf_receipts')
      .select('receipt_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastReceipt?.receipt_number) {
      const lastNumber = parseInt(lastReceipt.receipt_number.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    const year = new Date().getFullYear();
    return `REC-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Converte número para texto por extenso
   */
  private static numberToText(value: number): string {
    // Implementação simplificada - pode ser expandida
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (value === 0) return 'zero reais';
    if (value === 100) return 'cem reais';

    const integerPart = Math.floor(value);
    const decimalPart = Math.round((value - integerPart) * 100);

    let result = '';

    // Processar parte inteira
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      result += this.convertHundreds(thousands) + ' mil';
      const remainder = integerPart % 1000;
      if (remainder > 0) {
        result += ' e ' + this.convertHundreds(remainder);
      }
    } else {
      result = this.convertHundreds(integerPart);
    }

    result += integerPart === 1 ? ' real' : ' reais';

    // Processar centavos
    if (decimalPart > 0) {
      result += ' e ' + this.convertHundreds(decimalPart);
      result += decimalPart === 1 ? ' centavo' : ' centavos';
    }

    return result;
  }

  private static convertHundreds(num: number): string {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (num === 0) return '';
    if (num === 100) return 'cem';

    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (h > 0) result += hundreds[h];
    if (t >= 2) {
      if (result) result += ' e ';
      result += tens[t];
      if (u > 0) result += ' e ' + units[u];
    } else if (t === 1) {
      if (result) result += ' e ';
      result += teens[u];
    } else if (u > 0) {
      if (result) result += ' e ';
      result += units[u];
    }

    return result;
  }

  /**
   * Gera QR Code para verificação do recibo
   */
  private static async generateQRCode(receiptData: QRCodeData): Promise<string> {
    const qrData = {
      id: receiptData.receipt_id,
      number: receiptData.receipt_number,
      amount: receiptData.amount,
      url: receiptData.verification_url,
      timestamp: receiptData.created_at
    };

    try {
      return await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  }

  /**
   * Gera PDF do recibo
   */
  private static async generateReceiptPDF(receiptData: ReceiptPDF): Promise<Blob> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Configurações de fonte
    pdf.setFont('helvetica');

    // Cabeçalho
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECIBO DE PAGAMENTO', pageWidth / 2, 30, { align: 'center' });

    // Número do recibo
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Recibo Nº: ${receiptData.receipt_number}`, 20, 50);
    pdf.text(`Data: ${new Date(receiptData.created_at).toLocaleDateString('pt-BR')}`, pageWidth - 20, 50, { align: 'right' });

    // Linha separadora
    pdf.line(20, 55, pageWidth - 20, 55);

    // Dados do emissor
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMISSOR:', 20, 70);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome: ${receiptData.issuer.name}`, 20, 80);
    pdf.text(`Documento: ${receiptData.issuer.document}`, 20, 88);
    if (receiptData.issuer.email) {
      pdf.text(`Email: ${receiptData.issuer.email}`, 20, 96);
    }
    if (receiptData.issuer.phone) {
      pdf.text(`Telefone: ${receiptData.issuer.phone}`, 20, 104);
    }

    // Dados do pagador
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAGADOR:', 20, 120);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome: ${receiptData.payer.name}`, 20, 130);
    pdf.text(`Documento: ${receiptData.payer.document}`, 20, 138);
    if (receiptData.payer.email) {
      pdf.text(`Email: ${receiptData.payer.email}`, 20, 146);
    }
    if (receiptData.payer.phone) {
      pdf.text(`Telefone: ${receiptData.payer.phone}`, 20, 154);
    }

    // Linha separadora
    pdf.line(20, 165, pageWidth - 20, 165);

    // Detalhes do pagamento
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETALHES DO PAGAMENTO:', 20, 180);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Valor: R$ ${receiptData.amount.toFixed(2).replace('.', ',')}`, 20, 190);
    pdf.text(`Valor por extenso: ${receiptData.amount_text}`, 20, 198);
    pdf.text(`Descrição: ${receiptData.description}`, 20, 206);
    pdf.text(`Data do Pagamento: ${new Date(receiptData.payment_date).toLocaleDateString('pt-BR')}`, 20, 214);
    pdf.text(`Forma de Pagamento: ${receiptData.payment_method}`, 20, 222);

    // Assinatura (se houver)
    if (receiptData.signature_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = receiptData.signature_url!;
        });
        
        pdf.text('Assinatura:', 20, 240);
        pdf.addImage(img, 'PNG', 20, 245, 60, 30);
      } catch (error) {
        console.warn('Erro ao adicionar assinatura ao PDF:', error);
      }
    }

    // QR Code (se houver)
    if (receiptData.qr_code) {
      try {
        pdf.text('Verificação:', pageWidth - 80, 240);
        pdf.addImage(receiptData.qr_code, 'PNG', pageWidth - 80, 245, 40, 40);
        pdf.setFontSize(8);
        pdf.text('Escaneie para verificar', pageWidth - 80, 290);
      } catch (error) {
        console.warn('Erro ao adicionar QR Code ao PDF:', error);
      }
    }

    // Rodapé
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Este recibo foi gerado eletronicamente pelo sistema ReciboFast.', pageWidth / 2, pageHeight - 20, { align: 'center' });

    return pdf.output('blob');
  }

  /**
   * Cria um novo recibo
   */
  static async createReceipt(formData: ReceiptFormData): Promise<Receipt> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Gerar número do recibo
    const receiptNumber = await this.generateReceiptNumber();

    // Buscar dados do pagador
    const { data: payer, error: payerError } = await supabase
      .from('rf_payers')
      .select('*')
      .eq('id', formData.payer_id)
      .eq('user_id', user.id)
      .single();

    if (payerError) {
      throw new Error('Pagador não encontrado');
    }

    // Buscar dados do usuário (emissor)
    const { data: profile, error: profileError } = await supabase
      .from('rf_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Preparar dados para o PDF
    const receiptPDFData: ReceiptPDF = {
      id: '', // Será preenchido após inserção
      receipt_number: receiptNumber,
      payer: {
        name: payer.name,
        document: payer.document,
        email: payer.email,
        phone: payer.phone
      },
      issuer: {
        name: profile.name,
        document: profile.document,
        email: profile.email,
        phone: profile.phone
      },
      amount: formData.amount,
      amount_text: this.numberToText(formData.amount),
      description: formData.description,
      payment_date: formData.payment_date,
      payment_method: formData.payment_method,
      created_at: new Date().toISOString()
    };

    // Gerar QR Code se solicitado
    let qrCode = '';
    if (formData.include_qr_code) {
      const qrData: QRCodeData = {
        receipt_id: '', // Será preenchido após inserção
        receipt_number: receiptNumber,
        amount: formData.amount,
        verification_url: `${this.QR_BASE_URL}/${receiptNumber}`,
        created_at: receiptPDFData.created_at
      };
      qrCode = await this.generateQRCode(qrData);
      receiptPDFData.qr_code = qrCode;
    }

    // Buscar assinatura se solicitada
    if (formData.include_signature && formData.signature_id) {
      const { data: signature } = await supabase
        .from('rf_signatures')
        .select('file_path')
        .eq('id', formData.signature_id)
        .eq('user_id', user.id)
        .single();

      if (signature) {
        const { data: urlData } = supabase.storage
          .from('signatures')
          .getPublicUrl(signature.file_path);
        receiptPDFData.signature_url = urlData.publicUrl;
      }
    }

    // Inserir recibo no banco
    const { data: receipt, error: insertError } = await supabase
      .from('rf_receipts')
      .insert({
        user_id: user.id,
        payer_id: formData.payer_id,
        contract_id: formData.contract_id,
        income_id: formData.income_id,
        receipt_number: receiptNumber,
        amount: formData.amount,
        description: formData.description,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        signature_id: formData.signature_id,
        qr_code: qrCode,
        status: 'generated'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar recibo: ${insertError.message}`);
    }

    // Atualizar ID no PDF
    receiptPDFData.id = receipt.id;

    // Gerar PDF
    const pdfBlob = await this.generateReceiptPDF(receiptPDFData);
    
    // Upload do PDF para o Storage
    const pdfFileName = `${user.id}/${receiptNumber}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(pdfFileName, pdfBlob);

    if (uploadError) {
      console.warn('Erro no upload do PDF:', uploadError.message);
    } else {
      // Atualizar recibo com caminho do arquivo
      await supabase
        .from('rf_receipts')
        .update({ file_path: uploadData.path })
        .eq('id', receipt.id);
    }

    return { ...receipt, file_path: uploadData?.path };
  }

  /**
   * Lista recibos do usuário com filtros
   */
  static async getUserReceipts(filter?: ReceiptFilter): Promise<ReceiptPreview[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    let query = supabase
      .from('rf_receipts')
      .select(`
        id,
        receipt_number,
        amount,
        description,
        payment_date,
        payment_method,
        status,
        created_at,
        rf_payers(name)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros
    if (filter) {
      if (filter.start_date) {
        query = query.gte('payment_date', filter.start_date);
      }
      if (filter.end_date) {
        query = query.lte('payment_date', filter.end_date);
      }
      if (filter.payer_id) {
        query = query.eq('payer_id', filter.payer_id);
      }
      if (filter.payment_method) {
        query = query.eq('payment_method', filter.payment_method);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.min_amount) {
        query = query.gte('amount', filter.min_amount);
      }
      if (filter.max_amount) {
        query = query.lte('amount', filter.max_amount);
      }
    }

    const { data: receipts, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar recibos: ${error.message}`);
    }

    return receipts.map(receipt => {
      const payerRel = (receipt as any).rf_payers;
      const payerName = Array.isArray(payerRel)
        ? (payerRel[0]?.name ?? 'N/A')
        : (payerRel?.name ?? 'N/A');

      return {
        id: receipt.id,
        receipt_number: receipt.receipt_number,
        payer_name: payerName,
        amount: receipt.amount,
        description: receipt.description,
        payment_date: receipt.payment_date,
        payment_method: receipt.payment_method,
        status: receipt.status,
        created_at: receipt.created_at
      };
    });
  }

  /**
   * Obtém URL de download do PDF do recibo
   */
  static async getReceiptPDFUrl(id: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: receipt, error } = await supabase
      .from('rf_receipts')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !receipt.file_path) {
      throw new Error('Recibo não encontrado ou PDF não disponível');
    }

    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(receipt.file_path);

    return urlData.publicUrl;
  }

  /**
   * Gera resumo dos recibos
   */
  static async getReceiptsSummary(filter?: ReceiptFilter): Promise<ReceiptSummary> {
    const receipts = await this.getUserReceipts(filter);
    
    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    const byPaymentMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    receipts.forEach(receipt => {
      byPaymentMethod[receipt.payment_method] = (byPaymentMethod[receipt.payment_method] || 0) + receipt.amount;
      byStatus[receipt.status] = (byStatus[receipt.status] || 0) + 1;
    });

    const dates = receipts.map(r => new Date(r.payment_date));
    const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    return {
      total_receipts: totalReceipts,
      total_amount: totalAmount,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      by_payment_method: byPaymentMethod,
      by_status: byStatus as Record<any, number>
    };
  }
}