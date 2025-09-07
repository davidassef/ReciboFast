// Autor: David Assef
// Descrição: Loader global premium para Suspense e splash inicial
// Data: 07-09-2025
// MIT License

import React from 'react';

const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        {/* Marca */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-purple-500 animate-scaleIn shadow-lg" />
          <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-br from-blue-500 via-sky-500 to-purple-500 rounded-2xl" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Carregando</p>
          <p className="text-sm text-gray-600">Sincronizando dados...</p>
        </div>

        {/* Barra de progresso estilizada */}
        <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 [animation:slideInRight_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
