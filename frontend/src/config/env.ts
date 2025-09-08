// MIT License
// Autor atual: David Assef
// Descrição: Exporta variáveis de ambiente tipadas para uso no frontend (Vite)
// Data: 08-09-2025

// Importante: apenas variáveis com prefixo VITE_ são expostas ao cliente.
// Em produção (Vercel), devem ser definidas em Project > Settings > Environment Variables.

export const HCAPTCHA_SITE_KEY: string = (import.meta as any).env.VITE_HCAPTCHA_SITE_KEY || '';
