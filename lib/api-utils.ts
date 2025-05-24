import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
  body?: any; // Ajout du body au contexte
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

/**
 * Wrapper pour les routes API qui ajoute automatiquement :
 * - Logging des requêtes/réponses
 * - Gestion des erreurs
 * - Mesure du temps de réponse
 * - Validation des données
 */
export function withApiLogging(
  component: string,
  handler: ApiHandler
) {
  return async (request: NextRequest) => {
    const requestId = request.headers.get('x-request-id') || logger.generateRequestId();
    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    
    let body = null;
    
    try {
      // Logger la requête entrante
      const contentType = request.headers.get('content-type');
      
      // Cloner la requête pour pouvoir lire le body sans le consommer
      const clonedRequest = request.clone();
      
      if (contentType?.includes('application/json')) {
        try {
          body = await clonedRequest.json();
        } catch (e) {
          logger.warn(component, 'parse_body', 'Impossible de parser le body JSON', {
            error: e,
            request_id: requestId,
          });
        }
      }
      
      logger.logApiRequest(method, path, body, Object.fromEntries(request.headers), requestId);
      
      const context: ApiContext = {
        requestId,
        startTime,
        method,
        path,
        body, // Passer le body dans le contexte
      };
      
      // Appeler le handler principal avec la requête originale
      const response = await handler(request, context);
      
      // Logger la réponse
      const duration = Date.now() - startTime;
      logger.logApiResponse(method, path, response.status, duration, requestId);
      
      // Ajouter des headers à la réponse
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-response-time', `${duration}ms`);
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Logger l'erreur complète
      logger.error(component, 'api_error', `Erreur dans ${method} ${path}`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        request_id: requestId,
        duration_ms: duration,
        method,
        path,
      });
      
      // Déterminer le code d'erreur approprié
      let status = 500;
      let message = 'Erreur interne du serveur';
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          status = 401;
          message = 'Non autorisé';
        } else if (error.message.includes('Forbidden')) {
          status = 403;
          message = 'Accès interdit';
        } else if (error.message.includes('Not found')) {
          status = 404;
          message = 'Ressource non trouvée';
        } else if (error.message.includes('Bad request')) {
          status = 400;
          message = 'Requête invalide';
        } else if (error.message.includes('Rate limit')) {
          status = 429;
          message = 'Trop de requêtes';
        }
      }
      
      // Retourner une réponse d'erreur
      const errorResponse = NextResponse.json(
        {
          error: message,
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error))
            : message,
          request_id: requestId,
          timestamp: new Date().toISOString(),
        },
        { status }
      );
      
      errorResponse.headers.set('x-request-id', requestId);
      errorResponse.headers.set('x-response-time', `${duration}ms`);
      
      return errorResponse;
    }
  };
}

/**
 * Wrapper pour valider les données de requête
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: {
    [K in keyof T]: {
      required?: boolean;
      type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
      validator?: (value: any) => boolean;
      message?: string;
    };
  }
): Promise<T> {
  try {
    const body = await request.json();
    const errors: string[] = [];
    const validated: any = {};
    
    // Vérifier chaque champ selon le schéma
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      
      // Vérifier si requis
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Le champ '${field}' est requis`);
        continue;
      }
      
      // Si pas requis et absent, passer
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Vérifier le type
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`Le champ '${field}' doit être de type ${rules.type}`);
          continue;
        }
      }
      
      // Validation personnalisée
      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `Le champ '${field}' est invalide`);
        continue;
      }
      
      validated[field] = value;
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation échouée: ${errors.join(', ')}`);
    }
    
    return validated as T;
    
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation échouée:')) {
      throw error;
    }
    throw new Error('Bad request: Corps de requête invalide');
  }
}

/**
 * Wrapper pour mesurer le temps d'exécution d'une fonction
 */
export async function measureExecutionTime<T>(
  component: string,
  action: string,
  fn: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const startTime = Date.now();
  
  try {
    logger.debug(component, `${action}_start`, `Début: ${action}`, metadata);
    
    const result = await fn();
    
    const duration = Date.now() - startTime;
    logger.info(component, `${action}_success`, `Succès: ${action}`, {
      ...metadata,
      duration_ms: duration,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(component, `${action}_error`, `Erreur: ${action}`, {
      ...metadata,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: duration,
    });
    
    throw error;
  }
}

/**
 * Décorateur pour logger automatiquement les appels de fonction
 */
export function logMethod(component: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const action = propertyName;
      
      try {
        logger.debug(component, `${action}_call`, `Appel de ${action}`, {
          args: args.length > 0 ? args : undefined,
        });
        
        const result = await originalMethod.apply(this, args);
        
        logger.debug(component, `${action}_return`, `Retour de ${action}`, {
          duration_ms: Date.now() - startTime,
        });
        
        return result;
      } catch (error) {
        logger.error(component, `${action}_throw`, `Exception dans ${action}`, {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          duration_ms: Date.now() - startTime,
          args: args.length > 0 ? args : undefined,
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}