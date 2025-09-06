import React from 'react';
import { Undo2, Redo2, Trash2, Palette } from 'lucide-react';
import { UseSignatureCanvasReturn } from '../hooks/useSignatureCanvas';
import { CANVAS_CONFIG } from '../types/signature';
import { cn } from '../lib/utils';

export interface SignatureCanvasControlsProps {
  canvas: UseSignatureCanvasReturn;
  className?: string;
  showColorPicker?: boolean;
  showStrokeWidth?: boolean;
  showUndoRedo?: boolean;
  showClear?: boolean;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#1f2937', // Gray-800
  '#3b82f6', // Blue-500
  '#ef4444', // Red-500
  '#10b981', // Green-500
  '#f59e0b', // Yellow-500
  '#8b5cf6', // Purple-500
  '#ec4899', // Pink-500
];

export const SignatureCanvasControls: React.FC<SignatureCanvasControlsProps> = ({
  canvas,
  className,
  showColorPicker = true,
  showStrokeWidth = true,
  showUndoRedo = true,
  showClear = true,
  disabled = false
}) => {
  const {
    config,
    canUndo,
    canRedo,
    isEmpty,
    undo,
    redo,
    clear,
    setStrokeWidth,
    setStrokeColor
  } = canvas;

  return (
    <div className={cn('flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg', className)}>
      {/* Stroke Width Control */}
      {showStrokeWidth && (
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Espessura:
          </label>
          <div className="flex items-center gap-2 min-w-[120px]">
            <input
              type="range"
              value={config.strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              min={CANVAS_CONFIG.minStrokeWidth}
              max={CANVAS_CONFIG.maxStrokeWidth}
              step={1}
              disabled={disabled}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-600 w-6 text-center">
              {config.strokeWidth}
            </span>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {showColorPicker && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Cor:
          </label>
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                  config.strokeColor === color
                    ? 'border-gray-900 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
                disabled={disabled}
                aria-label={`Selecionar cor ${color}`}
              />
            ))}
            
            {/* Custom Color Input */}
            <div className="relative">
              <input
                type="color"
                value={config.strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                disabled={disabled}
                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer opacity-0 absolute inset-0"
                aria-label="Seletor de cor personalizada"
              />
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white pointer-events-none">
                <Palette className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo/Redo Controls */}
      {showUndoRedo && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={disabled || !canUndo}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Desfazer último traço"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>
          
          <button
            type="button"
            onClick={redo}
            disabled={disabled || !canRedo}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Refazer último traço"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Refazer</span>
          </button>
        </div>
      )}

      {/* Clear Control */}
      {showClear && (
        <button
          type="button"
          onClick={clear}
          disabled={disabled || isEmpty}
          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          aria-label="Limpar assinatura"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      )}

      {/* Stroke Preview */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600">Preview:</span>
        <div className="relative">
          <div
            className="rounded-full"
            style={{
              width: `${Math.max(config.strokeWidth * 2, 8)}px`,
              height: `${Math.max(config.strokeWidth * 2, 8)}px`,
              backgroundColor: config.strokeColor,
              border: config.strokeColor === '#ffffff' ? '1px solid #e5e7eb' : 'none'
            }}
            aria-label={`Preview da cor ${config.strokeColor} com espessura ${config.strokeWidth}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvasControls;