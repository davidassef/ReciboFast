import React, { useState, useEffect } from 'react';
import { X, Upload, PenTool } from 'lucide-react';
import { SignatureMethodModal } from './SignatureMethodModal';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { SignatureUpload } from './signatures/SignatureUpload';
import type { Signature } from '../types/signature';
import { Button } from './ui/Button';
import Modal from './ui/Modal';

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
            open={isOpen}
            onOpenChange={(open) => { if (!open) handleClose(); }}
            onMethodSelect={handleMethodSelect}
          />
        );

      case 'canvas':
        return (
          <SignatureCanvasModal
            open={isOpen}
            onOpenChange={(open) => { if (!open) handleBackToMethodSelection(); }}
            onSave={handleSignatureCreated}
            userId={userId}
          />
        );

      case 'upload':
        return (
          <Modal
            open={isOpen}
            onOpenChange={(open) => { if (!open) handleBackToMethodSelection(); }}
            avoidTabs
            ariaLabel="Upload de Assinatura"
          >
            <div className="space-y-4 p-6">
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
          </Modal>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;
  return renderContent();
}
;

export default SignatureCreationModal;