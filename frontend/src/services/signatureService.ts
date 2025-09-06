// Autor: David Assef
// Data: 05-09-2025
// Descrição: Serviço para gerenciamento de assinaturas digitais
// MIT License

import { supabase } from '../lib/supabase';
import type {
  Signature,
  SignatureUpload,
  SignaturePreview,
  SignatureGalleryItem,
  SignatureValidation
} from '../types/signatures';

export class SignatureService {
  private static readonly BUCKET_NAME = 'signatures';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

  /**
   * Valida um arquivo de assinatura antes do upload
   */
  static validateSignatureFile(file: File): SignatureValidation {
    const errors: string[] = [];

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push('Tipo de arquivo não permitido. Use PNG, JPG ou JPEG.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      maxSize: this.MAX_FILE_SIZE,
      allowedTypes: this.ALLOWED_TYPES
    };
  }

  /**
   * Faz upload de uma nova assinatura
   */
  static async uploadSignature(signatureData: SignatureUpload | File): Promise<Signature> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Normalizar entrada
    const file: File = signatureData instanceof File ? signatureData : signatureData.file;
    const isDefault: boolean = signatureData instanceof File ? false : !!signatureData.is_default;

    // Validar arquivo
    const validation = this.validateSignatureFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Se esta assinatura será padrão, remover padrão das outras
    if (isDefault) {
      await this.removeDefaultSignature(user.id);
    }

    // Nome padronizado da assinatura = nome do arquivo (sem extensão)
    const originalName = file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');

    // Gerar nome único para armazenamento do arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload do arquivo para o Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Salvar metadados no banco
    const { data: signature, error: dbError } = await supabase
      .from('rf_signatures')
      .insert({
        user_id: user.id,
        name: baseName,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        is_default: isDefault || false
      })
      .select()
      .single();

    if (dbError) {
      // Remover arquivo do storage se falhou no banco
      await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
      throw new Error(`Erro ao salvar assinatura: ${dbError.message}`);
    }

    return signature;
  }

  /**
   * Lista todas as assinaturas do usuário
   */
  static async getUserSignatures(): Promise<SignatureGalleryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: signatures, error } = await supabase
      .from('rf_signatures')
      .select('id, name, file_path, is_default, created_at, file_size, mime_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar assinaturas: ${error.message}`);
    }

    // Gerar URLs de thumbnail para cada assinatura
    const signatureItems: SignatureGalleryItem[] = await Promise.all(
      signatures.map(async (signature) => {
        // Gerar URL assinada (fallback para pública)
        let publicUrl = '';
        try {
          const { data: signed } = await supabase.storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(signature.file_path, 60 * 60); // 1 hora
          publicUrl = signed?.signedUrl || '';
          if (!publicUrl) {
            const { data: urlData } = supabase.storage
              .from(this.BUCKET_NAME)
              .getPublicUrl(signature.file_path);
            publicUrl = urlData.publicUrl;
          }
        } catch {
          const { data: urlData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(signature.file_path);
          publicUrl = urlData.publicUrl;
        }

        // display_name: se nome antigo padronizado (signature_uuid_timestamp), mostrar algo mais legível
        const legacyPattern = /^signature_[a-f0-9-]+_\d+$/i;
        const baseFromPath = signature.file_path.split('/').pop()?.replace(/\.[^/.]+$/, '');
        const displayName = legacyPattern.test(signature.name) ? (baseFromPath || signature.name) : signature.name;

        return {
          id: signature.id,
          name: signature.name,
          display_name: displayName,
          thumbnail_url: publicUrl,
          is_default: signature.is_default,
          created_at: signature.created_at,
          file_size: signature.file_size,
          file_type: signature.mime_type
        };
      })
    );

    return signatureItems;
  }

  /**
   * Obtém uma assinatura específica com URL
   */
  static async getSignatureById(id: string): Promise<SignaturePreview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar assinatura: ${error.message}`);
    }

    // URL assinada para preview (fallback público)
    let url = '';
    try {
      const { data: signed } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(signature.file_path, 60 * 60);
      url = signed?.signedUrl || '';
      if (!url) {
        const { data: urlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(signature.file_path);
        url = urlData.publicUrl;
      }
    } catch {
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(signature.file_path);
      url = urlData.publicUrl;
    }

    return {
      id: signature.id,
      name: signature.name,
      url,
      is_default: signature.is_default,
      file_size: signature.file_size,
      created_at: signature.created_at
    };
  }

  /**
   * Define uma assinatura como padrão
   */
  static async setDefaultSignature(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Remover padrão de todas as assinaturas
    await this.removeDefaultSignature(user.id);

    // Definir nova assinatura padrão
    const { error } = await supabase
      .from('rf_signatures')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Erro ao definir assinatura padrão: ${error.message}`);
    }
  }

  /**
   * Remove uma assinatura
   */
  static async deleteSignature(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar dados da assinatura
    const { data: signature, error: fetchError } = await supabase
      .from('rf_signatures')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw new Error(`Erro ao buscar assinatura: ${fetchError.message}`);
    }

    // Remover arquivo do storage
    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([signature.file_path]);

    if (storageError) {
      console.warn('Erro ao remover arquivo do storage:', storageError.message);
    }

    // Remover registro do banco
    const { error: dbError } = await supabase
      .from('rf_signatures')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      throw new Error(`Erro ao deletar assinatura: ${dbError.message}`);
    }
  }

  /**
   * Obtém a assinatura padrão do usuário
   */
  static async getDefaultSignature(): Promise<SignaturePreview | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error || !signature) {
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(signature.file_path);

    return {
      id: signature.id,
      name: signature.name,
      url: urlData.publicUrl,
      is_default: signature.is_default,
      file_size: signature.file_size,
      created_at: signature.created_at
    };
  }

  /**
   * Remove o status de padrão de todas as assinaturas do usuário
   */
  private static async removeDefaultSignature(userId: string): Promise<void> {
    await supabase
      .from('rf_signatures')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  /**
   * Atualiza o nome de uma assinatura
   */
  static async updateSignatureName(id: string, name: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('rf_signatures')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Erro ao atualizar nome da assinatura: ${error.message}`);
    }
  }
}