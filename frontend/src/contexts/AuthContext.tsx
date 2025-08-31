// Autor: David Assef
// Descrição: Contexto de autenticação para gerenciar estado do usuário
// Data: 20-01-2025
// MIT License

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, User, AuthSession } from '../lib/supabase';
import { mapOAuthError, logOAuthError } from '../utils/oauthErrors';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (password: string) => Promise<{ data: any; error: any }>;
  updateProfile: (updates: any) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    const getInitialSession = async () => {
      try {
        const { session: initialSession } = await auth.getCurrentSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await auth.signIn(email, password);
      if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.session.user);
      }
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      const result = await auth.signUp(email, password, metadata);
      return result;
    } catch (error) {
      console.error('Erro no registro:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await auth.signOut();
      setSession(null);
      setUser(null);
      return result;
    } catch (error) {
      console.error('Erro no logout:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      return await auth.resetPassword(email);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      return await auth.updatePassword(password);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await auth.signInWithGoogle();
      
      if (result.error) {
        const mappedError = mapOAuthError(result.error);
        logOAuthError(mappedError, 'Google OAuth from AuthContext');
        return { data: null, error: mappedError };
      }
      
      // Para OAuth, o redirecionamento acontece automaticamente
      // A sessão será atualizada via onAuthStateChange
      return result;
    } catch (error) {
      const mappedError = mapOAuthError(error);
      logOAuthError(mappedError, 'Google OAuth from AuthContext');
      console.error('Erro no login com Google:', mappedError.userMessage);
      return { data: null, error: mappedError };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const result = await auth.updateProfile(updates);
      if (result.data?.user) {
        setUser(result.data.user);
      }
      return result;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { data: null, error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;