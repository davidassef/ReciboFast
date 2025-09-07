// Autor: David Assef
// Descrição: Utilitários puros para Recibos (moeda, texto por extenso, recorrência)
// Data: 07-09-2025
// MIT License

export interface ReciboLike {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataEmissao: string;
  status: 'emitido' | 'enviado' | 'pago' | 'vencido' | 'suspenso' | 'revogado';
  descricao: string;
  formaPagamento?: string;
  useLogo?: boolean;
  logoDataUrl?: string;
  cpf?: string;
  signatureId?: string;
  signatureDataUrl?: string;
  contractId?: string;
  issuerName?: string;
  issuerDocumento?: string;
}

// Helpers de moeda (pt-BR)
export const formatCurrencyDigitsToBR = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const number = (parseInt(digits, 10) / 100).toFixed(2);
  const [intPart, decPart] = number.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${decPart}`;
};

export const parseCurrencyBRToNumber = (display: string): number => {
  const cleaned = display.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

export const formatNumberToCurrencyBR = (n: number): string => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

// Valor por extenso (pt-BR) simplificado para dinheiro
export const numeroPorExtensoBRL = (valor: number): string => {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cem', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const toWords = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return unidades[n];
    if (n < 20) return especiais[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const r = n % 10;
      return r ? `${dezenas[d]} e ${unidades[r]}` : dezenas[d];
    }
    if (n === 100) return 'cem';
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      return r ? `${centenas[c + 1]} e ${toWords(r)}` : (c === 1 ? 'cem' : centenas[c + 1]);
    }
    if (n < 1000000) {
      const mil = Math.floor(n / 1000);
      const r = n % 1000;
      const milStr = mil === 1 ? 'mil' : `${toWords(mil)} mil`;
      return r ? `${milStr} ${r < 100 ? 'e ' : ''}${toWords(r)}` : milStr;
    }
    const milhoes = Math.floor(n / 1000000);
    const r = n % 1000000;
    const mStr = milhoes === 1 ? 'um milhão' : `${toWords(milhoes)} milhões`;
    return r ? `${mStr} ${r < 100 ? 'e ' : ''}${toWords(r)}` : mStr;
  };

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  const intStr = inteiro === 0 ? 'zero real' : `${toWords(inteiro)} ${inteiro === 1 ? 'real' : 'reais'}`;
  const centStr = centavos === 0 ? '' : `${centavos < 100 ? toWords(centavos) : ''} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  return centStr ? `${intStr} e ${centStr}` : intStr;
};

export type ContratoLike = {
  id?: string;
  numero?: string;
  cliente?: string;
  documento?: string;
  valor?: number;
  valor_mensal?: number;
  descricao?: string;
  signatureId?: string;
  signatureUrl?: string;
  recurrenceEnabled?: boolean;
  recurrenceDay?: number;
};

export const generateRecurringReceipts = (
  today: Date,
  contratos: ContratoLike[],
  existing: ReciboLike[]
): ReciboLike[] => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const toCreate: ReciboLike[] = [];
  const existingByContract = new Map<string, ReciboLike[]>();

  for (const r of existing) {
    const key = r.contractId || '';
    if (!existingByContract.has(key)) existingByContract.set(key, []);
    existingByContract.get(key)!.push(r);
  }

  for (const c of contratos) {
    if (!c.recurrenceEnabled || !c.recurrenceDay) continue;
    const recurrenceDay = Math.max(1, Math.min(28, Number(c.recurrenceDay)));
    const year = today.getFullYear();
    const month = today.getMonth();
    const target = new Date(year, month, recurrenceDay);
    const diffDays = Math.floor((+target - +today) / ONE_DAY);
    if (diffDays < 0 || diffDays > 10) continue; // janela 0..10 dias

    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const already = (existingByContract.get(c.id || '') || []).some(r => r.contractId === c.id && (r.dataEmissao || '').slice(0, 7) === monthKey);
    if (already) continue;

    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const autoNumber = `RB-AUTO-${year}${String(month + 1).padStart(2, '0')}-${(c.numero || '000')}`;
    const valor = Number(c.valor) || Number(c.valor_mensal) || 0;
    const descricao = c.descricao ? `Contrato ${c.numero} — ${c.descricao}` : `Contrato ${c.numero}`;
    const dataEmissao = target.toISOString().slice(0, 10);

    toCreate.push({
      id,
      numero: autoNumber,
      cliente: c.cliente || 'Cliente',
      valor,
      dataEmissao,
      status: 'emitido',
      descricao,
      formaPagamento: 'PIX',
      useLogo: true,
      logoDataUrl: undefined,
      cpf: c.documento || undefined,
      signatureId: c.signatureId || undefined,
      signatureDataUrl: c.signatureUrl || undefined,
      contractId: c.id || undefined,
      issuerName: undefined,
      issuerDocumento: undefined,
    });
  }

  return toCreate;
};
