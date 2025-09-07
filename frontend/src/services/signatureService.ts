// Autor: David Assef
// Data: 06-09-2025
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

    // Salvar metadados no banco (usar colunas existentes: owner_id, file_name, file_path, file_size, mime_type)
    const { data: signature, error: dbError } = await supabase
      .from('rf_signatures')
      .insert({
        owner_id: user.id,
        file_name: baseName,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type
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

    // Buscar no schema atual rf_signatures
    const { data: rfRows, error: rfErr } = await supabase
      .from('rf_signatures')
      .select('id, file_name, file_path, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (rfErr) throw new Error(`Erro ao buscar assinaturas: ${rfErr.message}`);

    // Buscar no schema legado signatures (se existir)
    const { data: legacyRows, error: legacyErr } = await supabase
      .from('signatures')
      .select('id, file_name, file_path, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    // Ignora erro do legado se tabela não existir; só considera quando vier dados

    // Mesclar por file_path para evitar duplicatas
    const byPath = new Map<string, any>();
    (rfRows || []).forEach((r: any) => byPath.set(r.file_path, { ...r }));
    (legacyRows || []).forEach((r: any) => {
      if (!byPath.has(r.file_path)) byPath.set(r.file_path, { ...r });
    });

    const merged = Array.from(byPath.values());

    // Gerar URLs assinadas e mapear para SignatureGalleryItem
    const signatureItems: SignatureGalleryItem[] = await Promise.all(
      merged.map(async (signature: any) => {
        let publicUrl = '';
        try {
          const { data: signed } = await supabase.storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(signature.file_path, 60 * 60);
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

        const baseFromPath = signature.file_path.split('/').pop()?.replace(/\.[^/.]+$/, '');
        const displayName = signature.file_name || baseFromPath || 'Assinatura';

        return {
          id: signature.id,
          name: displayName,
          display_name: displayName,
          thumbnail_url: publicUrl,
          is_default: false,
          created_at: signature.created_at,
          file_size: undefined,
          file_type: undefined
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
      .select('id, file_name, file_path, created_at')
      .eq('id', id)
      .eq('owner_id', user.id)
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
      name: signature.file_name || signature.file_path.split('/').pop() || 'Assinatura',
      url,
      is_default: false,
      file_size: 0,
      created_at: signature.created_at
    };
  }

  /**
   * Obtém uma assinatura pelo caminho do arquivo (file_path) do bucket
   * Útil para resolver a assinatura padrão guardada no user_metadata
   */
  static async getSignatureByPath(file_path: string): Promise<SignaturePreview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('id, file_name, file_path, created_at')
      .eq('owner_id', user.id)
      .eq('file_path', file_path)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar assinatura por caminho: ${error.message}`);
    }

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
      name: signature.file_name || signature.file_path.split('/').pop() || 'Assinatura',
      url,
      is_default: false,
      file_size: 0,
      created_at: signature.created_at
    };
  }

  /**
   * Define uma assinatura como padrão
   */
  static async setDefaultSignature(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    // Define assinatura padrão atualizando user_metadata.default_signature_path
    const { data: sig, error: fetchErr } = await supabase
      .from('rf_signatures')
      .select('file_path')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();
    if (fetchErr || !sig) throw new Error('Assinatura não encontrada');
    const { error } = await supabase.auth.updateUser({ data: { default_signature_path: sig.file_path } });
    if (error) throw new Error(`Erro ao definir assinatura padrão: ${error.message}`);
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
    // Agora o padrão é armazenado no user_metadata. Limpa o campo.
    await supabase.auth.updateUser({ data: { default_signature_path: null } });
  }

  /**
   * Atualiza o nome de uma assinatura
   */
  static async updateSignatureName(id: string, name: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('rf_signatures')
      .update({ file_name: name })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      throw new Error(`Erro ao atualizar nome da assinatura: ${error.message}`);
    }
  }
}

// Adapter simples esperado por certos componentes (ex.: ReceiptForm)
// Fornece listagem como array de Signature (tipagem de frontend)
export const signatureService = {
  async listSignatures(): Promise<import('../types/signatures').Signature[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase
      .from('rf_signatures')
      .select('id, file_name, file_path, file_size, mime_type, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Erro ao carregar assinaturas: ${error.message}`);
    return (data || []).map((s: any) => ({
      id: s.id,
      user_id: user.id,
      name: s.file_name || (s.file_path?.split('/').pop() || 'Assinatura'),
      file_path: s.file_path,
      file_size: s.file_size || 0,
      mime_type: s.mime_type || 'image/png',
      is_default: false,
      created_at: s.created_at,
      updated_at: s.created_at
    }));
  }
};