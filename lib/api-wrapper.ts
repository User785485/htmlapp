// Wrapper pour les appels API
import { logger } from './logger';

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
