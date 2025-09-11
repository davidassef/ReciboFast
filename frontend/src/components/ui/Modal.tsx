// Autor: David Assef
// Data: 11-09-2025
// Descrição: Componente Modal reutilizável com suporte a overlay que não cobre o menu de tabs
// MIT License

import React, { useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string; // classes adicionais para o painel do modal
  overlayClassName?: string; // classes adicionais para o overlay
  containerClassName?: string; // classes adicionais para o wrapper externo
  avoidTabs?: boolean; // quando true, não cobre o menu de tabs inferior
  closeOnOverlayClick?: boolean; // quando true, clicar no overlay fecha
  closeOnEsc?: boolean; // quando true, tecla ESC fecha
  role?: string;
  ariaLabel?: string;
}

/**
 * Modal reutilizável com padrões de acessibilidade básicos e controle de overlay.
 * - avoidTabs: recorta a área do overlay em bottom para deixar o menu de tabs visível
 * - closeOnOverlayClick: permite fechar clicando fora do painel
 * - closeOnEsc: permite fechar com tecla ESC
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  children,
  className = '',
  overlayClassName = '',
  containerClassName = '',
  avoidTabs = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  role = 'dialog',
  ariaLabel
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (closeOnEsc && e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [open, closeOnEsc, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Evita scroll do body quando modal está aberto
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const areaClass = avoidTabs
    ? 'fixed inset-x-0 top-0 bottom-20 z-50'
    : 'fixed inset-0 z-50';

  return (
    <div className={cn(areaClass, 'flex items-center justify-center p-4', containerClassName)}>
      {/* Overlay */}
      <div
        className={cn(
          avoidTabs ? 'fixed inset-x-0 top-0 bottom-20 bg-black/50' : 'fixed inset-0 bg-black/50',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
        aria-hidden="true"
      />

      {/* Painel */}
      <div
        role={role}
        aria-label={ariaLabel}
        className={cn(
          'relative z-10 bg-white rounded-lg shadow-xl w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl max-h-[70vh] flex flex-col overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
