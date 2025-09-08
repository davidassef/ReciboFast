// MIT License
// Autor atual: David Assef
// Descrição: Serviço para verificação do hCaptcha no backend
// Data: 08-09-2025

import { apiClient } from './api';

function isLocalhost(host?: string) {
  const h = host || (typeof window !== 'undefined' ? window.location.hostname : '');
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
}

export interface HCaptchaVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyCaptcha(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Em localhost, não valida server-side (usa chave de teste no componente)
    if (isLocalhost()) {
      return { ok: true };
    }

    const sitekey = (import.meta as any)?.env?.VITE_HCAPTCHA_SITE_KEY as string | undefined;
    const { data, error } = await apiClient.post<HCaptchaVerifyResponse>('/captcha/verify', {
      token,
      sitekey,
    });

    if (error) {
      return { ok: false, error };
    }
    if (!data) {
      return { ok: false, error: 'Sem resposta do verificador de segurança.' };
    }

    if (!data.success) {
      const codes = (data['error-codes'] || []).join(', ');
      return { ok: false, error: codes || 'Falha na verificação do hCaptcha.' };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro ao verificar o hCaptcha.' };
  }
}
