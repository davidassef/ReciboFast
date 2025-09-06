// Autor: David Assef
// Data: 20-01-2025
// Descrição: Tipos TypeScript para o sistema de recibos
// MIT License

export interface Receipt {
  id: string;
  user_id: string;
  payer_id: string;
  contract_id?: string;
  income_id?: string;
  receipt_number: string;
  amount: number;
  description: string;
  payment_date: string;
  payment_method: string;
  signature_id?: string;
  file_path?: string;
  qr_code?: string;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
}

export interface ReceiptFormData {
  payer_id: string;
  contract_id?: string;
  income_id?: string;
  amount: number;
  description: string;
  payment_date: string;
  payment_method: string;
  signature_id?: string;
  include_signature: boolean;
  include_qr_code: boolean;
}

export interface ReceiptPreview {
  id: string;
  receipt_number: string;
  payer_name: string;
  amount: number;
  description: string;
  payment_date: string;
  payment_method: string;
  status: ReceiptStatus;
  created_at: string;
}

export interface ReceiptPDF {
  id: string;
  receipt_number: string;
  payer: {
    name: string;
    document: string;
    email?: string;
    phone?: string;
  };
  issuer: {
    name: string;
    document: string;
    email?: string;
    phone?: string;
  };
  amount: number;
  amount_text: string;
  description: string;
  payment_date: string;
  payment_method: string;
  signature_url?: string;
  qr_code?: string;
  created_at: string;
}

export interface ReceiptFilter {
  start_date?: string;
  end_date?: string;
  payer_id?: string;
  payment_method?: string;
  status?: ReceiptStatus;
  min_amount?: number;
  max_amount?: number;
}

export interface ReceiptSummary {
  total_receipts: number;
  total_amount: number;
  period: {
    start: string;
    end: string;
  };
  by_payment_method: Record<string, number>;
  by_status: Record<ReceiptStatus, number>;
}

export type ReceiptStatus = 'draft' | 'generated' | 'sent' | 'paid' | 'cancelled';

export type ReceiptGenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface ReceiptGenerationState {
  status: ReceiptGenerationStatus;
  progress: number;
  error?: string;
  receipt_id?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
}

export interface ReceiptValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface QRCodeData {
  receipt_id: string;
  receipt_number: string;
  amount: number;
  verification_url: string;
  created_at: string;
}