// Autor: David Assef
// Descrição: Componente de botão para login social (Google OAuth)
// Data: 29-01-2025
// MIT License

import React, { useState } from 'react';
import { auth } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mapOAuthError, logOAuthError, isRecoverableError } from '../utils/oauthErrors';

interface SocialLoginButtonProps {
  provider: 'google';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  children,
  className = '',
  disabled = false,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      let result;
      
      switch (provider) {
        case 'google':
          result = await auth.signInWithGoogle();
          break;
        default:
          throw new Error(`Provider ${provider} não suportado`);
      }

      if (result.error) {
        throw result.error;
      }

      // Sucesso - o redirecionamento será feito automaticamente pelo Supabase
      toast.success('Redirecionando para autenticação...');
      onSuccess?.();
      
    } catch (err) {
      // Mapeia o erro para uma mensagem amigável
      const mappedError = mapOAuthError(err);
      
      // Registra o erro para monitoramento
      logOAuthError(mappedError, `Social login with ${provider}`);
      
      // Exibe a mensagem de erro amigável
      console.error('Erro no login social:', mappedError.userMessage);
      toast.error(`Erro no login: ${mappedError.userMessage}`);
      
      // Chama o callback de erro com a mensagem amigável
      onError?.(mappedError.userMessage);
      
      // Se o erro não é recuperável, pode ser útil mostrar instruções adicionais
      if (!isRecoverableError(mappedError.code)) {
        console.warn('Erro não recuperável detectado:', mappedError.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = `
    flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium
    transition-all duration-200 border border-gray-300
    hover:bg-gray-50 hover:border-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
    ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
  `;

  return (
    <button
      type="button"
      onClick={handleSocialLogin}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${className}`}
      aria-label={`Entrar com ${provider}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default SocialLoginButton;