// Autor: David Assef
// Data: 11-09-2025
// Descrição: Componente para upload de assinaturas digitais
// MIT License

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { SignatureService } from '../../services/signatureService';
import type { Signature, SignatureValidation } from '../../types/signatures';

interface SignatureUploadProps {
  onUploadSuccess?: (signature: Signature) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // em MB
  acceptedFormats?: string[];
  className?: string;
}

export const SignatureUpload: React.FC<SignatureUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg'],
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validation, setValidation] = useState<SignatureValidation | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Evita abrir o seletor duas vezes (ex.: click em área + botão interno)
  const isDialogOpenRef = useRef<boolean>(false);
  // Remoção automática de fundo
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = useState<number>(12); // 0-100 (12 ~ leve)
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  useEffect(() => {
    const onWindowFocus = () => {
      // Ao fechar o seletor, o foco volta para a janela: libera o guard
      isDialogOpenRef.current = false;
    };
    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, []);

  const validateFile = (file: File): SignatureValidation => {
    const errors: string[] = [];

    // Validar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      errors.push(`Arquivo muito grande. Máximo: ${maxFileSize}MB`);
    }

    // Validar formato
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`Formato não suportado. Aceitos: ${acceptedFormats.join(', ')}`);
    }

    // Validar nome do arquivo
    // Avisos não críticos removidos para simplificar tipagem

    return {
      isValid: errors.length === 0,
      errors,
      maxSize: maxFileSize * 1024 * 1024,
      allowedTypes: acceptedFormats
    };
  };

  // Heurística simples para identificar se a imagem é provavelmente uma assinatura
  // Critérios:
  // - Proporção largura/altura maior que 2 (assinaturas tendem a ser horizontais)
  // - Alta proporção de transparência (PNG) OU poucos pixels escuros sobre fundo claro
  // - Baixa densidade de cores (traços finos predominam)
  const analyzeImageForSignature = async (file: File): Promise<{ ok: boolean; reason?: string; metrics?: any; pngBlob?: Blob } > => {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Imagem inválida'));
        const url = URL.createObjectURL(file);
        image.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return { ok: false, reason: 'Canvas não suportado' };

      // Reduzir amostragem para acelerar (máx 800px de largura)
      const scale = Math.min(1, 800 / img.width);
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const { width, height } = canvas;
      const aspect = width / Math.max(1, height);

      const data = ctx.getImageData(0, 0, width, height).data;
      let transparentCount = 0;
      let darkCount = 0;
      let nonWhiteCount = 0;
      let total = width * height;

      // Amostragem a cada 2px para desempenho
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 20) { transparentCount++; continue; }
          // luminância aproximada
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (lum < 60) darkCount++;
          if (!(r > 245 && g > 245 && b > 245)) nonWhiteCount++;
        }
      }
      const sampled = Math.ceil(total / 4); // aprox por step 2
      const transparencyRatio = transparentCount / sampled;
      const darkRatio = darkCount / sampled;
      const nonWhiteRatio = nonWhiteCount / sampled;

      // Heurística:
      // - Aspecto horizontal: aspect >= 2
      // - Assinaturas em PNG costumam ter transparência significativa OU fundo muito claro e traços escuros
      //   Considerar válido se transparencyRatio >= 0.15 OU (nonWhiteRatio <= 0.25 e darkRatio entre 0.01 e 0.2)
      const horizontalOk = aspect >= 2.0;
      const alphaOk = transparencyRatio >= 0.15;
      const strokesOnWhiteOk = (nonWhiteRatio <= 0.25) && (darkRatio >= 0.005 && darkRatio <= 0.25);
      const ok = (horizontalOk && (alphaOk || strokesOnWhiteOk));

      // Exportar PNG para padronização
      const dataUrl = canvas.toDataURL('image/png');
      const pngBlob = await (await fetch(dataUrl)).blob();

      return {
        ok,
        reason: ok ? undefined : 'A foto precisa ser de uma assinatura (imagem horizontal, traços sobre fundo claro ou com transparência).',
        metrics: { aspect, transparencyRatio, darkRatio, nonWhiteRatio },
        pngBlob
      };
    } catch (e) {
      return { ok: false, reason: 'Falha ao analisar imagem' };
    }
  };

  // Remove o fundo claro (próximo ao branco) criando transparência em PNG
  const removeBackground = async (
    blob: Blob,
    tolerance: number
  ): Promise<{ previewUrl: string; pngBlob: Blob }> => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Falha ao carregar imagem para remoção de fundo'));
      image.src = URL.createObjectURL(blob);
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas não suportado');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Converter tolerância 0-100 para threshold 0-255
    const thr = Math.max(0, Math.min(255, Math.round(2.55 * tolerance * 1.6)));
    const soft = Math.min(255, Math.round(thr * 1.5));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;
      const nearWhite = (r >= 255 - thr) && (g >= 255 - thr) && (b >= 255 - thr);
      const nearWhiteSoft = (r >= 255 - soft) && (g >= 255 - soft) && (b >= 255 - soft);
      if (nearWhite) {
        data[i + 3] = 0; // transparente
      } else if (nearWhiteSoft) {
        const maxC = Math.max(r, g, b);
        const dist = maxC - (255 - soft); // 0..soft
        const alpha = Math.max(0, Math.min(255, 255 - Math.round((dist / soft) * 255)));
        data[i + 3] = Math.min(data[i + 3], alpha);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const outUrl = canvas.toDataURL('image/png');
    const outBlob = await (await fetch(outUrl)).blob();
    return { previewUrl: outUrl, pngBlob: outBlob };
  };

  const handleFileSelect = async (file: File) => {
    const basicValidation = validateFile(file);
    setValidation(basicValidation);

    if (!basicValidation.isValid) {
      onUploadError?.(basicValidation.errors.join(', '));
      return;
    }

    const analysis = await analyzeImageForSignature(file);
    if (!analysis.ok) {
      const msg = analysis.reason || 'A foto precisa ser de uma assinatura!';
      setValidation({ 
        isValid: false, 
        errors: [msg], 
        maxSize: maxFileSize * 1024 * 1024,
        allowedTypes: acceptedFormats
      });
      onUploadError?.(msg);
      return;
    }

    // Criar preview a partir do PNG padronizado
    if (analysis.pngBlob) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(analysis.pngBlob);
      setFileName(file.name.replace(/\.[^/.]+$/, '') + '.png');
      // Guardar o arquivo convertido no input para seguir o fluxo de upload
      const pngFile = new File([analysis.pngBlob], file.name.replace(/\.[^/.]+$/, '') + '.png', { type: 'image/png' });
      // Hack simples: criar um DataTransfer para injetar o novo File no input
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(pngFile);
        fileInputRef.current.files = dt.files;
      }

      // Processar remoção de fundo (opcional)
      setProcessedPreview(null);
      setProcessedBlob(null);
      if (removeBg) {
        try {
          const { previewUrl, pngBlob } = await removeBackground(analysis.pngBlob, bgTolerance);
          setProcessedPreview(previewUrl);
          setProcessedBlob(pngBlob);
        } catch (e) {
          console.warn('Remoção de fundo falhou, mantendo imagem original.', e);
        }
      }
      // Requer nova confirmação do usuário a cada nova seleção
      setConfirmed(false);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      if (!confirmed) { setUploading(false); return; }
      const nameToUse = (customName && customName.trim()) ? customName.trim() : file.name;
      // Decide qual blob enviar: o processado (sem fundo) ou o original convertido em PNG
      const toSendFile = (removeBg && processedBlob)
        ? new File([processedBlob], file.name.replace(/\.[^/.]+$/, '') + '.png', { type: 'image/png' })
        : file;
      const uploadedSignature = await SignatureService.uploadSignature({ name: nameToUse, file: toSendFile, is_default: false });
      onUploadSuccess?.(uploadedSignature);
      
      // Limpar estado
      setPreview(null);
      setFileName('');
      setValidation(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCustomName('');
      setProcessedPreview(null);
      setProcessedBlob(null);
      setConfirmed(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
    // Libera o guard após seleção/cancelamento
    isDialogOpenRef.current = false;
  };

  const clearSelection = () => {
    setPreview(null);
    setFileName('');
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Área de Upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : preview 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (preview || uploading) return;
          if (isDialogOpenRef.current) return;
          isDialogOpenRef.current = true;
          fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          disabled={uploading}
        />

        {preview ? (
          <div className="space-y-4">
            {/* Preview da Assinatura */}
            <div className="relative inline-flex items-start gap-4">
              <div className="relative">
                <div className="text-xs text-gray-600 mb-1">Original</div>
                <img src={preview} alt="Preview original" className="max-h-32 max-w-full object-contain border rounded bg-white" />
              </div>
              {removeBg && (
                <div className="relative">
                  <div className="text-xs text-gray-600 mb-1">Sem fundo (prévia)</div>
                  <img src={processedPreview || preview} alt="Preview processado" className="max-h-32 max-w-full object-contain border rounded bg-white" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                  setProcessedPreview(null);
                  setProcessedBlob(null);
                  setConfirmed(false);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={uploading}
                aria-label="Remover seleção"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nome do Arquivo */}
            <p className="text-sm text-gray-600 truncate">{fileName}</p>

            {/* Nome amigável (opcional) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome da assinatura (opcional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex.: Assinatura Principal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            {/* Remoção de fundo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4" checked={removeBg} onChange={async (e) => {
                  setRemoveBg(e.target.checked);
                  // Reprocessar caso já tenha imagem
                  if (e.target.checked && fileInputRef.current?.files?.[0]) {
                    try {
                      const blob = processedBlob || (await (await fetch(preview!)).blob());
                      const { previewUrl, pngBlob } = await removeBackground(blob, bgTolerance);
                      setProcessedPreview(previewUrl);
                      setProcessedBlob(pngBlob);
                    } catch {}
                  }
                }} />
                Remover fundo automaticamente
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="text-xs text-gray-600 whitespace-nowrap">Tolerância</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bgTolerance}
                  onChange={async (e) => {
                    const v = Number(e.target.value);
                    setBgTolerance(v);
                    if (removeBg && fileInputRef.current?.files?.[0]) {
                      try {
                        const blob = processedBlob || (await (await fetch(preview!)).blob());
                        const { previewUrl, pngBlob } = await removeBackground(blob, v);
                        setProcessedPreview(previewUrl);
                        setProcessedBlob(pngBlob);
                      } catch {}
                    }
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-600 w-8 text-right">{bgTolerance}</span>
              </div>
            </div>

            {/* Validação */}
            {validation && validation.isValid && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Arquivo válido para upload</span>
                </div>
              </div>
            )}

            {/* Confirmação do usuário */}
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="h-4 w-4" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              Confirmo que esta é minha assinatura e está correta
            </label>

            {/* Botão de Upload */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={uploading || !validation?.isValid || !confirmed}
              className="
                px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center gap-2 mx-auto
              "
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar Assinatura
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Arraste sua assinatura aqui
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ou clique para selecionar um arquivo
              </p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Formatos aceitos: PNG, JPEG, JPG</p>
              <p>Tamanho máximo: {maxFileSize}MB</p>
            </div>
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (uploading) return;
                  if (isDialogOpenRef.current) return;
                  isDialogOpenRef.current = true;
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                <Upload className="w-4 h-4" /> Selecionar arquivo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mensagens de Erro */}
      {validation && validation.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erro na validação:</span>
          </div>
          <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};