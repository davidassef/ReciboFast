/**
 * Autor: David Assef
 * Descrição: Serviço para gerenciar assinaturas com upload PNG e validação
 * Licença: MIT License
 * Data: 05-09-2025
 */

import { supabase } from '../lib/supabase';
import {
  Signature,
  SignatureUploadData,
  SignatureValidation,
  SignatureUploadResponse,
  SIGNATURE_CONFIG,
  UploadStatus,
  SignatureCanvasData,
  SignatureCreationMethod,
  ProcessingResult,
  QualityMetrics,
  ProcessingMetadata
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

      // Nome original do arquivo para exibição
      const originalFileName = file.name || `assinatura_${Date.now()}.png`;
      // Gerar nome único para armazenamento
      const timestamp = Date.now();
      const storageFileName = `signature_${userId}_${timestamp}.png`;
      const filePath = `${userId}/${storageFileName}`;

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
          file_name: originalFileName,
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
      // Tentar URL assinada (para buckets privados)
      const { data: signed, error: signError } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, 60 * 60); // 1 hora
      if (!signError && signed?.signedUrl) {
        return signed.signedUrl;
      }

      // Fallback para URL pública
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

  /**
   * Processa dados do canvas e calcula métricas de qualidade
   */
  private processCanvasData(canvasData: SignatureCanvasData): ProcessingResult {
    const { strokes, canvasSize } = canvasData;
    
    if (strokes.length === 0) {
      return {
        success: false,
        qualityScore: 0,
        metrics: {
          strokeCount: 0,
          totalLength: 0,
          averageSpeed: 0,
          smoothness: 0,
          coverage: 0,
          complexity: 0
        },
        errors: ['Canvas vazio - nenhum traço encontrado']
      };
    }

    // Calcular métricas básicas
    const strokeCount = strokes.length;
    let totalLength = 0;
    let totalTime = 0;
    let smoothnessSum = 0;

    // Calcular bounding box para coverage
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    strokes.forEach(stroke => {
      const points = stroke.points;
      if (points.length < 2) return;

      let strokeLength = 0;
      let strokeSmoothness = 0;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Calcular distância
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        strokeLength += distance;
        
        // Atualizar bounding box
        minX = Math.min(minX, curr.x);
        minY = Math.min(minY, curr.y);
        maxX = Math.max(maxX, curr.x);
        maxY = Math.max(maxY, curr.y);
        
        // Calcular suavidade (variação de direção)
        if (i > 1) {
          const prevPrev = points[i - 2];
          const angle1 = Math.atan2(prev.y - prevPrev.y, prev.x - prevPrev.x);
          const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          const angleDiff = Math.abs(angle2 - angle1);
          strokeSmoothness += Math.min(angleDiff, 2 * Math.PI - angleDiff);
        }
        
        // Calcular tempo
        if (curr.timestamp && prev.timestamp) {
          totalTime += curr.timestamp - prev.timestamp;
        }
      }
      
      totalLength += strokeLength;
      smoothnessSum += strokeSmoothness / Math.max(1, points.length - 2);
    });

    // Calcular métricas finais
    const averageSpeed = totalTime > 0 ? totalLength / totalTime : 0;
    const smoothness = Math.max(0, 1 - (smoothnessSum / strokeCount) / Math.PI);
    
    // Coverage: proporção da área do canvas utilizada
    const usedWidth = maxX - minX;
    const usedHeight = maxY - minY;
    const usedArea = usedWidth * usedHeight;
    const totalArea = canvasSize.width * canvasSize.height;
    const coverage = Math.min(1, usedArea / totalArea);
    
    // Complexidade: baseada no número de traços e pontos
    const totalPoints = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
    const complexity = Math.min(1, (strokeCount * 0.3 + totalPoints * 0.001));

    const metrics: QualityMetrics = {
      strokeCount,
      totalLength,
      averageSpeed,
      smoothness,
      coverage,
      complexity
    };

    // Calcular score de qualidade (0-100)
    const qualityScore = Math.round(
      (smoothness * 30) +
      (coverage * 25) +
      (complexity * 20) +
      (Math.min(1, strokeCount / 5) * 15) +
      (Math.min(1, totalLength / 1000) * 10)
    );

    return {
      success: true,
      qualityScore,
      metrics,
      errors: []
    };
  }

  /**
   * Cria uma assinatura a partir de dados do canvas
   */
  async createSignatureFromCanvas(
    canvasData: SignatureCanvasData,
    imageBlob: Blob,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<SignatureUploadResponse> {
    try {
      onProgress?.(10);

      // Processar dados do canvas
      const processingResult = this.processCanvasData(canvasData);
      
      if (!processingResult.success) {
        return {
          success: false,
          message: 'Dados do canvas inválidos',
          errors: processingResult.errors
        };
      }

      onProgress?.(30);

      // Validar qualidade mínima
      if (processingResult.qualityScore < 20) {
        return {
          success: false,
          message: 'Qualidade da assinatura muito baixa',
          errors: ['A assinatura precisa ser mais detalhada e legível']
        };
      }

      // Converter Blob para File
      const timestamp = Date.now();
      const fileName = `canvas_signature_${userId}_${timestamp}.png`;
      const file = new File([imageBlob], fileName, { type: 'image/png' });

      // Validar arquivo gerado
      const fileValidation = this.validateSignatureFile(file);
      if (!fileValidation.isValid) {
        return {
          success: false,
          message: 'Arquivo gerado inválido',
          errors: fileValidation.errors
        };
      }

      onProgress?.(50);

      // Upload do arquivo
      const filePath = `${userId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png'
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      onProgress?.(80);

      // Preparar metadados de processamento
      const processingMetadata: ProcessingMetadata = {
        algorithm: 'canvas-v1',
        version: '1.0.0',
        processedAt: new Date().toISOString(),
        steps: ['stroke-analysis', 'quality-calculation', 'metrics-extraction'],
        parameters: {
          minQualityScore: 20,
          smoothnessWeight: 0.3,
          coverageWeight: 0.25,
          complexityWeight: 0.2
        }
      };

      // Salvar no banco de dados com dados estendidos
      const { data: signatureData, error: dbError } = await supabase
        .from('signatures')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: 'image/png',
          width: canvasData.canvasSize.width,
          height: canvasData.canvasSize.height,
          creation_method: 'canvas' as SignatureCreationMethod,
          quality_score: processingResult.qualityScore,
          processing_metadata: processingMetadata,
          canvas_data: canvasData,
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
        message: `Assinatura criada com sucesso (Qualidade: ${processingResult.qualityScore}%)`
      };

    } catch (error) {
      console.error('Erro ao criar assinatura do canvas:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao criar assinatura',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }
}

// Exportar instância singleton
export const signaturesService = new SignaturesService();
export default signaturesService;