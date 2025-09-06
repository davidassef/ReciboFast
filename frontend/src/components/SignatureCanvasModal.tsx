import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { SignatureCanvasControls } from './SignatureCanvasControls';
import { useSignatureCanvas } from '../hooks/useSignatureCanvas';
import { signaturesService } from '../services/signaturesService';
import { SignatureCanvasData, Signature } from '../types/signature';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export interface SignatureCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signature: Signature) => void;
  userId: string;
  title?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export const SignatureCanvasModal: React.FC<SignatureCanvasModalProps> = ({
  open,
  onOpenChange,
  onSave,
  userId,
  title = 'Criar Assinatura Digital',
  width = 400,
  height = 200,
  disabled = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const canvas = useSignatureCanvas({
    width,
    height
  });

  const { isEmpty, clear, getCanvasData, exportAsBlob } = canvas;

  const handleSave = useCallback(async () => {
    if (isEmpty || isSaving) {
      toast.error('Desenhe sua assinatura antes de salvar');
      return;
    }
    
    setIsSaving(true);
    setUploadProgress(0);
    
    try {
      // Get canvas data
      const canvasData = getCanvasData();
      
      // Export as blob
      const blob = await exportAsBlob('png');
      if (!blob) {
        throw new Error('Falha ao exportar assinatura');
      }
      
      // Criar assinatura usando o service
      const result = await signaturesService.createSignatureFromCanvas(
        canvasData,
        blob,
        userId,
        (progress) => setUploadProgress(progress)
      );

      if (result.success && result.signature) {
        toast.success(result.message || 'Assinatura criada com sucesso!');
        onSave(result.signature);
        onOpenChange(false);
      } else {
        throw new Error(result.message || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar assinatura');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  }, [isEmpty, isSaving, getCanvasData, exportAsBlob, onSave, onOpenChange, userId]);

  const handleClear = useCallback(() => {
    if (isEmpty) return;
    
    if (showConfirmClear) {
      clear();
      setShowConfirmClear(false);
      toast.info('Canvas limpo');
    } else {
      setShowConfirmClear(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  }, [isEmpty, showConfirmClear, clear]);

  const handleCancel = useCallback(() => {
    if (!isEmpty && !isSaving) {
      // Show confirmation if there's content
      const confirmed = window.confirm(
        'Você tem certeza que deseja cancelar? Sua assinatura será perdida.'
      );
      if (!confirmed) return;
    }
    
    onOpenChange(false);
  }, [isEmpty, isSaving, onOpenChange]);

  const handleStrokeComplete = useCallback(() => {
    // Hide clear confirmation when user starts drawing again
    if (showConfirmClear) {
      setShowConfirmClear(false);
    }
  }, [showConfirmClear]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${
        isMobile 
          ? 'w-full h-full max-w-none max-h-none' 
          : 'w-full max-w-2xl max-h-[90vh] overflow-y-auto'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${
          isMobile ? 'p-2' : 'p-6 pb-4'
        }`}>
          <h2 className={`font-semibold ${
            isMobile ? 'text-base' : 'text-lg'
          } text-gray-900`}>
            {isMobile ? 'Assinatura Digital' : title}
          </h2>
          <button
            onClick={handleCancel}
            className={`p-0 hover:bg-gray-100 rounded-full transition-colors ${
              isMobile ? 'h-8 w-8' : 'h-6 w-6'
            }`}
            disabled={isSaving}
          >
            <X className={`${
              isMobile ? 'h-5 w-5' : 'h-4 w-4'
            }`} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">Como usar:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Use o mouse ou toque na tela para desenhar sua assinatura</li>
              <li>• Ajuste a espessura e cor do traço conforme necessário</li>
              <li>• Use os botões Desfazer/Refazer para corrigir erros</li>
              <li>• Clique em Salvar quando estiver satisfeito com o resultado</li>
            </ul>
          </div>

          {/* Progress Bar */}
          {isSaving && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processando assinatura...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Canvas Controls */}
          <SignatureCanvasControls
            canvas={canvas}
            disabled={disabled || isSaving}
            className="border border-gray-200"
          />

          {/* Canvas Area */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <SignatureCanvas
              width={isMobile ? 350 : width}
              height={isMobile ? 200 : height}
              disabled={disabled || isSaving}
              onStrokeComplete={handleStrokeComplete}
              className="mx-auto"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={disabled || isEmpty || isSaving}
              className={cn(
                'flex items-center gap-2',
                showConfirmClear && 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              {showConfirmClear ? 'Confirmar Limpeza' : 'Limpar'}
            </Button>
            
            <Button
              type="button"
              onClick={handleSave}
              disabled={disabled || isEmpty || isSaving}
              className="flex-1 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Assinatura
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {isEmpty && (
            <div className="text-center text-gray-500 text-sm py-2">
              Desenhe sua assinatura na área acima
            </div>
          )}
          
          {showConfirmClear && (
            <div className="text-center text-red-600 text-sm py-2 bg-red-50 rounded border border-red-200">
              Clique novamente em "Limpar" para confirmar a remoção da assinatura
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvasModal;