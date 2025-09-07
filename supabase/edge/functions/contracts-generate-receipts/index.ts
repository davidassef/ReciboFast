// Autor: David Assef
// Descrição: Edge Function - Gera recibos automaticamente 10 dias antes do vencimento para contratos recorrentes
// Data: 07-09-2025
// MIT License

// Importa tipos do runtime Edge Functions
// deno-lint-ignore-file no-explicit-any

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface ReceiptRow {
  id: string;
}

interface ContractRow {
  id: string;
  owner_id: string;
  payer_id: string | null;
  descricao: string | null;
  valor_mensal: number;
  vencimento_dia: number | null;
  recurrence_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

// Util simples para obter ano-mês
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

async function createClient(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('jsr:@supabase/supabase-js@2');
  return createClient(url, key, { global: { headers: { 'x-client-info': 'contracts-generate-receipts' } } });
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = await createClient(req);

    // Data base (hoje) e janela de 10 dias
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const windowEnd = new Date(+today + 10 * 24 * 60 * 60 * 1000);

    // Busca contratos recorrentes ativos (assumindo ativo via lógica de app; aqui apenas flag)
    const { data: contracts, error: cErr } = await supabase
      .from('rf_contracts')
      .select('id, owner_id, payer_id, descricao, valor_mensal, vencimento_dia, recurrence_enabled, created_at, updated_at')
      .eq('recurrence_enabled', true);

    if (cErr) {
      return new Response(JSON.stringify({ ok: false, error: cErr.message }), { status: 500 });
    }

    const created: ReceiptRow[] = [];
    const skipped: string[] = [];
    const monthKey = ym(today);

    for (const c of (contracts || []) as ContractRow[]) {
      if (!c.vencimento_dia || c.vencimento_dia < 1 || c.vencimento_dia > 28) {
        skipped.push(c.id);
        continue;
      }
      const target = new Date(year, month, c.vencimento_dia);
      if (target < today || target > windowEnd) {
        skipped.push(c.id);
        continue;
      }
      // Evita duplicidade: existe recibo desse contrato no mês?
      const startMonth = `${monthKey}-01`;
      const endMonth = `${monthKey}-31`;
      const { data: existing, error: eErr } = await supabase
        .from('rf_receipts')
        .select('id')
        .gte('emitido_em', startMonth)
        .lte('emitido_em', endMonth)
        .eq('contract_id', c.id)
        .eq('owner_id', c.owner_id)
        .limit(1);
      if (eErr) {
        skipped.push(c.id);
        continue;
      }
      if (existing && existing.length > 0) {
        // Obs: idealmente checar vínculo com contrato (coluna específica). Como fallback, evitar duplicatas no mês do mesmo owner.
        skipped.push(c.id);
        continue;
      }

      // Cria recibo simples (deixa numero bigserial a cargo do banco)
      const { data: ins, error: iErr } = await supabase
        .from('rf_receipts')
        .insert({
          owner_id: c.owner_id,
          income_id: null,
          contract_id: c.id,
          pdf_url: null,
          hash: null,
        })
        .select('id')
        .single();
      if (iErr) {
        skipped.push(c.id);
        continue;
      }
      created.push(ins as ReceiptRow);
    }

    return new Response(JSON.stringify({ ok: true, created, skipped }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500 });
  }
});
