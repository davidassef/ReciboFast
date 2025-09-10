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

export async function verifyCaptcha(_token: string): Promise<{ ok: boolean; error?: string }> {
  // Desabilitado temporariamente por solicitação: focar nas funcionalidades do app
  // TODO: Reativar verificação server-side do hCaptcha quando as chaves forem configuradas
  return { ok: true };
}
