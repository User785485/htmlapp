'use client';

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseLoggingOptions {
  component: string;
  trackMountTime?: boolean;
  trackRenderCount?: boolean;
  trackUserActions?: boolean;
}

export function useLogging(options: UseLoggingOptions) {
  const { component, trackMountTime = true, trackRenderCount = true, trackUserActions = true } = options;
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);
  const isFirstRender = useRef<boolean>(true);
  
  // Logger le montage du composant
  useEffect(() => {
    if (trackMountTime) {
      const mountDuration = Date.now() - mountTime.current;
      logger.debug(component, 'mount', `Composant monté`, {
        mount_duration_ms: mountDuration,
        url: window.location.href,
      });
    }
    
    // Logger le démontage
    return () => {
      const totalLifetime = Date.now() - mountTime.current;
      logger.debug(component, 'unmount', `Composant démonté`, {
        total_lifetime_ms: totalLifetime,
        total_renders: renderCount.current,
      });
    };
  }, []);
  
  // Compter les rendus
  useEffect(() => {
    if (trackRenderCount) {
      renderCount.current += 1;
      
      if (!isFirstRender.current) {
        logger.debug(component, 'rerender', `Re-rendu du composant`, {
          render_count: renderCount.current,
        });
      }
      isFirstRender.current = false;
    }
  });
  
  // Logger une action utilisateur
  const logAction = useCallback((action: string, details?: any) => {
    if (trackUserActions) {
      logger.info(component, `user_${action}`, `Action utilisateur: ${action}`, {
        ...details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    }
  }, [component, trackUserActions]);
  
  // Logger un clic
  const logClick = useCallback((elementName: string, details?: any) => {
    logAction('click', {
      element: elementName,
      ...details,
    });
  }, [logAction]);
  
  // Logger un changement de valeur
  const logChange = useCallback((fieldName: string, value: any, previousValue?: any) => {
    logAction('change', {
      field: fieldName,
      value,
      previous_value: previousValue,
    });
  }, [logAction]);
  
  // Logger une soumission
  const logSubmit = useCallback((formName: string, data: any) => {
    // Ne pas utiliser logger.sanitizeDetails directement car c'est une propriu00e9tu00e9 privu00e9e
    // Utiliser une version nettoyu00e9e des donnu00e9es ou la mu00e9thode publique du logger si disponible
    const sanitizedData = typeof data === 'object' ? { ...data } : data;
    logAction('submit', {
      form: formName,
      data: sanitizedData,
    });
  }, [logAction]);
  
  // Logger une erreur
  const logError = useCallback((action: string, error: any, details?: any) => {
    logger.error(component, action, `Erreur dans ${action}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...details,
    });
  }, [component]);
  
  // Logger une opération asynchrone
  const logAsync = useCallback(async <T,>(
    action: string,
    operation: () => Promise<T>,
    details?: any
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      logger.debug(component, `${action}_start`, `Début: ${action}`, details);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      logger.info(component, `${action}_success`, `Succès: ${action}`, {
        ...details,
        duration_ms: duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logError(`${action}_error`, error, {
        ...details,
        duration_ms: duration,
      });
      
      throw error;
    }
  }, [component, logError]);
  
  // Logger les performances d'un rendu
  const logRenderPerformance = useCallback((renderName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // Plus de 16ms = potentiel problème de performance
        logger.warn(component, 'slow_render', `Rendu lent détecté: ${renderName}`, {
          render_name: renderName,
          duration_ms: duration,
          threshold_ms: 16,
        });
      } else {
        logger.debug(component, 'render_performance', `Performance de rendu: ${renderName}`, {
          render_name: renderName,
          duration_ms: duration,
        });
      }
    };
  }, [component]);
  
  return {
    logAction,
    logClick,
    logChange,
    logSubmit,
    logError,
    logAsync,
    logRenderPerformance,
  };
}

// Hook pour tracker les performances de navigation
export function useNavigationLogging() {
  useEffect(() => {
    // Observer les changements de route
    const logNavigation = () => {
      logger.info('NAVIGATION', 'page_view', 'Nouvelle page visitée', {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        timestamp: new Date().toISOString(),
      });
    };
    
    // Logger la navigation initiale
    logNavigation();
    
    // Écouter les changements de route (pour les SPA)
    window.addEventListener('popstate', logNavigation);
    
    // Observer les clics sur les liens
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        logger.info('NAVIGATION', 'link_click', 'Clic sur un lien', {
          href: link.href,
          text: link.textContent,
          from: window.location.href,
        });
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    // Nettoyer
    return () => {
      window.removeEventListener('popstate', logNavigation);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);
}

// Hook pour mesurer les Web Vitals
export function useWebVitalsLogging() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Observer le LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      logger.info('WEB_VITALS', 'lcp', 'Largest Contentful Paint', {
        value: lastEntry.startTime,
        good: lastEntry.startTime < 2500,
        needs_improvement: lastEntry.startTime >= 2500 && lastEntry.startTime < 4000,
        poor: lastEntry.startTime >= 4000,
      });
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Observer le FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        logger.info('WEB_VITALS', 'fid', 'First Input Delay', {
          value: entry.processingStart - entry.startTime,
          good: entry.processingStart - entry.startTime < 100,
          needs_improvement: entry.processingStart - entry.startTime >= 100 && entry.processingStart - entry.startTime < 300,
          poor: entry.processingStart - entry.startTime >= 300,
        });
      });
    });
    
    fidObserver.observe({ entryTypes: ['first-input'] });
    
    // Observer le CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          
          logger.info('WEB_VITALS', 'cls', 'Cumulative Layout Shift', {
            value: clsValue,
            good: clsValue < 0.1,
            needs_improvement: clsValue >= 0.1 && clsValue < 0.25,
            poor: clsValue >= 0.25,
          });
        }
      });
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    // Nettoyer
    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
}