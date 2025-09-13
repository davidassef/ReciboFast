// Autor: David Assef
// Descrição: Serviço Supabase para contratos (rf_contracts) e pagadores (rf_payers)
// Data: 07-09-2025
// MIT License

import { supabase } from '../lib/supabase';

export type ContratoUI = {
  id: string;
  numero?: string;
  cliente: string;
  documento: string;
  valor: number;
  dataInicio?: string;
  dataFim?: string;
  status: 'ativo' | 'inativo' | 'vencido';
  tipo?: string;
  descricao?: string;
  signatureId?: string;
  issuerName?: string;
  issuerDocumento?: string;
  recurrenceEnabled?: boolean;
  recurrenceDay?: number;
};

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

async function ensurePayer(ownerId: string, nome: string, documento?: string): Promise<{ id: string } | null> {
  const name = (nome || '').trim();
  const doc = (documento || '').trim();
  if (!name && !doc) return null;

  let query = supabase.from('rf_payers').select('id').eq('owner_id', ownerId).limit(1);
  if (name) query = query.eq('nome', name);
  if (doc) query = query.eq('documento', doc);
  // Quando não há resultado, .single() retorna 406; use .maybeSingle() para evitar erro
  const { data: found, error } = await query.maybeSingle();
  if (!error && found) return found as { id: string };

  const { data: inserted, error: insErr } = await supabase
    .from('rf_payers')
    .insert({ owner_id: ownerId, nome: name || 'Cliente', documento: doc || null })
    .select('id')
    .single();
  if (insErr) throw new Error(`Falha ao criar pagador: ${insErr.message}`);
  return inserted as { id: string };
}

function mapRowToUI(row: any, payer?: any): ContratoUI {
  const cliente = payer?.nome || 'Cliente';
  const documento = payer?.documento || '';
  return {
    id: row.id,
    numero: row.numero || undefined,
    cliente,
    documento,
    valor: Number(row.valor_mensal || 0),
    dataInicio: row.data_inicio || undefined,
    dataFim: row.data_fim || undefined,
    status: (row.status || (row.ativo ? 'ativo' : 'inativo')) as ContratoUI['status'],
    tipo: row.tipo || undefined,
    descricao: row.descricao || undefined,
    signatureId: row.default_signature_id || undefined,
    issuerName: row.issuer_name || undefined,
    issuerDocumento: row.issuer_document || undefined,
    recurrenceEnabled: !!row.recurrence_enabled,
    recurrenceDay: row.vencimento_dia || undefined,
  };
}

export const ContractsService = {
  async list(): Promise<ContratoUI[]> {
    const ownerId = await getUserId();
    const { data, error } = await supabase
      .from('rf_contracts')
      .select('*, rf_payers(id, nome, documento)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Erro ao listar contratos: ${error.message}`);
    return (data || []).map((row: any) => {
      const payer = Array.isArray(row.rf_payers) ? row.rf_payers[0] : row.rf_payers;
      return mapRowToUI(row, payer);
    });
  },

  async create(input: Omit<ContratoUI, 'id'>): Promise<ContratoUI> {
    const ownerId = await getUserId();
    const payer = await ensurePayer(ownerId, input.cliente, input.documento);
    const payload: any = {
      owner_id: ownerId,
      payer_id: payer?.id || null,
      descricao: input.descricao || null,
      valor_mensal: Number(input.valor || 0),
      vencimento_dia: input.recurrenceDay || null,
      ativo: input.status ? (input.status === 'ativo') : true,
      default_signature_id: input.signatureId || null,
      recurrence_enabled: !!input.recurrenceEnabled,
      numero: input.numero || null,
      tipo: input.tipo || null,
      data_inicio: input.dataInicio || null,
      data_fim: input.dataFim || null,
      status: input.status || 'ativo',
      issuer_name: input.issuerName || null,
      issuer_document: input.issuerDocumento || null,
    };
    const { data, error } = await supabase
      .from('rf_contracts')
      .insert(payload)
      .select('*, rf_payers(id, nome, documento)')
      .single();
    if (error) throw new Error(`Erro ao criar contrato: ${error.message}`);
    const payerRel = Array.isArray((data as any).rf_payers) ? (data as any).rf_payers[0] : (data as any).rf_payers;
    return mapRowToUI(data, payerRel);
  },

  async update(id: string, input: Partial<ContratoUI>): Promise<ContratoUI> {
    const ownerId = await getUserId();
    let payerId: string | null | undefined = undefined;
    if (input.cliente || input.documento) {
      const payer = await ensurePayer(ownerId, input.cliente || '', input.documento);
      payerId = payer?.id || null;
    }
    const patch: any = {};
    if (typeof payerId !== 'undefined') patch.payer_id = payerId;
    if (typeof input.descricao !== 'undefined') patch.descricao = input.descricao || null;
    if (typeof input.valor !== 'undefined') patch.valor_mensal = Number(input.valor || 0);
    if (typeof input.recurrenceDay !== 'undefined') patch.vencimento_dia = input.recurrenceDay || null;
    if (typeof input.status !== 'undefined') {
      patch.status = input.status;
      patch.ativo = input.status === 'ativo';
    }
    if (typeof input.signatureId !== 'undefined') patch.default_signature_id = input.signatureId || null;
    if (typeof input.recurrenceEnabled !== 'undefined') patch.recurrence_enabled = !!input.recurrenceEnabled;
    if (typeof input.numero !== 'undefined') patch.numero = input.numero || null;
    if (typeof input.tipo !== 'undefined') patch.tipo = input.tipo || null;
    if (typeof input.dataInicio !== 'undefined') patch.data_inicio = input.dataInicio || null;
    if (typeof input.dataFim !== 'undefined') patch.data_fim = input.dataFim || null;
    if (typeof input.issuerName !== 'undefined') patch.issuer_name = input.issuerName || null;
    if (typeof input.issuerDocumento !== 'undefined') patch.issuer_document = input.issuerDocumento || null;

    const { data, error } = await supabase
      .from('rf_contracts')
      .update(patch)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*, rf_payers(id, nome, documento)')
      .single();
    if (error) throw new Error(`Erro ao atualizar contrato: ${error.message}`);
    const payerRel = Array.isArray((data as any).rf_payers) ? (data as any).rf_payers[0] : (data as any).rf_payers;
    return mapRowToUI(data, payerRel);
  },

  async remove(id: string): Promise<boolean> {
    const ownerId = await getUserId();
    const { error } = await supabase
      .from('rf_contracts')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);
    if (error) {
      console.warn('Erro ao excluir contrato:', error.message);
      return false;
    }
    return true;
  }
};
