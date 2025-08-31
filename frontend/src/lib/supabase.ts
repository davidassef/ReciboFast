// Autor: David Assef
// Descrição: Configuração do cliente Supabase para o frontend
// Data: 20-01-2025
// MIT License

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://macfrgskngbteazkatdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hY2ZyZ3NrbmdidGVhemthdGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODY4NTMsImV4cCI6MjA3MjA2Mjg1M30.74wm5i4iMSegPwJYsPQpM7o_wzdZ7OwAgU5J83JQcns';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para autenticação
export interface User {
  id: string;
  email?: string;
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