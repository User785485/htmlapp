'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }
  
  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur complète
    logger.error('ERROR_BOUNDARY', 'react_error', 'Erreur React capturée', {
      error_id: this.state.errorId,
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      error_name: error.name,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    });
    
    // Mettre à jour l'état avec les infos complètes
    this.setState({
      errorInfo,
    });
  }
  
  handleReset = () => {
    logger.info('ERROR_BOUNDARY', 'reset', 'Réinitialisation après erreur', {
      error_id: this.state.errorId,
    });
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
              Une erreur est survenue
            </h2>
            
            <p className="mt-2 text-sm text-center text-gray-600">
              Nous avons rencontré un problème inattendu. L'erreur a été enregistrée
              et notre équipe en a été notifiée.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Détails techniques (dev only)
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-gray-600">
                    <strong>ID:</strong> {this.state.errorId}
                  </p>
                  <p className="text-red-600">
                    <strong>Erreur:</strong> {this.state.error.message}
                  </p>
                  <pre className="mt-2 p-2 bg-white rounded overflow-auto max-h-40 text-xs">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 p-2 bg-white rounded overflow-auto max-h-40 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
            
            {!process.env.NODE_ENV && (
              <p className="mt-4 text-xs text-center text-gray-500">
                Référence d'erreur : {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}