// Autor: David Assef
// Descrição: Componente de rota protegida para controle de acesso
// Data: 20-01-2025
// MIT License

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Bypass de autenticação para E2E/local apenas (não afeta produção)
  const bypassAuth = (import.meta.env.MODE !== 'production') && typeof window !== 'undefined' &&
    (() => {
      try { return localStorage.getItem('e2e_bypass_auth') === '1'; } catch { return false; }
    })();

  // Mostrar loading enquanto verifica autenticação
  if (loading && !bypassAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user && !bypassAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;