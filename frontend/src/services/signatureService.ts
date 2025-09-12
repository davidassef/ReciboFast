// Autor: David Assef
// Data: 11-09-2025
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
    const isForm = !(signatureData instanceof File);
    const file: File = isForm ? (signatureData as SignatureUpload).file : (signatureData as File);
    const isDefault: boolean = isForm ? !!(signatureData as SignatureUpload).is_default : false;

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

    // Inserção mínima (compatível com esquemas sem colunas adicionais)
    const { data: signature, error: dbError } = await supabase
      .from('rf_signatures')
      .insert({
        owner_id: user.id,
        file_path: uploadData.path
      })
      .select()
      .single();

    if (dbError) {
      // Remover arquivo do storage se falhou no banco
      await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
      throw new Error(`Erro ao salvar assinatura: ${dbError.message}`);
    }

    // Atualizações opcionais e tolerantes a coluna inexistente
    try {
      // file_size e mime_type (se existirem)
      await supabase
        .from('rf_signatures')
        .update({
          file_size: file.size,
          mime_type: file.type === 'image/png' ? 'image/png' : null
        })
        .eq('id', signature.id)
        .eq('owner_id', user.id);
    } catch {}

    // Se um nome amigável foi fornecido, tenta atualizar (ignora se coluna não existir)
    if (isForm && (signatureData as SignatureUpload).name) {
      try {
        await this.updateSignatureName(signature.id, (signatureData as SignatureUpload).name);
      } catch {
        // Ignora falha de coluna inexistente
      }
    }

    return signature;
  }

  /**
   * Lista todas as assinaturas do usuário
   */
  static async getUserSignatures(): Promise<SignatureGalleryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar no schema atual rf_signatures tentando incluir file_name; fallback sem a coluna
    let rfRows: any[] = [];
    try {
      let resp = await supabase
        .from('rf_signatures')
        .select('id, file_path, file_name, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (resp.error) {
        // Fallback quando a coluna file_name não existe no ambiente
        resp = await supabase
          .from('rf_signatures')
          .select('id, file_path, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
      }
      if (!resp.error && Array.isArray(resp.data)) rfRows = resp.data as any[];
    } catch {}

    // Buscar no schema legado signatures (tolerante a ausência)
    let legacyRows: any[] = [];
    try {
      const { data } = await supabase
        .from('signatures')
        .select('id, file_name, file_path, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) legacyRows = data as any[];
    } catch {}

    // Mesclar por file_path para evitar duplicatas
    const byPath = new Map<string, any>();
    (rfRows || []).forEach((r: any) => byPath.set(r.file_path, { ...r, __source: 'rf' }));
    (legacyRows || []).forEach((r: any) => {
      if (!byPath.has(r.file_path)) byPath.set(r.file_path, { ...r, __source: 'legacy' });
    });

    const merged = Array.from(byPath.values());

    // Para cada item, garantir que o id referencie rf_signatures (criando registro mínimo se necessário)
    const resolved = await Promise.all(
      merged.map(async (sig: any) => {
        // Sempre resolver pelo rf_signatures com owner_id + file_path
        let rfId: string | null = null;
        let createdAt: string | null = sig.created_at || null;

        try {
          const { data: rf } = await supabase
            .from('rf_signatures')
            .select('id, created_at')
            .eq('owner_id', user.id)
            .eq('file_path', sig.file_path)
            .maybeSingle();
          if (rf?.id) {
            rfId = rf.id;
            createdAt = rf.created_at || createdAt;
          }
        } catch {}

        if (!rfId) {
          // Criar registro mínimo
          const { data: inserted } = await supabase
            .from('rf_signatures')
            .insert({ owner_id: user.id, file_path: sig.file_path })
            .select('id, created_at')
            .single();
          if (inserted?.id) {
            rfId = inserted.id;
            createdAt = inserted.created_at || createdAt;
          }
        }

        // URL assinada/pública para preview
        // Preferir URL pública para evitar expiração de tokens
        const { data: urlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(sig.file_path);
        const publicUrl = urlData.publicUrl;

        const fileNameWithExt = sig.file_path.split('/').pop() || 'assinatura.png';
        const displayName = (sig as any).file_name || fileNameWithExt;

        return {
          id: rfId!,
          name: displayName,
          display_name: displayName,
          thumbnail_url: publicUrl,
          is_default: false,
          created_at: createdAt || new Date().toISOString(),
          file_size: undefined,
          file_type: undefined
        } as SignatureGalleryItem;
      })
    );

    return resolved;
  }

  /**
   * Obtém uma assinatura específica com URL
   */
  static async getSignatureById(id: string): Promise<SignaturePreview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Tentar buscar também file_name; se falhar, repetir sem a coluna
    let { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('id, file_path, file_name, created_at')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();
    if (error) {
      const retry = await supabase
        .from('rf_signatures')
        .select('id, file_path, created_at')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();
      signature = retry.data as any;
      error = retry.error as any;
    }

    if (error) {
      throw new Error(`Erro ao buscar assinatura: ${error.message}`);
    }

    // Preferir URL assinada recente (reduz chance de expiração durante impressão), fallback para pública
    let url: string = '';
    try {
      const signed = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(signature.file_path, 60 * 5);
      url = signed.data?.signedUrl || '';
    } catch {}
    if (!url) {
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(signature.file_path);
      url = urlData.publicUrl;
    }

    return {
      id: signature.id,
      name: (signature as any).file_name || signature.file_path.split('/').pop() || 'Assinatura',
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

    // Buscar por file_path, tentando incluir file_name
    let { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('id, file_path, file_name, created_at')
      .eq('owner_id', user.id)
      .eq('file_path', file_path)
      .single();
    if (error) {
      const retry = await supabase
        .from('rf_signatures')
        .select('id, file_path, created_at')
        .eq('owner_id', user.id)
        .eq('file_path', file_path)
        .single();
      signature = retry.data as any;
      error = retry.error as any;
    }

    if (error) {
      throw new Error(`Erro ao buscar assinatura por caminho: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(signature.file_path);
    const url = urlData.publicUrl;

    return {
      id: signature.id,
      name: (signature as any).file_name || signature.file_path.split('/').pop() || 'Assinatura',
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
      .eq('owner_id', user.id)
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
      .eq('owner_id', user.id);

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

    // Agora o padrão é guardado no user_metadata.default_signature_path
    const defaultPath = (user.user_metadata as any)?.default_signature_path as string | undefined;
    if (!defaultPath) return null;
    try {
      return await this.getSignatureByPath(defaultPath);
    } catch {
      return null;
    }
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

    try {
      const { error } = await supabase
      .from('rf_signatures')
      .update({ file_name: name })
      .eq('id', id)
      .eq('owner_id', user.id);
      if (error) {
        // Se a coluna não existir neste ambiente, apenas ignore (compatibilidade)
        if ((error as any).message?.toLowerCase().includes('column') && (error as any).message?.toLowerCase().includes('file_name')) {
          return;
        }
        throw new Error(`Erro ao atualizar nome da assinatura: ${error.message}`);
      }
    } catch (err: any) {
      // PostgREST pode responder 400 para coluna inexistente: trate como no-op
      if (typeof err?.message === 'string' && err.message.toLowerCase().includes('column') && err.message.toLowerCase().includes('file_name')) {
        return;
      }
      throw err;
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
      // Não selecionar file_name para compatibilidade
      .select('id, file_path, file_size, mime_type, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Erro ao carregar assinaturas: ${error.message}`);
    return (data || []).map((s: any) => ({
      id: s.id,
      user_id: user.id,
      name: (s.file_path?.split('/').pop() || 'Assinatura'),
      file_path: s.file_path,
      file_size: s.file_size || 0,
      mime_type: s.mime_type || 'image/png',
      is_default: false,
      created_at: s.created_at,
      updated_at: s.created_at
    }));
  }
};