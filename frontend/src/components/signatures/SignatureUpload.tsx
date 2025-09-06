// Autor: David Assef
// Data: 20-01-2025
// Descrição: Componente para upload de assinaturas digitais
// MIT License

import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { SignatureService } from '../../services/signatureService';
import type { SignatureUpload as SignatureUploadType, SignatureValidation } from '../../types/signatures';

interface SignatureUploadProps {
  onUploadSuccess?: (signature: SignatureUploadType) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // em MB
  acceptedFormats?: string[];
  className?: string;
}

export const SignatureUpload: React.FC<SignatureUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg'],
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validation, setValidation] = useState<SignatureValidation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): SignatureValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      errors.push(`Arquivo muito grande. Máximo: ${maxFileSize}MB`);
    }

    // Validar formato
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`Formato não suportado. Aceitos: ${acceptedFormats.join(', ')}`);
    }

    // Validar nome do arquivo
    if (file.name.length > 100) {
      warnings.push('Nome do arquivo muito longo');
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      file_size: file.size,
      file_type: file.type
    };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    setValidation(validation);

    if (!validation.is_valid) {
      onUploadError?.(validation.errors.join(', '));
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setFileName(file.name);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      const uploadedSignature = await SignatureService.uploadSignature(file);
      onUploadSuccess?.(uploadedSignature);
      
      // Limpar estado
      setPreview(null);
      setFileName('');
      setValidation(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setFileName('');
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Área de Upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : preview 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          disabled={uploading}
        />

        {preview ? (
          <div className="space-y-4">
            {/* Preview da Assinatura */}
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview da assinatura"
                className="max-h-32 max-w-full object-contain border rounded"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nome do Arquivo */}
            <p className="text-sm text-gray-600 truncate">{fileName}</p>

            {/* Validação */}
            {validation && (
              <div className="text-sm">
                {validation.warnings.length > 0 && (
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validation.warnings.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Arquivo válido para upload</span>
                </div>
              </div>
            )}

            {/* Botão de Upload */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={uploading || !validation?.is_valid}
              className="
                px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center gap-2 mx-auto
              "
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar Assinatura
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Arraste sua assinatura aqui
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ou clique para selecionar um arquivo
              </p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Formatos aceitos: PNG, JPEG, JPG</p>
              <p>Tamanho máximo: {maxFileSize}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Mensagens de Erro */}
      {validation && validation.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erro na validação:</span>
          </div>
          <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};