// Autor: David Assef
// Data: 05-09-2025
// Descrição: Tipos TypeScript para o sistema de assinaturas
// MIT License

export interface Signature {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignatureUpload {
  name: string;
  file: File;
  is_default?: boolean;
}

export interface SignaturePreview {
  id: string;
  name: string;
  url: string;
  is_default: boolean;
  file_size: number;
  created_at: string;
}

export interface SignatureGalleryItem {
  id: string;
  name: string;
  display_name?: string;
  thumbnail_url: string;
  is_default: boolean;
  created_at: string;
  file_size?: number;
  file_type?: string;
}

export interface SignatureFormData {
  name: string;
  is_default: boolean;
}

export interface SignatureValidation {
  isValid: boolean;
  errors: string[];
  maxSize: number;
  allowedTypes: string[];
}

export type SignatureStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface SignatureUploadState {
  status: SignatureStatus;
  progress: number;
  error?: string;
}