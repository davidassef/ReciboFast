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

    // Tentar inserir na tabela legada 'signatures' (mais permissiva com RLS)
    let savedSignature: any | null = null;
    let firstError: any = null;

    // Obter dimensões da imagem
    let widthPx = 0, heightPx = 0;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Imagem inválida'));
        image.src = URL.createObjectURL(file);
      });
      widthPx = img.width; heightPx = img.height;
    } catch {}

    try {
      const { data: sigLegacy, error: errLegacy } = await supabase
        .from('signatures')
        .insert({
          user_id: user.id,
          file_name: originalName,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          width: widthPx || null,
          height: heightPx || null,
          is_active: true
        })
        .select()
        .single();
      if (errLegacy) throw errLegacy;
      savedSignature = sigLegacy;

      // Garantir que exista o registro correspondente em rf_signatures para alimentar dropdowns
      try {
        const { data: existingRf } = await supabase
          .from('rf_signatures')
          .select('id')
          .eq('owner_id', user.id)
          .eq('file_path', uploadData.path)
          .maybeSingle();
        if (!existingRf?.id) {
          await supabase
            .from('rf_signatures')
            .insert({ owner_id: user.id, file_path: uploadData.path })
            .select('id')
            .single();
        }
      } catch {}
    } catch (e) {
      firstError = e;
      // Fallback: inserir registro mínimo em rf_signatures
      const { data: sigRf, error: errRf } = await supabase
        .from('rf_signatures')
        .insert({ owner_id: user.id, file_path: uploadData.path })
        .select()
        .single();
      if (errRf) {
        // Remover arquivo do storage se falhou em ambas as inserções
        await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
        throw new Error(`Erro ao salvar assinatura: ${(firstError?.message || '')} ${errRf.message}`.trim());
      }
      savedSignature = sigRf;
      // Atualizações opcionais e tolerantes em rf_signatures
      try {
        await supabase
          .from('rf_signatures')
          .update({ file_size: file.size, mime_type: file.type === 'image/png' ? 'image/png' : null, width_px: widthPx || null, height_px: heightPx || null })
          .eq('id', sigRf.id)
          .eq('owner_id', user.id);
      } catch {}
    }

    // Atualizar nome amigável quando disponível (ambas as tabelas)
    if (isForm && (signatureData as SignatureUpload).name) {
      try {
        // Tenta legacy
        await supabase
          .from('signatures')
          .update({ file_name: (signatureData as SignatureUpload).name })
          .eq('file_path', uploadData.path)
          .eq('user_id', user.id);
      } catch {}
      try {
        await this.updateSignatureName(savedSignature.id, (signatureData as SignatureUpload).name);
      } catch {}
    }

    return savedSignature as Signature;
  }

  /**
   * Lista todas as assinaturas do usuário
   */
  static async getUserSignatures(): Promise<SignatureGalleryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar no schema atual rf_signatures usando colunas mínimas (evita 400 se file_name não existir)
    let rfRows: any[] = [];
    try {
      const resp = await supabase
        .from('rf_signatures')
        .select('id, file_path, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (!resp.error && Array.isArray(resp.data)) rfRows = resp.data as any[];
    } catch {}

    // Usar apenas rf_signatures para alimentar dropdowns
    const merged = Array.from((rfRows || []));

    // Para cada item, garantir que o id referencie rf_signatures (criando registro mínimo se necessário)
    const resolved = await Promise.all(
      merged
        // Garantir que pertence ao owner atual e não é logo (branding), e somente PNG
        .filter((sig: any) => {
          if (typeof sig.file_path !== 'string') return false;
          const p = sig.file_path as string;
          // Deve começar com `${user.id}/`
          if (!p.startsWith(`${user.id}/`)) return false;
          // Excluir logos
          if (p.includes('/branding/')) return false;
          // Somente PNG
          return p.toLowerCase().endsWith('.png');
        })
        .map(async (sig: any) => {
        // Dados base vindos do próprio rf_signatures
        const rfId: string = sig.id;
        const createdAt: string | null = sig.created_at || null;

        // URL assinada/pública para preview (pular se nenhuma disponível)
        let previewUrl: string | null = null;
        try {
          const signed = await supabase.storage.from(this.BUCKET_NAME).createSignedUrl(sig.file_path, 60 * 10);
          previewUrl = signed.data?.signedUrl || null;
        } catch {}
        if (!previewUrl) {
          const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(sig.file_path);
          previewUrl = urlData.publicUrl || null;
        }
        if (!previewUrl) {
          return null; // Ignora itens sem URL válida
        }

        const fileNameWithExt = (sig.file_path as string).split('/').pop() || 'assinatura.png';
        const displayName = fileNameWithExt;

        return {
          id: rfId,
          name: displayName,
          display_name: displayName,
          thumbnail_url: previewUrl,
          is_default: false,
          created_at: createdAt || new Date().toISOString(),
          file_size: undefined,
          file_type: undefined
        } as SignatureGalleryItem;
      })
    );

    // Filtrar nulos (itens ignorados por falta de URL)
    return (resolved.filter(Boolean) as SignatureGalleryItem[]);
  }

  /**
   * Obtém uma assinatura específica com URL
   */
  static async getSignatureById(id: string): Promise<SignaturePreview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Selecionar colunas mínimas (evita 400 caso file_name não exista)
    const { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('id, file_path, created_at')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

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

    // Buscar por file_path com colunas mínimas
    const { data: signature, error } = await supabase
      .from('rf_signatures')
      .select('id, file_path, created_at')
      .eq('owner_id', user.id)
      .eq('file_path', file_path)
      .single();

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