// MIT License
// Autor: David Assef
// Descrição: Cliente base para chamadas à API
// Data: 30-08-2025

// Configuração base da API
// TODO: Implementar configuração dinâmica via variáveis de ambiente
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Classe para gerenciar chamadas HTTP
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Método para obter o token de autenticação
  private async getAuthToken(): Promise<string | null> {
    try {
      const { auth } = await import('../lib/supabase');
      const { session, error } = await auth.getCurrentSession();
      if (error) {
        console.warn('Falha ao obter sessão do Supabase:', error);
        return null;
      }
      return session?.access_token ?? null;
    } catch (err) {
      console.warn('Supabase não disponível para obter token:', err);
      return null;
    }
  }

  // Método genérico para fazer requisições
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const token = await this.getAuthToken();
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido na API'
      };
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Método para verificar conectividade
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/healthz`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Método para verificar se a API está disponível
  async isApiAvailable(): Promise<boolean> {
    return this.healthCheck();
  }
}

// Instância global do cliente API
export const apiClient = new ApiClient();

// Tipos para respostas da API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Utilitários para tratamento de erros
export const handleApiError = (error: string | null): string => {
  if (!error) return '';
  
  // Mapear erros comuns
  if (error.includes('401') || error.includes('Unauthorized')) {
    return 'Sessão expirada. Faça login novamente.';
    }
  
  if (error.includes('403') || error.includes('Forbidden')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  if (error.includes('404') || error.includes('Not Found')) {
    return 'Recurso não encontrado.';
  }
  
  if (error.includes('500') || error.includes('Internal Server Error')) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }
  
  return error;
};