import React, { useState, useEffect } from 'react';
import { X, Upload, PenTool } from 'lucide-react';
import { SignatureMethodModal } from './SignatureMethodModal';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { SignatureUpload } from './SignatureUpload';
import { Signature, SignatureCreationMethod } from '../types/signature';

interface SignatureCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureCreated: (signature: Signature) => void;
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
  const [selectedMethod, setSelectedMethod] = useState<SignatureCreationMethod | null>(null);
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

  const handleMethodSelect = (method: SignatureCreationMethod) => {
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
            isOpen={true}
            onClose={handleClose}
            onMethodSelect={handleMethodSelect}
          />
        );

      case 'canvas':
        return (
          <SignatureCanvasModal
            isOpen={true}
            onClose={handleBackToMethodSelection}
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
              userId={userId}
              onUploadSuccess={handleSignatureCreated}
              onCancel={handleBackToMethodSelection}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${
        isMobile 
          ? 'w-full h-full max-w-none max-h-none' 
          : 'w-full max-w-md'
      }`}>
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
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
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
                      <PenTool className={`text-blue-600 ${
                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
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
                      <Upload className={`text-green-600 ${
                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
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
      </div>
      
      {/* Render modals outside the main modal */}
       {currentStep === 'canvas' && (
         <SignatureCanvasModal
           open={true}
           onOpenChange={(open) => !open && handleBackToMethodSelection()}
           onSignatureCreated={handleSignatureCreated}
           userId={userId}
           title="Desenhar Assinatura"
         />
       )}
       
       {currentStep === 'upload' && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${
             isMobile 
               ? 'w-full h-full max-w-none max-h-none' 
               : 'w-full max-w-2xl max-h-[90vh] overflow-y-auto'
           }`}>
             <div className="p-6">
               <SignatureUpload
                 onUploadSuccess={handleSignatureCreated}
                 onCancel={handleBackToMethodSelection}
               />
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default SignatureCreationModal;