// MIT License
// Autor: David Assef
// Descrição: Schemas de validação Zod para Receitas
// Data: 20-01-2025

import { z } from 'zod';

/**
 * Schema de validação para formulário de receita
 */
export const receitaFormSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres')
    .trim(),
    
  descricao: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
    
  valor: z
    .number({
      message: 'Valor deve ser um número'
    })
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor deve ser menor que R$ 999.999,99')
    .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais'),
    
  data_vencimento: z
    .string()
    .min(1, 'Data de vencimento é obrigatória')
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Data de vencimento inválida')
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const vencimento = new Date(date);
      return vencimento >= today;
    }, 'Data de vencimento não pode ser anterior a hoje'),
    
  status: z
    .enum(['pendente', 'pago', 'vencido'], {
      message: 'Status inválido'
    })
    .default('pendente'),
    
  cliente_nome: z
    .string()
    .max(255, 'Nome do cliente deve ter no máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
    
  categoria: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
    
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema de validação para filtros de receita
 */
export const receitaFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'vencido', 'all']).optional(),
  categoria: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  valor_min: z.number().min(0).optional(),
  valor_max: z.number().min(0).optional(),
  cliente_nome: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort_by: z.enum(['data_vencimento', 'valor', 'titulo', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
}).refine((data) => {
  if (data.data_inicio && data.data_fim) {
    return new Date(data.data_inicio) <= new Date(data.data_fim);
  }
  return true;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['data_fim']
}).refine((data) => {
  if (data.valor_min && data.valor_max) {
    return data.valor_min <= data.valor_max;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor que o valor máximo',
  path: ['valor_max']
});

/**
 * Schema para validação de valor monetário
 */
export const valorSchema = z
  .string()
  .transform((val) => {
    // Remove formatação monetária (R$, pontos, vírgulas)
    const cleanValue = val.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue);
  })
  .pipe(
    z.number()
      .positive('Valor deve ser maior que zero')
      .max(999999.99, 'Valor deve ser menor que R$ 999.999,99')
  );

/**
 * Schema para validação de data
 */
export const dataSchema = z
  .string()
  .refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, 'Data inválida');

/**
 * Tipos inferidos dos schemas
 */
export type ReceitaFormData = z.infer<typeof receitaFormSchema>;
export type ReceitaFiltersData = z.infer<typeof receitaFiltersSchema>;

/**
 * Função utilitária para validar formulário de receita
 */
export const validateReceitaForm = (data: unknown) => {
  return receitaFormSchema.safeParse(data);
};

/**
 * Função utilitária para validar filtros de receita
 */
export const validateReceitaFilters = (data: unknown) => {
  return receitaFiltersSchema.safeParse(data);
};

/**
 * Constantes para validação
 */
export const RECEITA_CONSTANTS = {
  TITULO_MIN_LENGTH: 3,
  TITULO_MAX_LENGTH: 255,
  DESCRICAO_MAX_LENGTH: 1000,
  CLIENTE_NOME_MAX_LENGTH: 255,
  CATEGORIA_MAX_LENGTH: 100,
  OBSERVACOES_MAX_LENGTH: 1000,
  VALOR_MAX: 999999.99,
  VALOR_MIN: 0.01
} as const;

/**
 * Mensagens de erro padrão
 */
export const RECEITA_ERROR_MESSAGES = {
  TITULO_REQUIRED: 'Título é obrigatório',
  TITULO_MIN_LENGTH: `Título deve ter pelo menos ${RECEITA_CONSTANTS.TITULO_MIN_LENGTH} caracteres`,
  TITULO_MAX_LENGTH: `Título deve ter no máximo ${RECEITA_CONSTANTS.TITULO_MAX_LENGTH} caracteres`,
  VALOR_REQUIRED: 'Valor é obrigatório',
  VALOR_POSITIVE: 'Valor deve ser maior que zero',
  VALOR_MAX: `Valor deve ser menor que R$ ${RECEITA_CONSTANTS.VALOR_MAX.toLocaleString('pt-BR')}`,
  DATA_REQUIRED: 'Data de vencimento é obrigatória',
  DATA_INVALID: 'Data de vencimento inválida',
  DATA_PAST: 'Data de vencimento não pode ser anterior a hoje',
  STATUS_REQUIRED: 'Status é obrigatório'
} as const;