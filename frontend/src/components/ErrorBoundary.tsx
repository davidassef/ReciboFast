// Autor: David Assef
// Descrição: Boundary de erro para capturar exceções de runtime e exibir mensagem amigável
// Data: 05-09-2025
// MIT License

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou um erro:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Ocorreu um erro ao renderizar esta página.</p>
              <p className="text-sm mt-1">Tente recarregar. Se persistir, verifique o console do navegador para detalhes técnicos.</p>
              {this.state.error?.message && (
                <pre className="mt-3 text-xs text-red-700 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
