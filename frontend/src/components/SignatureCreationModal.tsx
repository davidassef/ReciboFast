import React, { useState, useEffect } from 'react';
import { X, Upload, PenTool } from 'lucide-react';
import { SignatureMethodModal } from './SignatureMethodModal';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { SignatureUpload } from './signatures/SignatureUpload';
import type { Signature } from '../types/signature';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface SignatureCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureCreated: (signature: any) => void;
  userId: string;
}

type ModalStep = 'method-selection' | 'canvas' | 'upload';

export const SignatureCreationModal: React.FC<SignatureCreationModalProps> = ({
  isOpen,
  onClose,
  onSignatureCreated,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>('method-selection');
  const [selectedMethod, setSelectedMethod] = useState<'upload' | 'canvas' | null>(null);
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

  const handleMethodSelect = (method: 'upload' | 'canvas') => {
    setSelectedMethod(method);
    if (method === 'canvas') {
      setCurrentStep('canvas');
    } else {
      setCurrentStep('upload');
    }
  };

  const handleSignatureCreated = (signature: Signature) => {
    onSignatureCreated(signature);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('method-selection');
    setSelectedMethod(null);
    onClose();
  };

  const handleBackToMethodSelection = () => {
    setCurrentStep('method-selection');
    setSelectedMethod(null);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'method-selection':
        return (
          <SignatureMethodModal
            open={true}
            onOpenChange={(open) => { if (!open) handleClose(); }}
            onMethodSelect={handleMethodSelect}
          />
        );

      case 'canvas':
        return (
          <SignatureCanvasModal
            open={true}
            onOpenChange={(open) => { if (!open) handleBackToMethodSelection(); }}
            onSave={handleSignatureCreated}
            userId={userId}
          />
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload de Assinatura</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMethodSelection}
                  className="h-8 px-2 text-xs"
                >
                  Voltar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <SignatureUpload
              onUploadSuccess={(signature: any) => {
                onSignatureCreated(signature);
                handleClose();
              }}
              onUploadError={() => {}}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      avoidTabs
      className={
        isMobile
          ? 'w-full h-full max-w-none max-h-none'
          : 'w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl max-h-[70vh] flex flex-col'
      }
    >
      {currentStep === 'method-selection' ? (
        <>
          {/* Header */}
          <div className={`flex items-center justify-between border-b ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <h2 className={`font-semibold text-gray-900 ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              Nova Assinatura
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </button>
          </div>

          {/* Content */}
          <div className={`${isMobile ? 'p-4' : 'p-6'} ${isMobile ? '' : 'flex-1 overflow-y-auto'}`}>
            <p className={`text-gray-600 mb-6 ${
              isMobile ? 'text-sm' : ''
            }`}>
              Escolha como deseja criar sua assinatura:
            </p>

            <div className="space-y-4">
              {/* Canvas Option */}
              <button
                onClick={() => handleMethodSelect('canvas')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                    <PenTool className={`${
                      isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    } text-blue-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-gray-900 mb-1 ${
                      isMobile ? 'text-base' : ''
                    }`}>
                      {isMobile ? 'Desenhar' : 'Desenhar Assinatura'}
                    </h3>
                    <p className={`text-gray-600 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {isMobile 
                        ? 'Toque na tela para desenhar'
                        : 'Use o mouse ou toque na tela para desenhar sua assinatura'
                      }
                    </p>
                  </div>
                </div>
              </button>

              {/* Upload Option */}
              <button
                onClick={() => handleMethodSelect('upload')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors flex-shrink-0">
                    <Upload className={`${
                      isMobile ? 'w-5 h-5' : 'w-6 h-6'
                    } text-green-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-gray-900 mb-1 ${
                      isMobile ? 'text-base' : ''
                    }`}>
                      {isMobile ? 'Enviar Foto' : 'Enviar Imagem'}
                    </h3>
                    <p className={`text-gray-600 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {isMobile 
                        ? 'Foto da sua assinatura'
                        : 'Faça upload de uma imagem da sua assinatura'
                      }
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
;

export default SignatureCreationModal;