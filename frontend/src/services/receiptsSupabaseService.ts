// Autor: David Assef
// Descrição: Serviço Supabase mínimo para persistência/listagem de recibos em rf_receipts
// Data: 07-09-2025
// MIT License

import { supabase } from '../lib/supabase';

export type ReceiptMinimal = {
  id: string;
  numero: number | null;
  emitido_em: string | null;
  signature_id?: string | null;
  created_at?: string | null;
};

export const ReceiptsMinimalService = {
  async list(): Promise<ReceiptMinimal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('rf_receipts')
      .select('id, numero, emitido_em, signature_id, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Erro ao listar rf_receipts:', error.message);
      return [];
    }
    return data as ReceiptMinimal[];
  },

  async create(input?: { signature_id?: string | null; contract_id?: string | null }): Promise<ReceiptMinimal | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const payload: any = {
      owner_id: user.id,
      income_id: null,
      pdf_url: null,
      hash: null,
    };
    if (input && typeof input.signature_id !== 'undefined') payload.signature_id = input.signature_id;
    if (input && typeof input.contract_id !== 'undefined') payload.contract_id = input.contract_id;
    const { data, error } = await supabase
      .from('rf_receipts')
      .insert(payload)
      .select('id, numero, emitido_em, signature_id, created_at')
      .single();
    if (error) {
      console.warn('Erro ao criar rf_receipts:', error.message);
      return null;
    }
    return data as ReceiptMinimal;
  }
};
