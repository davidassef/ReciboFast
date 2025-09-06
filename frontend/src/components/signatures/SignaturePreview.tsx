// Autor: David Assef
// Data: 20-01-2025
// Descrição: Componente para preview detalhado de assinaturas
// MIT License

import React, { useState } from 'react';
import { X, Download, Star, Edit3, Trash2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import type { SignaturePreview as SignaturePreviewType } from '../../types/signatures';

interface SignaturePreviewProps {
  signature: SignaturePreviewType;
  isOpen: boolean;
  onClose: () => void;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  className?: string;
}

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  signature,
  isOpen,
  onClose,
  onSetDefault,
  onDelete,
  onRename,
  className = ''
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(signature.name);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = signature.url;
    link.download = `${signature.name}.${signature.file_type.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetDefault = async () => {
    if (signature.is_default || !onSetDefault) return;
    
    setLoading(true);
    try {
      await onSetDefault(signature.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a assinatura "${signature.name}"?`
    );
    
    if (confirmed) {
      setLoading(true);
      try {
        await onDelete(signature.id);
        onClose();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRename = async () => {
    if (!onRename || !editName.trim() || editName.trim() === signature.name) {
      setIsEditing(false);
      setEditName(signature.name);
      return;
    }

    setLoading(true);
    try {
      await onRename(signature.id, editName.trim());
      setIsEditing(false);
    } catch (error) {
      setEditName(signature.name);
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {signature.is_default && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                <Star className="w-3 h-3 fill-current" />
                Padrão
              </div>
            )}
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditName(signature.name);
                    }
                  }}
                  autoFocus
                  disabled={loading}
                />
                <button
                  onClick={handleRename}
                  disabled={loading}
                  className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(signature.name);
                  }}
                  disabled={loading}
                  className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">
                {signature.name}
              </h2>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {/* Controles de Zoom */}
            <div className="flex items-center gap-1 border border-gray-300 rounded">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 text-sm font-mono min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotação */}
            <button
              onClick={handleRotate}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100"
              title="Rotacionar"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={resetView}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Resetar
            </button>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>
            
            {onRename && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading || isEditing}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <Edit3 className="w-4 h-4" />
                Renomear
              </button>
            )}
            
            {onSetDefault && !signature.is_default && (
              <button
                onClick={handleSetDefault}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-yellow-300 text-yellow-700 rounded hover:bg-yellow-50 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Definir Padrão
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            )}
          </div>
        </div>

        {/* Área de Visualização */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="flex items-center justify-center min-h-full">
            <div 
              className="bg-white shadow-lg rounded-lg p-4 max-w-full max-h-full overflow-auto"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <img
                src={signature.url}
                alt={signature.name}
                className="max-w-full max-h-full object-contain"
                style={{ maxWidth: '800px', maxHeight: '600px' }}
              />
            </div>
          </div>
        </div>

        {/* Footer com Informações */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Tamanho:</span>
              <br />
              {(signature.file_size / 1024).toFixed(1)} KB
            </div>
            <div>
              <span className="font-medium">Formato:</span>
              <br />
              {signature.file_type.split('/')[1].toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Dimensões:</span>
              <br />
              {signature.width} × {signature.height}px
            </div>
            <div>
              <span className="font-medium">Criado em:</span>
              <br />
              {new Date(signature.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};