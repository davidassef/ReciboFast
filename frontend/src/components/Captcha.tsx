// Autor: David Assef
// Descrição: Componente reutilizável de hCaptcha para formulários
// Data: 08-09-2025
// MIT License

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useMemo, useRef, useState } from 'react';
import { HCAPTCHA_SITE_KEY } from '../config/env';

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
      const envKey = HCAPTCHA_SITE_KEY as string | undefined;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
      // Logs de depuração (não sensíveis) para identificar problemas de env em produção
      try {
        const masked = envKey ? `${envKey.slice(0, 4)}...${envKey.slice(-4)}` : '(vazio)';
        // eslint-disable-next-line no-console
        console.info('[Captcha][debug] host=', host, ' isLocal=', isLocal, ' VITE_HCAPTCHA_SITE_KEY=', masked);
      } catch {}
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
      {siteKey ? (
        <HCaptcha
          ref={captchaRef}
          sitekey={siteKey}
          onVerify={onVerify}
          onError={handleError}
          theme={theme}
          size={size}
        />
      ) : (
        <div className="text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded-lg p-3">
          hCaptcha não configurado para este ambiente. Defina a variável VITE_HCAPTCHA_SITE_KEY no ambiente de build.
        </div>
      )}
      <p className="text-xs text-neutral-500 mt-2">
        Protegido por hCaptcha —
        <a href="https://hcaptcha.com/privacy" target="_blank" rel="noreferrer" className="underline ml-1">
          Privacidade
        </a>
      </p>
      {localError && (
        <p className="text-xs text-error-600 mt-1">{localError}</p>
      )}
    </div>
  );
}
