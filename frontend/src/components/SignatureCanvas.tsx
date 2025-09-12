import React, { useCallback, useEffect } from 'react';
import { useSignatureCanvas, UseSignatureCanvasOptions } from '../hooks/useSignatureCanvas';
import type { UseSignatureCanvasReturn } from '../hooks/useSignatureCanvas';
import { Point } from '../types/signature';
import { cn } from '../lib/utils';

export interface SignatureCanvasProps extends UseSignatureCanvasOptions {
  className?: string;
  disabled?: boolean;
  onSignatureChange?: (isEmpty: boolean) => void;
  onStrokeComplete?: () => void;
  canvas?: UseSignatureCanvasReturn; // instância externa opcional
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  className,
  disabled = false,
  onSignatureChange,
  onStrokeComplete,
  canvas: externalCanvas,
  ...canvasOptions
}) => {
  const internal = useSignatureCanvas(canvasOptions);
  const canvasApi = externalCanvas ?? internal;
  const {
    canvasRef,
    isDrawing,
    isEmpty,
    startDrawing,
    draw,
    stopDrawing
  } = canvasApi;

  // Detectar se é dispositivo móvel
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Notify parent when signature changes
  useEffect(() => {
    onSignatureChange?.(isEmpty);
  }, [isEmpty, onSignatureChange]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const point: Point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };

    startDrawing(point);
  }, [disabled, startDrawing, canvasRef]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawing) return;
    
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const point: Point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };

    draw(point);
  }, [disabled, isDrawing, draw, canvasRef]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    event.preventDefault();
    stopDrawing();
    onStrokeComplete?.();
  }, [disabled, stopDrawing, onStrokeComplete]);

  // Touch event handlers (otimizados para mobile)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (ev: TouchEvent) => {
      if (disabled) return;
      if (ev.cancelable) ev.preventDefault();
      document.body.style.overflow = 'hidden';
      const touch = ev.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const point: Point = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        timestamp: Date.now()
      };
      startDrawing(point);
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (disabled || !isDrawing) return;
      if (ev.cancelable) ev.preventDefault();
      const touch = ev.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const point: Point = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        timestamp: Date.now()
      };
      draw(point);
    };

    const onTouchEnd = (ev: TouchEvent) => {
      if (disabled) return;
      if (ev.cancelable) ev.preventDefault();
      document.body.style.overflow = '';
      stopDrawing();
      onStrokeComplete?.();
    };

    // Bind com passive:false para permitir preventDefault sem warnings
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart as EventListener);
      canvas.removeEventListener('touchmove', onTouchMove as EventListener);
      canvas.removeEventListener('touchend', onTouchEnd as EventListener);
      canvas.removeEventListener('touchcancel', onTouchEnd as EventListener);
      document.body.style.overflow = '';
    };
  }, [canvasRef, disabled, isDrawing, startDrawing, draw, stopDrawing, onStrokeComplete]);

  // Prevent context menu on right click
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          'border border-gray-300 rounded-lg touch-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
          'w-full h-full',
          isMobile ? 'cursor-default' : 'cursor-crosshair'
        )}
        style={{
          // Otimizações para mobile
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          ...(isMobile && {
            maxWidth: '100%',
            height: 'auto',
            aspectRatio: '2/1'
          })
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing when mouse leaves canvas
        onContextMenu={handleContextMenu}
        tabIndex={disabled ? -1 : 0}
        aria-label="Área de assinatura digital"
        role="img"
      />
      
      {/* Empty state overlay */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-center">
            <div className={`font-medium mb-1 ${
              isMobile ? 'text-base' : 'text-lg'
            }`}>
              {isMobile ? 'Toque para assinar' : 'Assine aqui'}
            </div>
            <div className="text-sm">
              {isMobile ? 'Use o dedo na tela' : 'Use o mouse ou toque na tela'}
            </div>
          </div>
        </div>
      )}
      
      {/* Drawing indicator */}
      {isDrawing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
          {isMobile ? 'Assinando...' : 'Desenhando...'}
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;