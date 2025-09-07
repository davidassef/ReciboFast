// Autor: David Assef
// Descrição: Testes unitários para utilitários de Recibos (moeda, por extenso, recorrência)
// Data: 07-09-2025
// MIT License

import { describe, it, expect } from 'vitest';
import {
  formatCurrencyDigitsToBR,
  parseCurrencyBRToNumber,
  formatNumberToCurrencyBR,
  numeroPorExtensoBRL,
  generateRecurringReceipts,
  type ReciboLike,
  type ContratoLike,
} from './recibos';

describe('Utils de moeda (pt-BR)', () => {
  it('formatCurrencyDigitsToBR formata dígitos em moeda', () => {
    expect(formatCurrencyDigitsToBR('')).toBe('');
    expect(formatCurrencyDigitsToBR('0')).toBe('0,00');
    expect(formatCurrencyDigitsToBR('5')).toBe('0,05');
    expect(formatCurrencyDigitsToBR('50')).toBe('0,50');
    expect(formatCurrencyDigitsToBR('123')).toBe('1,23');
    expect(formatCurrencyDigitsToBR('123456')).toBe('1.234,56');
  });

  it('parseCurrencyBRToNumber parseia moeda corretamente', () => {
    expect(parseCurrencyBRToNumber('')).toBe(0);
    expect(parseCurrencyBRToNumber('0,00')).toBe(0);
    expect(parseCurrencyBRToNumber('1,00')).toBe(1);
    expect(parseCurrencyBRToNumber('1.234,56')).toBeCloseTo(1234.56, 2);
  });

  it('formatNumberToCurrencyBR formata número para moeda BR', () => {
    expect(formatNumberToCurrencyBR(0)).toBe('0,00');
    expect(formatNumberToCurrencyBR(1)).toBe('1,00');
    expect(formatNumberToCurrencyBR(1234.56)).toBe('1.234,56');
  });
});

describe('Número por extenso (BRL)', () => {
  it('gera por extenso para inteiros e centavos', () => {
    expect(numeroPorExtensoBRL(0)).toBe('zero real');
    expect(numeroPorExtensoBRL(1)).toBe('um real');
    expect(numeroPorExtensoBRL(2)).toBe('dois reais');
    expect(numeroPorExtensoBRL(1.5)).toBe('um real e cinquenta centavos');
    expect(numeroPorExtensoBRL(100)).toBe('cem reais');
  });
});

describe('Geração recorrente de recibos', () => {
  const today = new Date(2025, 8, 7); // 07/09/2025 (mês 8 = setembro)

  it('gera recibo quando faltam até 10 dias', () => {
    const contratos: ContratoLike[] = [
      { id: 'c1', numero: 'CONT-001', cliente: 'Cliente 1', documento: '000.000.000-00', valor: 100, descricao: 'Contr 1', recurrenceEnabled: true, recurrenceDay: 17 }
    ];
    const existing: ReciboLike[] = [];
    const created = generateRecurringReceipts(today, contratos, existing);
    expect(created.length).toBe(1);
    expect(created[0].numero).toContain('RB-AUTO-');
    expect(created[0].cliente).toBe('Cliente 1');
    expect(created[0].valor).toBe(100);
    expect(created[0].status).toBe('emitido');
  });

  it('não gera quando o dia já passou ou está além de 10 dias', () => {
    const contratos: ContratoLike[] = [
      { id: 'c2', numero: 'CONT-002', cliente: 'A', recurrenceEnabled: true, recurrenceDay: 5 },  // passou
      { id: 'c3', numero: 'CONT-003', cliente: 'B', recurrenceEnabled: true, recurrenceDay: 25 }, // > 10 dias
    ];
    const existing: ReciboLike[] = [];
    const created = generateRecurringReceipts(today, contratos, existing);
    expect(created.length).toBe(0);
  });

  it('não duplica quando já existe recibo do mês para o contrato', () => {
    const contratos: ContratoLike[] = [
      { id: 'c1', numero: 'CONT-001', cliente: 'Cliente 1', recurrenceEnabled: true, recurrenceDay: 17 }
    ];
    const existing: ReciboLike[] = [
      { id: 'r0', numero: 'RB-AUTO-202509-CONT-001', cliente: 'Cliente 1', valor: 100, dataEmissao: '2025-09-17', status: 'emitido', descricao: 'x', contractId: 'c1' }
    ] as any;
    const created = generateRecurringReceipts(today, contratos, existing);
    expect(created.length).toBe(0);
  });
});
