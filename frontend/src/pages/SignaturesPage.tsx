/**
 * Autor: David Assef
 * Descrição: Página de gerenciamento de assinaturas do usuário
 * Licença: MIT License
 * Data: 30-08-2025
 */

import React, { useState } from 'react';
import { Pen, Trash2, Check, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSignatures } from '../hooks/useSignatures';
import { SignatureUpload } from '../components/SignatureUpload';
import { Signature } from '../types/signature';

export const SignaturesPage: React.FC = () => {
  const {
    signatures,
    activeSignature,
    isLoading,
    error,
    setActiveSignature,
    deleteSignature,
    getSignatureUrl
  } = useSignatures();

  const [showUpload, setShowUpload] = useState(false);
  const [signatureUrls, setSignatureUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  /**
   * Carrega URL de uma assinatura
   */
  const loadSignatureUrl = async (signature: Signature) => {
    if (signatureUrls[signature.id] || loadingUrls.has(signature.id)) {
      return;
    }

    setLoadingUrls(prev => new Set(prev).add(signature.id));
    
    try {
      const url = await getSignatureUrl(signature.file_path);
      if (url) {
        setSignatureUrls(prev => ({ ...prev, [signature.id]: url }));
      }
    } catch (error) {
      console.error('Erro ao carregar URL da assinatura:', error);
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(signature.id);
        return newSet;
      });
    }
  };

  /**
   * Manipula sucesso do upload
   */
  const handleUploadSuccess = (signatureId: string) => {
    setShowUpload(false);
    toast.success('Assinatura enviada com sucesso!');
  };

  /**
   * Manipula erro do upload
   */
  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  /**
   * Define assinatura como ativa
   */
  const handleSetActive = async (signatureId: string) => {
    const success = await setActiveSignature(signatureId);
    if (success) {
      toast.success('Assinatura ativa definida!');
    }
  };

  /**
   * Remove assinatura
   */
  const handleDelete = async (signatureId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta assinatura?')) {
      const success = await deleteSignature(signatureId);
      if (success) {
        // Remover URL do cache
        setSignatureUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[signatureId];
          return newUrls;
        });
      }
    }
  };

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formata data
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Minhas Assinaturas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas assinaturas digitais para usar nos recibos
          </p>
        </div>
        
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Assinatura</span>
        </button>
      </div>

      {/* Área de upload */}
      {showUpload && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Enviar Nova Assinatura
          </h2>
          <SignatureUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {/* Lista de assinaturas */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Assinaturas Salvas ({signatures.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 mt-2">Carregando assinaturas...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : signatures.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Você ainda não possui assinaturas salvas
            </p>
            <p className="text-sm text-gray-500">
              Clique em "Nova Assinatura" para adicionar sua primeira assinatura
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {signatures.map((signature) => {
              const isActive = signature.is_active;
              const url = signatureUrls[signature.id];
              const isLoadingUrl = loadingUrls.has(signature.id);

              // Carregar URL se ainda não foi carregada
              if (!url && !isLoadingUrl) {
                loadSignatureUrl(signature);
              }

              return (
                <div
                  key={signature.id}
                  className={`p-6 ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4">
                      {/* Preview da assinatura */}
                      <div className="flex-shrink-0">
                        {url ? (
                          <img
                            src={url}
                            alt={`Assinatura ${signature.file_name}`}
                            className="w-24 h-12 object-contain border border-gray-200 rounded bg-white"
                          />
                        ) : isLoadingUrl ? (
                          <div className="w-24 h-12 border border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="w-24 h-12 border border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações da assinatura */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {signature.file_name}
                          </h3>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <Check className="w-3 h-3 mr-1" />
                              Ativa
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Dimensões:</span> {signature.width}x{signature.height}px
                          </div>
                          <div>
                            <span className="font-medium">Tamanho:</span> {formatFileSize(signature.file_size)}
                          </div>
                          <div>
                            <span className="font-medium">Criada em:</span> {formatDate(signature.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Tipo:</span> {signature.mime_type}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center space-x-2">
                      {!isActive && (
                        <button
                          onClick={() => handleSetActive(signature.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Definir como ativa"
                        >
                          <Pen className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(signature.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover assinatura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturesPage;