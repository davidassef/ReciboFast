/**
 * Autor: David Assef
 * Descrição: Hook personalizado para gerenciar estado das assinaturas
 * Licença: MIT License
 * Data: 30-08-2025
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { signaturesService } from '../services/signaturesService';
import {
  Signature,
  SignatureState,
  SignatureUploadResponse,
  UploadStatus
} from '../types/signature';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar assinaturas do usuário
 */
export const useSignatures = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SignatureState>({
    signatures: [],
    activeSignature: null,
    isLoading: false,
    error: null,
    uploadProgress: 0
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadStatus.IDLE);

  /**
   * Carrega assinaturas do usuário
   */
  const loadSignatures = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const signatures = await signaturesService.getUserSignatures(user.id);
      const activeSignature = signatures.find(sig => sig.is_active) || null;

      setState(prev => ({
        ...prev,
        signatures,
        activeSignature,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar assinaturas';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(errorMessage);
    }
  }, [user?.id]);

  /**
   * Faz upload de uma nova assinatura
   */
  const uploadSignature = useCallback(async (file: File): Promise<SignatureUploadResponse> => {
    if (!user?.id) {
      const response: SignatureUploadResponse = {
        success: false,
        message: 'Usuário não autenticado',
        errors: ['Usuário não autenticado']
      };
      return response;
    }

    setUploadStatus(UploadStatus.UPLOADING);
    setState(prev => ({ ...prev, uploadProgress: 0, error: null }));

    try {
      const response = await signaturesService.uploadSignature(
        file,
        user.id,
        (progress) => {
          setState(prev => ({ ...prev, uploadProgress: progress }));
        }
      );

      if (response.success) {
        setUploadStatus(UploadStatus.SUCCESS);
        toast.success('Assinatura enviada com sucesso!');
        
        // Recarregar lista de assinaturas
        await loadSignatures();
      } else {
        setUploadStatus(UploadStatus.ERROR);
        setState(prev => ({ ...prev, error: response.message }));
        toast.error(response.message);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      setUploadStatus(UploadStatus.ERROR);
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
  }, [user?.id, loadSignatures]);

  /**
   * Define uma assinatura como ativa
   */
  const setActiveSignature = useCallback(async (signatureId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await signaturesService.setActiveSignature(signatureId, user.id);
      
      if (success) {
        toast.success('Assinatura ativa definida com sucesso!');
        await loadSignatures();
        return true;
      } else {
        toast.error('Erro ao definir assinatura ativa');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao definir assinatura ativa';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id, loadSignatures]);

  /**
   * Remove uma assinatura
   */
  const deleteSignature = useCallback(async (signatureId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await signaturesService.deleteSignature(signatureId, user.id);
      
      if (success) {
        toast.success('Assinatura removida com sucesso!');
        await loadSignatures();
        return true;
      } else {
        toast.error('Erro ao remover assinatura');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover assinatura';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id, loadSignatures]);

  /**
   * Obtém URL de uma assinatura
   */
  const getSignatureUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      return await signaturesService.getSignatureUrl(filePath);
    } catch (error) {
      console.error('Erro ao obter URL da assinatura:', error);
      return null;
    }
  }, []);

  /**
   * Reseta o status de upload
   */
  const resetUploadStatus = useCallback(() => {
    setUploadStatus(UploadStatus.IDLE);
    setState(prev => ({ ...prev, uploadProgress: 0, error: null }));
  }, []);

  /**
   * Valida arquivo de assinatura
   */
  const validateSignatureFile = useCallback((file: File) => {
    return signaturesService.validateSignatureFile(file);
  }, []);

  /**
   * Valida dimensões da imagem
   */
  const validateImageDimensions = useCallback(async (file: File) => {
    return await signaturesService.validateImageDimensions(file);
  }, []);

  // Carregar assinaturas quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadSignatures();
    }
  }, [user?.id, loadSignatures]);

  return {
    // Estado
    signatures: state.signatures,
    activeSignature: state.activeSignature,
    isLoading: state.isLoading,
    error: state.error,
    uploadProgress: state.uploadProgress,
    uploadStatus,
    
    // Ações
    loadSignatures,
    uploadSignature,
    setActiveSignature,
    deleteSignature,
    getSignatureUrl,
    resetUploadStatus,
    validateSignatureFile,
    validateImageDimensions
  };
};

export default useSignatures;