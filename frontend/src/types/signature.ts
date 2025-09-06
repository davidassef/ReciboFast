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
  creation_method?: 'upload' | 'canvas';
  quality_score?: number;
  processing_metadata?: ProcessingMetadata;
  canvas_data?: SignatureCanvasData;
}

// Tipos para canvas digital
export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface Stroke {
  points: Point[];
  strokeWidth: number;
  strokeColor: string;
  startTime: number;
  endTime: number;
}

export interface SignatureCanvasData {
  strokes: Stroke[];
  canvasSize: { width: number; height: number };
  metadata: CanvasMetadata;
}

export interface CanvasMetadata {
  deviceType: 'mouse' | 'touch' | 'pen';
  hasPressure: boolean;
  totalDrawTime: number;
  strokeCount: number;
  averageStrokeLength: number;
}

// Tipos para processamento de imagem
export interface ProcessingMetadata {
  backgroundRemoved: boolean;
  contrastEnhanced: boolean;
  noiseReduced: boolean;
  dimensionsOptimized: boolean;
  originalSize: { width: number; height: number; fileSize: number };
  processedSize: { width: number; height: number; fileSize: number };
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  contrast: number;
  sharpness: number;
  coverage: number;
  aspectRatio: number;
  overallScore: number;
}

// Tipos para validação
export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fileInfo: {
    size: number;
    type: string;
    dimensions: { width: number; height: number };
  };
}

export interface QualityValidationResult {
  score: number;
  isLegible: boolean;
  metrics: QualityMetrics;
  checks: string[];
  suggestions: string[];
}

// Tipo estendido para assinatura com funcionalidades avançadas
export interface SignatureExtended extends Signature {
  creation_method: 'upload' | 'canvas';
  quality_score?: number;
  processing_metadata?: ProcessingMetadata;
  canvas_data?: SignatureCanvasData;
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

// Tipos para métodos de criação
export interface SignatureCreationMethod {
  type: 'upload' | 'canvas';
  title: string;
  description: string;
  icon: string;
  available: boolean;
}

// Tipos para configuração do canvas
export interface CanvasConfig {
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: string;
  backgroundColor: string;
}

// Tipos para processamento de canvas
export interface ProcessingStep {
  name: string;
  description: string;
  progress: number;
  completed: boolean;
}

export interface ProcessingResult {
  success: boolean;
  originalImageUrl: string;
  processedImageUrl: string;
  qualityScore: number;
  processingTime: number;
  metadata: ProcessingMetadata;
}

// Constantes para validação
export const SIGNATURE_CONFIG: SignatureUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/png'],
  maxWidth: 800,
  maxHeight: 400
};

// Configurações do canvas
export const CANVAS_CONFIG = {
  defaultSize: { width: 400, height: 200 },
  minSize: { width: 200, height: 100 },
  maxSize: { width: 800, height: 400 },
  defaultStrokeWidth: 2,
  minStrokeWidth: 1,
  maxStrokeWidth: 10,
  defaultStrokeColor: '#000000',
  backgroundColor: '#ffffff'
} as const;

// Configurações de validação
export const VALIDATION_CONFIG = {
  minQualityScore: 40,
  minContrast: 30,
  minSharpness: 25,
  minCoverage: 5,
  maxCoverage: 85
} as const;

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