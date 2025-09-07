// Autor: David Assef
// Descrição: Componente para animação suave na transição de rotas com barra de progresso
// Data: 07-09-2025
// MIT License

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  /** Tempo mínimo (ms) que a barra de progresso ficará visível ao trocar de rota */
  minDelayMs?: number;
}

const RouteTransition: React.FC<Props> = ({ children, minDelayMs = 600 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Reinicia a animação a cada mudança de rota
    el.classList.remove('animate-fadeIn', 'animate-slideInUp');
    // Força reflow para reiniciar animação
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetHeight;
    el.classList.add('animate-fadeIn', 'animate-slideInUp');
    
    // Exibe a barra de progresso por um período mínimo
    setLoading(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setLoading(false), minDelayMs);
    
  }, [location.pathname, minDelayMs]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  return (
    <div className="relative">
      {/* Top progress bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[60]">
          <div className="h-0.5 bg-gray-200">
            <div className="h-full w-full bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 [animation:slideInRight_0.8s_ease-in-out_infinite]" />
          </div>
        </div>
      )}
      <div ref={containerRef} className="will-change-transform">
        {children}
      </div>
    </div>
  );
};

export default RouteTransition;
