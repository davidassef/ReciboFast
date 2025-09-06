// Autor: David Assef
// Data: 05-09-2025
// Descrição: Componente de galeria para visualizar e gerenciar assinaturas
// MIT License

import React, { useState, useEffect } from 'react';
import { Star, Trash2, Edit3, Download, Eye, MoreVertical } from 'lucide-react';
import { SignatureService } from '../../services/signatureService';
import type { SignatureGalleryItem } from '../../types/signatures';

interface SignatureGalleryProps {
  onSignatureSelect?: (signature: SignatureGalleryItem) => void;
  onSignatureDelete?: (signatureId: string) => void;
  onSignatureUpdate?: (signature: SignatureGalleryItem) => void;
  selectable?: boolean;
  selectedId?: string;
  className?: string;
}

export const SignatureGallery: React.FC<SignatureGalleryProps> = ({
  onSignatureSelect,
  onSignatureDelete,
  onSignatureUpdate,
  selectable = false,
  selectedId,
  className = ''
}) => {
  const [signatures, setSignatures] = useState<SignatureGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SignatureService.getUserSignatures();
      setSignatures(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar assinaturas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await SignatureService.setDefaultSignature(id);
      await loadSignatures(); // Recarregar para atualizar o status
      setActionMenuId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao definir assinatura padrão';
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta assinatura?')) {
      return;
    }

    try {
      setDeletingId(id);
      await SignatureService.deleteSignature(id);
      await loadSignatures();
      onSignatureDelete?.(id);
      setActionMenuId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir assinatura';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (signature: SignatureGalleryItem) => {
    setEditingId(signature.id);
    setEditingName(signature.name);
    setActionMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      await SignatureService.updateSignatureName(editingId, editingName.trim());
      await loadSignatures();
      const updatedSignature = signatures.find(s => s.id === editingId);
      if (updatedSignature) {
        onSignatureUpdate?.({ ...updatedSignature, name: editingName.trim() });
      }
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar nome';
      setError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDownload = (signature: SignatureGalleryItem) => {
    const link = document.createElement('a');
    link.href = signature.thumbnail_url;
    const extFromType = signature.file_type ? signature.file_type.split('/')[1] : undefined;
    const extFromUrl = signature.thumbnail_url.split('?')[0].split('.').pop();
    const ext = extFromType || extFromUrl || 'png';
    link.download = `${signature.name}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionMenuId(null);
  };

  const handlePreview = (signature: SignatureGalleryItem) => {
    window.open(signature.thumbnail_url, '_blank');
    setActionMenuId(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Carregando assinaturas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadSignatures}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (signatures.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <Edit3 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Nenhuma assinatura encontrada
        </h3>
        <p className="text-gray-500">
          Faça upload da sua primeira assinatura para começar
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {signatures.map((signature) => (
          <div
            key={signature.id}
            className={`
              relative group border rounded-lg p-4 transition-all hover:shadow-md
              ${selectable ? 'cursor-pointer hover:border-blue-400' : ''}
              ${selectedId === signature.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              ${signature.is_default ? 'ring-2 ring-yellow-400' : ''}
            `}
            onClick={() => selectable && onSignatureSelect?.(signature)}
          >
            {/* Badge de Padrão */}
            {signature.is_default && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Padrão
              </div>
            )}

            {/* Menu de Ações */}
            <div className="absolute top-2 right-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuId(actionMenuId === signature.id ? null : signature.id);
                }}
                className="p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown do Menu */}
              {actionMenuId === signature.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(signature);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(signature);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(signature);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Renomear
                  </button>
                  {!signature.is_default && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(signature.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Definir como Padrão
                    </button>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(signature.id);
                    }}
                    disabled={deletingId === signature.id}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    {deletingId === signature.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Excluir
                  </button>
                </div>
              )}
            </div>

            {/* Preview da Assinatura */}
            <div className="mb-3 flex flex-col items-center">
              <img
                src={signature.thumbnail_url}
                alt={signature.name}
                className="w-full h-24 object-contain border border-gray-200 rounded bg-white"
                loading="lazy"
              />
            </div>

            {/* Nome da Assinatura */}
            <div className="mb-2 text-center">
              {editingId === signature.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit();
                    }}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <h3 className="font-medium text-gray-900 truncate">
                  {signature.name}
                </h3>
              )}
            </div>

            {/* Metadados */}
            <div className="text-xs text-gray-500 space-y-1">
              {typeof signature.file_size === 'number' && (
                <p>Tamanho: {(signature.file_size / 1024).toFixed(1)} KB</p>
              )}
              <p>Criado: {new Date(signature.created_at).toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Indicador de Seleção */}
            {selectable && selectedId === signature.id && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Clique fora para fechar menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
};