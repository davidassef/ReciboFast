// MIT License
// Autor: David Assef
// Descrição: Modal genérico para exibir conteúdos legais (Termos de Uso e Política de Privacidade)
// Data: 08-09-2025

import React from 'react';
import { X } from 'lucide-react';
import Modal from './ui/Modal';

interface LegalModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, title, onClose, children }) => {
  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      avoidTabs
      closeOnOverlayClick
      closeOnEsc
      ariaLabel={title}
      className="w-full max-w-3xl rounded-2xl"
    >
      <div className="w-full bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">{title}</h2>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto prose prose-neutral">
          {children}
        </div>
        <div className="px-6 py-3 border-t text-right">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LegalModal;
