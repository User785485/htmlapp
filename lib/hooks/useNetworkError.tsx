'use client';

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  downlink?: number;
  rtt?: number;
}

export function useNetworkError() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
  });
  
  const [retryQueue, setRetryQueue] = useState<Array<() => Promise<any>>>([]);
  
  // Logger les changements de statut réseau
  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    const connection = (navigator as any).connection;
    
    const status: NetworkStatus = {
      isOnline,
      isSlowConnection: false,
    };
    
    if (connection) {
      status.connectionType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
      
      // Considérer comme lent si 2g ou si RTT > 500ms
      status.isSlowConnection = 
        connection.effectiveType === '2g' || 
        connection.effectiveType === 'slow-2g' ||
        (connection.rtt && connection.rtt > 500);
    }
    
    setNetworkStatus(status);
    
    logger.info('NETWORK', 'status_change', 'Changement de statut réseau', {
      online: status.isOnline,
      slow_connection: status.isSlowConnection,
      connection_type: status.connectionType,
      downlink: status.downlink,
      rtt: status.rtt,
    });
    
    // Si retour en ligne, traiter la queue de retry
    if (isOnline && retryQueue.length > 0) {
      processRetryQueue();
    }
  }, [retryQueue]);
  
  // Traiter la queue de retry
  const processRetryQueue = async () => {
    logger.info('NETWORK', 'retry_queue_start', `Traitement de ${retryQueue.length} requêtes en attente`);
    
    const queue = [...retryQueue];
    setRetryQueue([]);
    
    for (const retryFn of queue) {
      try {
        await retryFn();
      } catch (error) {
        logger.error('NETWORK', 'retry_failed', 'Échec du retry', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }
  };
  
  // Ajouter une fonction à la queue de retry
  const addToRetryQueue = useCallback((fn: () => Promise<any>) => {
    setRetryQueue(prev => [...prev, fn]);
    logger.debug('NETWORK', 'add_to_retry_queue', 'Requête ajoutée à la queue de retry', {
      queue_length: retryQueue.length + 1,
    });
  }, [retryQueue.length]);
  
  // Wrapper pour fetch avec gestion des erreurs réseau
  const fetchWithRetry = useCallback(async (
    url: string,
    options?: RequestInit,
    maxRetries: number = 3
  ): Promise<Response> => {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Vérifier la connexion avant la requête
        if (!networkStatus.isOnline) {
          throw new Error('Pas de connexion internet');
        }
        
        // Avertir si connexion lente
        if (networkStatus.isSlowConnection) {
          logger.warn('NETWORK', 'slow_connection_warning', 'Connexion lente détectée', {
            connection_type: networkStatus.connectionType,
            rtt: networkStatus.rtt,
          });
        }
        
        // Timeout adaptatif selon la connexion
        const timeout = networkStatus.isSlowConnection ? 30000 : 10000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        
        logger.info('NETWORK', 'fetch_success', `Requête réussie: ${url}`, {
          url,
          method: options?.method || 'GET',
          status: response.status,
          duration_ms: duration,
          attempt,
        });
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;
        
        logger.error('NETWORK', 'fetch_error', `Erreur requête (tentative ${attempt}/${maxRetries})`, {
          url,
          method: options?.method || 'GET',
          error: error instanceof Error ? error.message : error,
          attempt,
          duration_ms: duration,
          online: networkStatus.isOnline,
        });
        
        // Si c'est une erreur réseau et qu'on n'est plus en ligne
        if (!networkStatus.isOnline && attempt === maxRetries) {
          // Ajouter à la queue de retry
          addToRetryQueue(() => fetchWithRetry(url, options, 1));
          throw new Error('Requête mise en queue pour retry (hors ligne)');
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Échec de la requête après plusieurs tentatives');
  }, [networkStatus, addToRetryQueue]);
  
  // Observer les changements de connexion
  useEffect(() => {
    // Événements de connexion
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Observer les changements de qualité de connexion
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }
    
    // Vérification initiale
    updateNetworkStatus();
    
    // Nettoyage
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);
  
  // Intercepter les erreurs fetch globalement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const url = resource.toString();
      
      try {
        const response = await originalFetch(...args);
        
        // Logger les erreurs HTTP
        if (!response.ok) {
          logger.warn('NETWORK', 'http_error', `Erreur HTTP: ${response.status}`, {
            url,
            status: response.status,
            statusText: response.statusText,
          });
        }
        
        return response;
      } catch (error) {
        // Logger toutes les erreurs réseau
        logger.error('NETWORK', 'global_fetch_error', 'Erreur réseau globale', {
          url,
          error: error instanceof Error ? error.message : error,
          online: navigator.onLine,
        });
        
        throw error;
      }
    };
    
    // Restaurer fetch original au démontage
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return {
    networkStatus,
    fetchWithRetry,
    addToRetryQueue,
    retryQueueLength: retryQueue.length,
  };
}

// Hook pour afficher le statut réseau
export function useNetworkStatusIndicator() {
  const { networkStatus } = useNetworkError();
  
  useEffect(() => {
    if (!networkStatus.isOnline) {
      // Afficher une notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f44336;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        font-family: sans-serif;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      notification.textContent = '⚠️ Connexion internet perdue';
      document.body.appendChild(notification);
      
      return () => {
        document.body.removeChild(notification);
      };
    }
  }, [networkStatus.isOnline]);
  
  return networkStatus;
}