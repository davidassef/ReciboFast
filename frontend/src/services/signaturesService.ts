/**
 * Autor: David Assef
 * Descrição: Serviço para gerenciar assinaturas com upload PNG e validação
 * Licença: MIT License
 * Data: 30-08-2025
 */

import { supabase } from '../lib/supabase';
import {
  Signature,
  SignatureUploadData,
  SignatureValidation,
  SignatureUploadResponse,
  SIGNATURE_CONFIG,
  UploadStatus
} from '../types/signature';

class SignaturesService {
  private readonly bucketName = 'signatures';

  /**
   * Valida um arquivo de assinatura
   */
  validateSignatureFile(file: File): SignatureValidation {
    const errors: string[] = [];

    // Validar tipo MIME
    if (!SIGNATURE_CONFIG.allowedMimeTypes.includes(file.type)) {
      errors.push('Apenas arquivos PNG são permitidos');
    }

    // Validar tamanho do arquivo
    if (file.size > SIGNATURE_CONFIG.maxFileSize) {
      const maxSizeMB = SIGNATURE_CONFIG.maxFileSize / (1024 * 1024);
      errors.push(`Arquivo deve ter no máximo ${maxSizeMB}MB`);
    }

    // Validar se o arquivo não está vazio
    if (file.size === 0) {
      errors.push('Arquivo não pode estar vazio');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dimensões da imagem
   */
  async validateImageDimensions(file: File): Promise<SignatureValidation> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const errors: string[] = [];
        
        if (img.width > SIGNATURE_CONFIG.maxWidth) {
          errors.push(`Largura máxima permitida: ${SIGNATURE_CONFIG.maxWidth}px`);
        }
        
        if (img.height > SIGNATURE_CONFIG.maxHeight) {
          errors.push(`Altura máxima permitida: ${SIGNATURE_CONFIG.maxHeight}px`);
        }
        
        URL.revokeObjectURL(url);
        
        resolve({
          isValid: errors.length === 0,
          errors
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          errors: ['Arquivo de imagem inválido']
        });
      };
      
      img.src = url;
    });
  }

  /**
   * Faz upload de uma assinatura para o Supabase Storage
   */
  async uploadSignature(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<SignatureUploadResponse> {
    try {
      // Validar arquivo
      const fileValidation = this.validateSignatureFile(file);
      if (!fileValidation.isValid) {
        return {
          success: false,
          message: 'Arquivo inválido',
          errors: fileValidation.errors
        };
      }

      // Validar dimensões
      const dimensionsValidation = await this.validateImageDimensions(file);
      if (!dimensionsValidation.isValid) {
        return {
          success: false,
          message: 'Dimensões da imagem inválidas',
          errors: dimensionsValidation.errors
        };
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `signature_${userId}_${timestamp}.png`;
      const filePath = `${userId}/${fileName}`;

      // Simular progresso inicial
      onProgress?.(10);

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      onProgress?.(70);

      // Obter dimensões da imagem
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imageUrl);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Erro ao obter dimensões da imagem'));
        };
        img.src = imageUrl;
      });

      // Salvar metadados no banco de dados
      const { data: signatureData, error: dbError } = await supabase
        .from('signatures')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions.width,
          height: dimensions.height,
          is_active: true
        })
        .select()
        .single();

      if (dbError) {
        // Se falhar ao salvar no banco, remover arquivo do storage
        await supabase.storage
          .from(this.bucketName)
          .remove([uploadData.path]);
        
        throw new Error(`Erro ao salvar metadados: ${dbError.message}`);
      }

      onProgress?.(100);

      return {
        success: true,
        signature: signatureData as Signature,
        message: 'Assinatura enviada com sucesso'
      };

    } catch (error) {
      console.error('Erro no upload da assinatura:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido no upload',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Lista assinaturas do usuário
   */
  async getUserSignatures(userId: string): Promise<Signature[]> {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar assinaturas: ${error.message}`);
      }

      return data as Signature[];
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      return [];
    }
  }

  /**
   * Obtém URL pública de uma assinatura
   */
  async getSignatureUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao obter URL da assinatura:', error);
      return null;
    }
  }

  /**
   * Define uma assinatura como ativa
   */
  async setActiveSignature(signatureId: string, userId: string): Promise<boolean> {
    try {
      // Primeiro, desativar todas as assinaturas do usuário
      await supabase
        .from('signatures')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Depois, ativar a assinatura selecionada
      const { error } = await supabase
        .from('signatures')
        .update({ is_active: true })
        .eq('id', signatureId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erro ao definir assinatura ativa: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao definir assinatura ativa:', error);
      return false;
    }
  }

  /**
   * Remove uma assinatura
   */
  async deleteSignature(signatureId: string, userId: string): Promise<boolean> {
    try {
      // Buscar dados da assinatura
      const { data: signature, error: fetchError } = await supabase
        .from('signatures')
        .select('file_path')
        .eq('id', signatureId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !signature) {
        throw new Error('Assinatura não encontrada');
      }

      // Remover arquivo do storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([signature.file_path]);

      if (storageError) {
        console.warn('Erro ao remover arquivo do storage:', storageError);
      }

      // Remover registro do banco
      const { error: dbError } = await supabase
        .from('signatures')
        .delete()
        .eq('id', signatureId)
        .eq('user_id', userId);

      if (dbError) {
        throw new Error(`Erro ao remover assinatura: ${dbError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao remover assinatura:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const signaturesService = new SignaturesService();
export default signaturesService;