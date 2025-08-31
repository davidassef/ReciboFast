// Autor: David Assef
// Descrição: Funções utilitárias para formatação de dados
// Data: 29-01-2025
// MIT License

/**
 * Formata um valor numérico como moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Converte uma string de moeda para número
 * @param value - String de moeda (ex: "R$ 1.234,56" ou "1.234,56")
 * @returns Valor numérico
 */
export const parseCurrency = (value: string): number => {
  // Remove símbolos de moeda, espaços e pontos de milhares
  const cleanValue = value
    .replace(/[R$\s]/g, '') // Remove R$, espaços
    .replace(/\./g, '') // Remove pontos de milhares
    .replace(',', '.'); // Substitui vírgula decimal por ponto
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata uma data no formato brasileiro
 * @param date - Data como string ISO ou objeto Date
 * @returns String formatada como data brasileira (ex: "31/12/2023")
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data e hora no formato brasileiro
 * @param date - Data como string ISO ou objeto Date
 * @returns String formatada como data e hora brasileira (ex: "31/12/2023 14:30")
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR');
};

/**
 * Formata um número de telefone brasileiro
 * @param phone - Número de telefone como string
 * @returns String formatada (ex: "(11) 99999-9999")
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Formata um CPF
 * @param cpf - CPF como string
 * @returns String formatada (ex: "123.456.789-00")
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  
  return cpf;
};

/**
 * Formata um CNPJ
 * @param cnpj - CNPJ como string
 * @returns String formatada (ex: "12.345.678/0001-90")
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  
  return cnpj;
};

/**
 * Trunca um texto com reticências
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado com reticências se necessário
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Capitaliza a primeira letra de cada palavra
 * @param text - Texto a ser capitalizado
 * @returns Texto com primeira letra de cada palavra maiúscula
 */
export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Remove acentos de uma string
 * @param text - Texto com acentos
 * @returns Texto sem acentos
 */
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Gera um slug a partir de um texto
 * @param text - Texto a ser convertido em slug
 * @returns Slug (texto em minúsculas, sem acentos, com hífens)
 */
export const generateSlug = (text: string): string => {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
};