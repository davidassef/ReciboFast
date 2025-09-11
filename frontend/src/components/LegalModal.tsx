// MIT License
// Autor: David Assef
// Descrição: Modal genérico para exibir conteúdos legais (Termos de Uso e Política de Privacidade)
// Data: 08-09-2025

import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
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
    </div>
  );
};

export default LegalModal;
