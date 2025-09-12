import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { SignatureCanvasControls } from './SignatureCanvasControls';
import { useSignatureCanvas } from '../hooks/useSignatureCanvas';
import { signaturesService } from '../services/signaturesService';
import { SignatureCanvasData, Signature } from '../types/signature';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import Modal from './ui/Modal';

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
  const [orientation, setOrientation] = useState<'default' | 'portrait'>('default');
  const [signatureName, setSignatureName] = useState<string>('');
  const [portraitSize, setPortraitSize] = useState<{ width: number; height: number }>({ width: 360, height: 600 });

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tentar bloquear/desbloquear orientação (quando permitido pelo navegador)
  useEffect(() => {
    return () => {
      try {
        // Desbloquear ao desmontar
        // @ts-ignore
        if (screen.orientation && (screen.orientation as any).unlock) {
          // @ts-ignore
          (screen.orientation as any).unlock();
        }
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      } catch {}
    };
  }, []);

  // Calcular dimensões dinâmicas do canvas em modo retrato (mobile)
  useEffect(() => {
    if (!isMobile || orientation !== 'portrait') return;
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Margens internas aproximadas do modal + espaçamentos
      const horizontalPadding = 32; // px
      const verticalPaddingAndUI = 200; // header + instruções + controles + paddings
      const maxW = Math.min(Math.floor(vw * 0.95), 480);
      const maxH = Math.max(220, Math.min(Math.floor(vh - verticalPaddingAndUI), 800));
      const width = Math.max(280, maxW - horizontalPadding);
      const height = maxH;
      setPortraitSize({ width, height });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isMobile, orientation]);
  
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
        (progress) => setUploadProgress(progress),
        signatureName
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

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o); }}
      avoidTabs
      closeOnOverlayClick
      closeOnEsc
      ariaLabel={title}
      className={
        isMobile
          ? 'w-full h-full max-w-none max-h-none'
          : 'w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl max-h-[70vh] flex flex-col overflow-hidden'
      }
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b ${
        isMobile ? 'p-2' : 'p-6 pb-4'
      }`}>
        <h2 className={`font-semibold ${
          isMobile ? 'text-base' : 'text-lg'
        } text-gray-900`}>
          {isMobile ? 'Assinatura Digital' : title}
        </h2>
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  if (orientation === 'default') {
                    // Tenta entrar em fullscreen + bloquear em retrato
                    const el: any = document.documentElement;
                    if (el.requestFullscreen) await el.requestFullscreen();
                    // @ts-ignore
                    if (screen.orientation && screen.orientation.lock) {
                      // @ts-ignore
                      await screen.orientation.lock('portrait');
                    }
                    setOrientation('portrait');
                  } else {
                    // Desbloqueia e sai do fullscreen
                    // @ts-ignore
                    if (screen.orientation && (screen.orientation as any).unlock) {
                      // @ts-ignore
                      (screen.orientation as any).unlock();
                    }
                    if (document.fullscreenElement) {
                      await document.exitFullscreen?.();
                    }
                    setOrientation('default');
                  }
                } catch {
                  // Fallback: apenas alterna o estado para ajustar layout
                  setOrientation(prev => prev === 'default' ? 'portrait' : 'default');
                }
              }}
              className={isMobile ? 'h-8 px-2 text-xs' : 'h-8 px-3 text-xs'}
            >
              {orientation === 'default' ? 'Vertical' : 'Horizontal'}
            </Button>
          )}
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
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
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

        {/* Nome da assinatura */}
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da assinatura (opcional)</label>
          <input
            type="text"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Ex.: Minha Assinatura, Assinatura Padrão"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">Se preenchido, será usado como nome do arquivo.</p>
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
              width={isMobile ? (orientation === 'portrait' ? portraitSize.width : 350) : width}
              height={isMobile ? (orientation === 'portrait' ? portraitSize.height : 200) : height}
              disabled={disabled || isSaving}
              onStrokeComplete={handleStrokeComplete}
              canvas={canvas}
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
    </Modal>
  );
};

export default SignatureCanvasModal;