// Autor: David Assef
// Descrição: Componente reutilizável de hCaptcha para formulários
// Data: 08-09-2025
// MIT License

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HCAPTCHA_SITE_KEY } from '../config/env';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
  theme?: 'light' | 'dark' | 'contrast';
  size?: 'normal' | 'compact' | 'invisible';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export default function Captcha({ onVerify, onError, theme = 'light', size = 'normal', align = 'center', className }: CaptchaProps) {
  const captchaRef = useRef<HCaptcha>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fallback automático: em localhost usa a sitekey de teste oficial da hCaptcha
  const [siteKey, setSiteKey] = useState<string>('');
  const { host, envKey, isLocal } = useMemo(() => {
    const h = typeof window !== 'undefined' ? window.location.hostname : '';
    const k = HCAPTCHA_SITE_KEY as string | undefined;
    const local = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
    // Logs de depuração (não sensíveis) para identificar problemas de env em produção
    try {
      const masked = k ? `${k.slice(0, 4)}...${k.slice(-4)}` : '(vazio)';
      // eslint-disable-next-line no-console
      console.info('[Captcha][debug] host=', h, ' isLocal=', local, ' VITE_HCAPTCHA_SITE_KEY=', masked);
    } catch {}
    return { host: h, envKey: k, isLocal: local };
  }, []);

  useEffect(() => {
    // Define a sitekey de acordo com o ambiente
    if (isLocal) {
      setSiteKey('10000000-ffff-ffff-ffff-000000000001');
      return;
    }
    if (envKey && envKey.trim() !== '') {
      setSiteKey(envKey);
      return;
    }
    // Fallback em runtime: busca a sitekey pública no backend
    (async () => {
      try {
        const res = await fetch('/api/v1/captcha/sitekey');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const key = (json?.sitekey || '').toString();
        const masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '(vazio)';
        // eslint-disable-next-line no-console
        console.info('[Captcha][debug] sitekey(runtime)=', masked);
        setSiteKey(key);
      } catch (e) {
        console.warn('[Captcha][debug] falha ao obter sitekey em runtime:', e);
        setSiteKey('');
      }
    })();
  }, [envKey, isLocal]);

  const handleError = (err: any) => {
    const msg = 'Falha na verificação de segurança. Tente novamente.';
    setLocalError(msg);
    onError?.(err);
    // Se ocorrer erro, invalidamos o token no pai
    try { onVerify(''); } catch {}
    // fallback de log não bloqueante
    console.error('[Captcha] erro:', err);
  };

  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  // Altura/largura mínimas para evitar corte do widget (especialmente checkbox e branding)
  const minH = size === 'compact' ? 120 : 140;
  const minW = size === 'compact' ? 240 : 304; // hCaptcha normal ~302px

  return (
    <div className={`my-3 w-full flex ${alignClass} ${className || ''}`}>
      {siteKey ? (
        <div
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm px-3"
          style={{ minHeight: minH, minWidth: minW, width: '100%', maxWidth: 360 }}
        >
          <HCaptcha
            ref={captchaRef}
            sitekey={siteKey}
            onVerify={onVerify}
            onError={handleError}
            onExpire={() => {
              try { onVerify(''); } catch {}
            }}
            onClose={() => {
              try { onVerify(''); } catch {}
            }}
            theme={theme}
            size={size}
          />
        </div>
      ) : (
        <div className="text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded-lg p-3">
          hCaptcha não configurado para este ambiente. Defina a variável VITE_HCAPTCHA_SITE_KEY no ambiente de build.
        </div>
      )}
      {/* Rodapé informativo */}
      <div className="w-full flex justify-center">
        <p className="text-xs text-neutral-500 mt-2">
          Protegido por hCaptcha —
          <a href="https://hcaptcha.com/privacy" target="_blank" rel="noreferrer" className="underline ml-1">
            Privacidade
          </a>
        </p>
      </div>
      {localError && (
        <p className="text-xs text-error-600 mt-1 text-center">{localError}</p>
      )}
    </div>
  );
}
