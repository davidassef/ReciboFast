// Autor: David Assef
// Descrição: Componente de notificação PWA para atualizações
// Data: 20-01-2025
// MIT License

import React from 'react';
import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { cn } from '../lib/utils';

const PWANotification: React.FC = () => {
  const { needRefresh, offlineReady, updateServiceWorker } = usePWA();
  const [showNotification, setShowNotification] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (needRefresh || offlineReady) {
      setShowNotification(true);
    }
  }, [needRefresh, offlineReady]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setIsUpdating(false);
      setShowNotification(false);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {needRefresh ? (
              <RefreshCw className="w-5 h-5 text-blue-600" />
            ) : (
              <Wifi className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              {needRefresh ? 'Atualização Disponível' : 'App Pronto para Uso Offline'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {needRefresh
                ? 'Uma nova versão do app está disponível. Clique em atualizar para obter as últimas funcionalidades.'
                : 'O app agora pode ser usado offline. Você pode continuar usando mesmo sem conexão com a internet.'}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {needRefresh && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isUpdating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Atualizar</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleClose}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Mais tarde
            </button>
          </div>
        )}
        
        {offlineReady && !needRefresh && (
          <div className="mt-4">
            <button
              onClick={handleClose}
              className="w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              Entendi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWANotification;