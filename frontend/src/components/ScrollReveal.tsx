// Autor: David Assef
// Descrição: Componente para revelar conteúdo ao rolar a página com IntersectionObserver
// Data: 07-09-2025
// MIT License

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  /** Classe de animação utilitária. Ex.: 'animate-slideInUp' */
  animationClassName?: string;
  /** Adiciona atraso na animação em ms */
  delayMs?: number;
}

const ScrollReveal: React.FC<Props> = ({ children, animationClassName = 'animate-slideInUp', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;

    const onIntersect: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          const run = () => {
            entry.target.classList.remove('opacity-0', 'translate-y-4');
            entry.target.classList.add(animationClassName);
            setRevealed(true);
          };
          if (delayMs > 0) {
            setTimeout(run, delayMs);
          } else {
            run();
          }
        }
      });
    };

    const observer = new IntersectionObserver(onIntersect, { threshold: 0.08 });
    observer.observe(el);

    return () => observer.disconnect();
  }, [animationClassName, delayMs, revealed]);

  return (
    <div ref={ref} className="opacity-0 translate-y-4 will-change-transform">
      {children}
    </div>
  );
};

export default ScrollReveal;
