/**
 * Autor: David Assef
 * Descrição: Componente de upload de assinatura com preview e validação
 * Licença: MIT License
 * Data: 30-08-2025
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useSignatures } from '../hooks/useSignatures';
import {
  SignaturePreview,
  SIGNATURE_CONFIG,
  UploadStatus
} from '../types/signature';

interface SignatureUploadProps {
  onUploadSuccess?: (signatureId: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export const SignatureUpload: React.FC<SignatureUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  className = ''
}) => {
  const {
    uploadSignature,
    uploadProgress,
    uploadStatus,
    resetUploadStatus,
    validateSignatureFile,
    validateImageDimensions
  } = useSignatures();

  const [preview, setPreview] = useState<SignaturePreview | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Processa arquivo selecionado
   */
  const processFile = useCallback(async (file: File) => {
    // Validação básica do arquivo
    const fileValidation = validateSignatureFile(file);
    if (!fileValidation.isValid) {
      setPreview({
        file,
        url: '',
        width: 0,
        height: 0,
        isValid: false,
        errors: fileValidation.errors
      });
      return;
    }

    // Criar URL de preview
    const url = URL.createObjectURL(file);

    // Validar dimensões
    const dimensionsValidation = await validateImageDimensions(file);
    
    // Obter dimensões da imagem
    const img = new Image();
    img.onload = () => {
      setPreview({
        file,
        url,
        width: img.width,
        height: img.height,
        isValid: dimensionsValidation.isValid,
        errors: dimensionsValidation.errors
      });
    };
    img.src = url;
  }, [validateSignatureFile, validateImageDimensions]);

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  /**
   * Manipula drag and drop
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * Faz upload da assinatura
   */
  const handleUpload = useCallback(async () => {
    if (!preview?.file || !preview.isValid) return;

    try {
      const response = await uploadSignature(preview.file);
      
      if (response.success && response.signature) {
        onUploadSuccess?.(response.signature.id);
        // Limpar preview após sucesso
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        onUploadError?.(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      onUploadError?.(errorMessage);
    }
  }, [preview, uploadSignature, onUploadSuccess, onUploadError]);

  /**
   * Remove preview
   */
  const handleRemovePreview = useCallback(() => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    resetUploadStatus();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview, resetUploadStatus]);

  /**
   * Abre seletor de arquivo
   */
  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const maxSizeMB = SIGNATURE_CONFIG.maxFileSize / (1024 * 1024);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de upload */}
      {!preview && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploadStatus === UploadStatus.UPLOADING ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleSelectFile}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <Upload className="w-full h-full" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Clique para selecionar ou arraste sua assinatura
              </p>
              <p className="text-sm text-gray-500">
                Apenas arquivos PNG • Máximo {maxSizeMB}MB • {SIGNATURE_CONFIG.maxWidth}x{SIGNATURE_CONFIG.maxHeight}px
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview da assinatura */}
      {preview && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Preview da Assinatura
            </h3>
            <button
              onClick={handleRemovePreview}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={uploadStatus === UploadStatus.UPLOADING}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Imagem de preview */}
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            {preview.url ? (
              <img
                src={preview.url}
                alt="Preview da assinatura"
                className="max-w-full max-h-48 object-contain border border-gray-200 rounded"
              />
            ) : (
              <div className="flex items-center justify-center w-48 h-24 bg-gray-200 rounded">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Informações do arquivo */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Arquivo:</span>
              <p className="text-gray-600 truncate">{preview.file.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tamanho:</span>
              <p className="text-gray-600">{formatFileSize(preview.file.size)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dimensões:</span>
              <p className="text-gray-600">{preview.width}x{preview.height}px</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipo:</span>
              <p className="text-gray-600">{preview.file.type}</p>
            </div>
          </div>

          {/* Erros de validação */}
          {!preview.isValid && preview.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-800">
                    Arquivo inválido:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {preview.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Barra de progresso */}
          {uploadStatus === UploadStatus.UPLOADING && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Enviando...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleRemovePreview}
              disabled={uploadStatus === UploadStatus.UPLOADING}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!preview.isValid || uploadStatus === UploadStatus.UPLOADING}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {uploadStatus === UploadStatus.UPLOADING ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enviar Assinatura</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureUpload;