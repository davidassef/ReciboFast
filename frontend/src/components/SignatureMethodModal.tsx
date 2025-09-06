import React, { useState } from 'react';
import { Upload, PenTool, X } from 'lucide-react';
import { SignatureCreationMethod } from '../types/signature';
import { cn } from '../lib/utils';

export interface SignatureMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMethodSelect: (method: 'upload' | 'canvas') => void;
  title?: string;
  description?: string;
}

const SIGNATURE_METHODS: SignatureCreationMethod[] = [
  {
    type: 'canvas',
    title: 'Desenho Digital',
    description: 'Desenhe sua assinatura diretamente na tela usando mouse ou toque',
    icon: 'pen-tool',
    available: true
  },
  {
    type: 'upload',
    title: 'Upload de Imagem',
    description: 'Faça upload de uma foto da sua assinatura em papel',
    icon: 'upload',
    available: true
  }
];

export const SignatureMethodModal: React.FC<SignatureMethodModalProps> = ({
  open,
  onOpenChange,
  onMethodSelect,
  title = 'Como você gostaria de criar sua assinatura?',
  description = 'Escolha o método que preferir para adicionar sua assinatura ao documento.'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upload' | 'canvas' | null>(null);

  const handleMethodClick = (method: 'upload' | 'canvas') => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onMethodSelect(selectedMethod);
      setSelectedMethod(null);
    }
  };

  const handleCancel = () => {
    setSelectedMethod(null);
    onOpenChange(false);
  };

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'pen-tool':
        return <PenTool className={className} />;
      case 'upload':
        return <Upload className={className} />;
      default:
        return <PenTool className={className} />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}

          <div className="grid gap-3">
            {SIGNATURE_METHODS.map((method) => (
              <button
                key={method.type}
                type="button"
                onClick={() => handleMethodClick(method.type)}
                disabled={!method.available}
                className={cn(
                  'w-full p-4 border-2 rounded-lg transition-colors text-left',
                  selectedMethod === method.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50',
                  !method.available && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    method.type === 'canvas' ? 'bg-blue-100' : 'bg-green-100'
                  )}>
                    {renderIcon(method.icon, cn(
                      'h-5 w-5',
                      method.type === 'canvas' ? 'text-blue-600' : 'text-green-600'
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{method.title}</div>
                    <div className="text-sm text-gray-500">
                      {method.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedMethod}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>

          {/* Method-specific hints */}
          {selectedMethod && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                {selectedMethod === 'canvas' && (
                  <div>
                    <strong>Dica:</strong> Use movimentos suaves e naturais. Você pode ajustar a espessura e cor do traço.
                  </div>
                )}
                {selectedMethod === 'upload' && (
                  <div>
                    <strong>Dica:</strong> Use uma imagem clara com boa iluminação. Formatos aceitos: PNG, JPG (máx. 2MB).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureMethodModal;