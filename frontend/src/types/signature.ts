/**
 * Autor: David Assef
 * Descrição: Tipos TypeScript para o sistema de assinaturas
 * Licença: MIT License
 * Data: 30-08-2025
 */

// Tipo para representar uma assinatura
export interface Signature {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo para dados de upload de assinatura
export interface SignatureUploadData {
  file: File;
  preview_url: string;
}

// Tipo para validação de arquivo de assinatura
export interface SignatureValidation {
  isValid: boolean;
  errors: string[];
}

// Tipo para configurações de upload
export interface SignatureUploadConfig {
  maxFileSize: number; // em bytes (2MB = 2 * 1024 * 1024)
  allowedMimeTypes: string[];
  maxWidth: number;
  maxHeight: number;
}

// Tipo para resposta da API de upload
export interface SignatureUploadResponse {
  success: boolean;
  signature?: Signature;
  message: string;
  errors?: string[];
}

// Tipo para estado do hook de assinaturas
export interface SignatureState {
  signatures: Signature[];
  activeSignature: Signature | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

// Constantes para validação
export const SIGNATURE_CONFIG: SignatureUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/png'],
  maxWidth: 800,
  maxHeight: 400
};

// Enum para status de upload
export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Tipo para preview de assinatura
export interface SignaturePreview {
  file: File;
  url: string;
  width: number;
  height: number;
  isValid: boolean;
  errors: string[];
}