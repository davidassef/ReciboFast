// Autor: David Assef
// Descrição: Layout principal com navegação por tabs
// Data: 20-01-2025
// MIT License

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  CreditCard, 
  PenTool,
  User,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const tabs: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    id: 'receitas',
    label: 'Receitas',
    icon: Receipt,
    path: '/receitas'
  },
  {
    id: 'contratos',
    label: 'Contratos',
    icon: FileText,
    path: '/contratos'
  },
  {
    id: 'recibos',
    label: 'Recibos',
    icon: CreditCard,
    path: '/recibos'
  },
  {
    id: 'assinaturas',
    label: 'Assinaturas',
    icon: PenTool,
    path: '/assinaturas'
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    path: '/perfil'
  }
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ReciboFast
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Bem-vindo, {user?.user_metadata?.full_name || user?.email || 'Usuário'}!
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                  'min-w-[60px] text-xs',
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 mb-1',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )} />
                <span className={cn(
                  'font-medium',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default Layout;