// Wrapper pour les appels API
import { logger } from './logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Fonction HOC pour logger les requêtes API
 * @param component Le nom du composant pour les logs
 * @param handler La fonction de gestionnaire d'API Next.js
 */
export function withApiLogging(
  component: string,
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const action = req.method?.toLowerCase() || 'request';
    
    try {
      // Log du début de la requête
      logger.debug(component, `${action}_start`, `Début de la requête ${action}`, {
        method: req.method,
        url: req.url,
        request_id: requestId
      });
      
      // Exécution du handler
      const response = await handler(req);
      
      // Log de la réponse
      const duration = Date.now() - startTime;
      logger.info(component, `${action}_success`, `Requête ${action} traitée avec succès`, {
        method: req.method,
        url: req.url,
        status: response.status,
        duration_ms: duration,
        request_id: requestId
      });
      
      return response;
    } catch (error: any) {
      // Log de l'erreur
      const duration = Date.now() - startTime;
      logger.error(component, `${action}_error`, `Erreur lors de la requête ${action}`, {
        method: req.method,
        url: req.url,
        error_message: error.message,
        error_stack: error.stack,
        duration_ms: duration,
        request_id: requestId
      });
      
      // Retourne une réponse d'erreur
      return NextResponse.json(
        { 
          error: 'Une erreur est survenue lors du traitement de la requête', 
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Classe pour encapsuler les appels API et gestion d'erreurs
 */
export class APIWrapper {
  /**
   * Exécute un appel API avec gestion des erreurs et logging
   */
  static async execute<T>(
    component: string,
    action: string,
    fn: () => Promise<T>,
    details: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.debug(component, `${action}_start`, `Début de l'action ${action}`, details);
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      logger.info(component, `${action}_success`, `Action ${action} réussie`, {
        ...details,
        duration_ms: duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error(component, `${action}_error`, `Erreur lors de l'action ${action}`, {
        ...details,
        error_message: error.message,
        error_stack: error.stack,
        duration_ms: duration
      });
      
      throw error;
    }
  }
}
