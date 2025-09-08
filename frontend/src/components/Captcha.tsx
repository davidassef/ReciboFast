// Autor: David Assef
// Descrição: Componente reutilizável de hCaptcha para formulários
// Data: 08-09-2025
// MIT License

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useMemo, useRef, useState } from 'react';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
  theme?: 'light' | 'dark' | 'contrast';
  size?: 'normal' | 'compact' | 'invisible';
}

export default function Captcha({ onVerify, onError, theme = 'dark', size = 'compact' }: CaptchaProps) {
  const captchaRef = useRef<HCaptcha>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fallback automático: em localhost usa a sitekey de teste oficial da hCaptcha
  const siteKey = useMemo(() => {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      const envKey = (import.meta as any)?.env?.VITE_HCAPTCHA_SITE_KEY as string | undefined;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
      if (isLocal) {
        // Chave de teste (sempre válida no localhost)
        return '10000000-ffff-ffff-ffff-000000000001';
      }
      return envKey || '';
    } catch {
      return '';
    }
  }, []);

  const handleError = (err: any) => {
    const msg = 'Falha na verificação de segurança. Tente novamente.';
    setLocalError(msg);
    onError?.(err);
    // fallback de log não bloqueante
    console.error('[Captcha] erro:', err);
  };

  return (
    <div className="my-4">
      <HCaptcha
        ref={captchaRef}
        sitekey={siteKey}
        onVerify={onVerify}
        onError={handleError}
        theme={theme}
        size={size}
      />
      <p className="text-xs text-neutral-500 mt-2">
        Protegido por hCaptcha —
        <a href="https://hcaptcha.com/privacy" target="_blank" rel="noreferrer" className="underline ml-1">
          Privacidade
        </a>
      </p>
      {localError && (
        <p className="text-xs text-error-600 mt-1">{localError}</p>
      )}
      {(!siteKey || siteKey === '') && (
        <p className="text-xs text-warning-700 mt-1">Chave do hCaptcha não configurada. Defina VITE_HCAPTCHA_SITE_KEY para produção.</p>
      )}
    </div>
  );
}
