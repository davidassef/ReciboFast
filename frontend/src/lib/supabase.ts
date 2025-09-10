// Autor: David Assef
// Descrição: Configuração do cliente Supabase para o frontend
// Data: 05-09-2025
// MIT License

import { createClient } from '@supabase/supabase-js';

// Lê configurações do Vite (.env)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Em produção, evite crash do app por falta de env — exponha flag e stub que lança ao usar.
export const SUPABASE_READY = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = SUPABASE_READY
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : (new Proxy({}, {
      get() {
        // eslint-disable-next-line no-console
        console.error('[Supabase] Variáveis ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no provedor de deploy.');
        throw new Error('Supabase não configurado (VITE_SUPABASE_URL/ANON_KEY ausentes)');
      }
    }) as any);

// Tipos para autenticação
export interface User {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

// Funções de autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Registro com email e senha
  signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Login com Google OAuth
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Obter sessão atual
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Resetar senha
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Reenviar e-mail de confirmação
  resendEmailConfirmation: async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { data, error };
  },

  // Atualizar senha
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },

  // Atualizar perfil do usuário
  updateProfile: async (updates: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    return { data, error };
  },

  // Listener para mudanças de autenticação
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabase;