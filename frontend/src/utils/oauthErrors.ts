/**
 * Utilitário para tratamento de erros OAuth
 * Autor: David Assef
 * Data: 20-01-2025
 * Descrição: Mapeia e trata erros específicos do OAuth para melhor experiência do usuário
 * MIT License
 */

export interface OAuthError {
  code: string;
  message: string;
  userMessage: string;
}

// Interface para objetos de erro que podem vir do OAuth
interface ErrorObject {
  error?: string;
  code?: string;
  message?: string;
  error_description?: string;
}

// Códigos de erro comuns do OAuth
export const OAUTH_ERROR_CODES = {
  ACCESS_DENIED: 'acesso_negado',
  INVALID_REQUEST: 'requisicao_invalida',
  UNAUTHORIZED_CLIENT: 'cliente_nao_autorizado',
  UNSUPPORTED_RESPONSE_TYPE: 'tipo_resposta_nao_suportado',
  INVALID_SCOPE: 'escopo_invalido',
  SERVER_ERROR: 'erro_servidor',
  TEMPORARILY_UNAVAILABLE: 'temporariamente_indisponivel',
  POPUP_BLOCKED: 'popup_blocked',
  NETWORK_ERROR: 'erro_rede',
  TIMEOUT: 'tempo_esgotado'
} as const;

/**
 * Mapeia erros do OAuth para mensagens amigáveis ao usuário
 */
export const mapOAuthError = (error: unknown): OAuthError => {
  // Se o erro já é um objeto estruturado
  if (error && typeof error === 'object') {
    const errorObj = error as ErrorObject;
    const errorCode = errorObj.error || errorObj.code || errorObj.message;
    const errorMessage = errorObj.error_description || errorObj.message || 'Erro desconhecido';

    switch (errorCode) {
      case OAUTH_ERROR_CODES.ACCESS_DENIED:
        return {
          code: OAUTH_ERROR_CODES.ACCESS_DENIED,
          message: errorMessage,
          userMessage: 'Acesso negado. Você cancelou a autorização ou negou as permissões necessárias.'
        };

      case OAUTH_ERROR_CODES.POPUP_BLOCKED:
        return {
          code: OAUTH_ERROR_CODES.POPUP_BLOCKED,
          message: errorMessage,
          userMessage: 'Pop-up bloqueado. Por favor, permita pop-ups para este site e tente novamente.'
        };

      case OAUTH_ERROR_CODES.NETWORK_ERROR:
        return {
          code: OAUTH_ERROR_CODES.NETWORK_ERROR,
          message: errorMessage,
          userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.'
        };

      case OAUTH_ERROR_CODES.TIMEOUT:
        return {
          code: OAUTH_ERROR_CODES.TIMEOUT,
          message: errorMessage,
          userMessage: 'Tempo limite excedido. Tente novamente.'
        };

      case OAUTH_ERROR_CODES.SERVER_ERROR:
        return {
          code: OAUTH_ERROR_CODES.SERVER_ERROR,
          message: errorMessage,
          userMessage: 'Erro interno do servidor. Tente novamente em alguns minutos.'
        };

      case OAUTH_ERROR_CODES.TEMPORARILY_UNAVAILABLE:
        return {
          code: OAUTH_ERROR_CODES.TEMPORARILY_UNAVAILABLE,
          message: errorMessage,
          userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
        };

      default: {
        // Verifica se a mensagem contém palavras-chave específicas
        const lowerMessage = errorMessage.toLowerCase();
        
        if (lowerMessage.includes('popup') || lowerMessage.includes('blocked')) {
          return {
            code: OAUTH_ERROR_CODES.POPUP_BLOCKED,
            message: errorMessage,
            userMessage: 'Pop-up bloqueado. Por favor, permita pop-ups para este site e tente novamente.'
          };
        }
        
        if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('rede') || lowerMessage.includes('conexão')) {
          return {
            code: OAUTH_ERROR_CODES.NETWORK_ERROR,
            message: errorMessage,
            userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.'
          };
        }
        
        if (lowerMessage.includes('timeout') || lowerMessage.includes('time') || lowerMessage.includes('tempo')) {
          return {
            code: OAUTH_ERROR_CODES.TIMEOUT,
            message: errorMessage,
            userMessage: 'Tempo limite excedido. Tente novamente.'
          };
        }

        return {
          code: 'erro_desconhecido',
          message: errorMessage,
          userMessage: 'Erro inesperado durante a autenticação. Tente novamente.'
        };
      }
    }
  }

  // Se o erro é uma string
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('access_denied') || lowerError.includes('denied')) {
      return {
        code: OAUTH_ERROR_CODES.ACCESS_DENIED,
        message: error,
        userMessage: 'Acesso negado. Você cancelou a autorização ou negou as permissões necessárias.'
      };
    }
    
    if (lowerError.includes('popup') || lowerError.includes('blocked')) {
      return {
        code: OAUTH_ERROR_CODES.POPUP_BLOCKED,
        message: error,
        userMessage: 'Pop-up bloqueado. Por favor, permita pop-ups para este site e tente novamente.'
      };
    }
    
    return {
      code: 'erro_desconhecido',
      message: error,
      userMessage: 'Erro durante a autenticação. Tente novamente.'
    };
  }

  // Erro genérico
  return {
    code: 'erro_desconhecido',
    message: 'Erro desconhecido',
    userMessage: 'Erro inesperado durante a autenticação. Tente novamente.'
  };
};

/**
 * Verifica se um erro é recuperável (o usuário pode tentar novamente)
 */
export const isRecoverableError = (errorCode: string): boolean => {
  const recoverableErrors: string[] = [
    OAUTH_ERROR_CODES.NETWORK_ERROR,
    OAUTH_ERROR_CODES.TIMEOUT,
    OAUTH_ERROR_CODES.SERVER_ERROR,
    OAUTH_ERROR_CODES.TEMPORARILY_UNAVAILABLE,
    OAUTH_ERROR_CODES.POPUP_BLOCKED
  ];
  
  return recoverableErrors.includes(errorCode);
};

/**
 * Registra erros OAuth para monitoramento
 */
export const logOAuthError = (error: OAuthError, context?: string): void => {
  console.error('OAuth Error:', {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Aqui você pode integrar com serviços de monitoramento como Sentry
  // Sentry.captureException(new Error(error.message), {
  //   tags: { errorCode: error.code, context },
  //   extra: { userMessage: error.userMessage }
  // });
};