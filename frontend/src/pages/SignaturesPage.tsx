/**
 * Autor: David Assef
 * Descrição: Página de gerenciamento de assinaturas do usuário
 * Licença: MIT License
 * Data: 30-08-2025
 */

import React, { useEffect, useState } from 'react';
import { Pen, Trash2, Check, Plus, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useSignatures } from '../hooks/useSignatures';
import { SignatureCreationModal } from '../components/SignatureCreationModal';
import { Signature } from '../types/signature';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const SignaturesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    signatures,
    activeSignature,
    isLoading,
    error,
    setActiveSignature,
    deleteSignature,
    getSignatureUrl,
    loadSignatures
  } = useSignatures();

  const [showCreationModal, setShowCreationModal] = useState(false);
  const [signatureUrls, setSignatureUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  // Logos
  interface LogoItem { name: string; path: string; size?: number; created_at?: string; }
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({});
  const [activeLogoPath, setActiveLogoPath] = useState<string | null>(null);
  const [isLoadingLogos, setIsLoadingLogos] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Nome amigável para exibição: para entradas antigas no formato
  // "signature_<user>_<timestamp>.png" ou "canvas_signature_<user>_<timestamp>.png"
  const getDisplayFileName = (fileName: string): string => {
    if (!fileName) return 'assinatura.png';
    const legacy = /^(canvas_)?signature_[^_]+_\d+\.(png|jpg|jpeg)$/i;
    if (legacy.test(fileName)) return 'assinatura.png';
    return fileName;
  };

  // Carregar logos do Storage
  const loadLogos = async () => {
    if (!user?.id) return;
    setIsLoadingLogos(true);
    try {
      const brandingPath = `${user.id}/branding`;
      const { data: list, error: listErr } = await supabase
        .storage
        .from('signatures')
        .list(brandingPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
      if (listErr) throw listErr;
      const items: LogoItem[] = (list || [])
        .filter((it: any) => !!it.name)
        .map((it: any) => ({ name: it.name, path: `${brandingPath}/${it.name}`, size: it.metadata?.size, created_at: it.created_at }));
      setLogos(items);

      // URLs assinadas
      const urlMap: Record<string, string> = {};
      for (const it of items) {
        const { data } = await supabase.storage.from('signatures').createSignedUrl(it.path, 60 * 60);
        if (data?.signedUrl) urlMap[it.path] = data.signedUrl;
      }
      setLogoUrls(urlMap);

      // Carrega logo ativa do metadata
      const { data: { user: fresh } } = await supabase.auth.getUser();
      const activePath = (fresh?.user_metadata as any)?.default_logo_path as string | undefined;
      setActiveLogoPath(activePath || null);
    } catch (e) {
      console.warn('Erro ao carregar logos:', e);
      toast.error('Não foi possível carregar suas logos.');
    } finally {
      setIsLoadingLogos(false);
    }
  };

  useEffect(() => {
    loadLogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Upload de nova logo
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      setIsUploadingLogo(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/branding/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('signatures').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      await loadLogos();
      // Define como ativa imediatamente
      await handleSetActiveLogo(path);
      toast.success('Logo enviada com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao enviar logo');
    } finally {
      setIsUploadingLogo(false);
      // limpa input
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleSetActiveLogo = async (path: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ data: { default_logo_path: path } });
      if (error) throw error;
      setActiveLogoPath(path);
      toast.success('Logo definida como ativa!');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível definir a logo ativa');
    }
  };

  const handleRemoveLogo = async (path: string) => {
    if (!window.confirm('Remover esta logo?')) return;
    try {
      const { error } = await supabase.storage.from('signatures').remove([path]);
      if (error) throw error;
      if (activeLogoPath === path) {
        await supabase.auth.updateUser({ data: { default_logo_path: null } });
        setActiveLogoPath(null);
      }
      await loadLogos();
      toast.success('Logo removida.');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao remover logo');
    }
  };

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
   * Manipula sucesso da criação de assinatura
   */
  const handleCreationSuccess = (signatureId: string) => {
    toast.success('Assinatura criada com sucesso!');
    setShowCreationModal(false);
  };

  /**
   * Manipula cancelamento da criação
   */
  const handleCreationCancel = () => {
    setShowCreationModal(false);
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
          onClick={() => setShowCreationModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Assinatura</span>
        </button>
      </div>
      {/* Gestão de Logos */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Logos ({logos.length})
          </h2>
          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isUploadingLogo ? 'Enviando...' : 'Nova Logo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
          </label>
        </div>

        {isLoadingLogos ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 mt-2">Carregando logos...</p>
          </div>
        ) : logos.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Você ainda não possui logos salvas</p>
            <p className="text-sm text-gray-500">Use o botão "Nova Logo" para enviar uma imagem</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logos.map((logo) => {
              const url = logoUrls[logo.path];
              const isActive = activeLogoPath === logo.path;
              return (
                <div key={logo.path} className={`p-6 ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-36 h-16 border border-gray-200 rounded bg-white flex items-center justify-center">
                        {url ? (
                          <img src={url} alt={logo.name} className="max-h-14 max-w-32 object-contain" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={logo.name}>{logo.name}</p>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Ativa
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button onClick={() => handleSetActiveLogo(logo.path)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Definir como ativa">
                          <Pen className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleRemoveLogo(logo.path)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remover logo">
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

      {/* Modal de criação de assinatura */}
      <SignatureCreationModal
        isOpen={showCreationModal}
        onClose={handleCreationCancel}
        onSignatureCreated={(signature) => { handleCreationSuccess(signature.id); loadSignatures(); }}
        userId={user?.id || ''}
      />

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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:space-x-4 gap-3 sm:gap-0">
                      {/* Preview da assinatura (topo no mobile) */}
                      <div className="flex-shrink-0">
                        {url ? (
                          <img
                            src={url}
                            alt={`Assinatura ${getDisplayFileName(signature.file_name)}`}
                            className="w-32 h-16 object-contain border border-gray-200 rounded bg-white mx-auto sm:mx-0"
                          />
                        ) : isLoadingUrl ? (
                          <div className="w-32 h-16 border border-gray-200 rounded bg-gray-50 flex items-center justify-center mx-auto sm:mx-0">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="w-32 h-16 border border-gray-200 rounded bg-gray-50 flex items-center justify-center mx-auto sm:mx-0">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações da assinatura (nome abaixo no mobile) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 justify-center sm:justify-start">
                          <h3 className="text-sm font-medium text-gray-900 truncate max-w-[240px] sm:max-w-none" title={getDisplayFileName(signature.file_name)}>
                            {getDisplayFileName(signature.file_name)}
                          </h3>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <Check className="w-3 h-3 mr-1" />
                              Ativa
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                    <div className="flex items-center justify-center sm:justify-end space-x-2">
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