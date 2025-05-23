import { supabaseAdmin } from './supabase-client';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  action: string;
  message: string;
  details?: any;
  error_stack?: string;
  user_email?: string;
  client_email?: string;
  request_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  duration_ms?: number;
  status_code?: number;
  environment: string;
}

class Logger {
  private static instance: Logger;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionId: string;
  private requestCounter = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId(): string {
    this.requestCounter++;
    return `req_${this.sessionId}_${this.requestCounter}_${Date.now()}`;
  }

  private setupGlobalErrorHandlers() {
    // Capturer les erreurs non gérées côté serveur
    if (typeof window === 'undefined') {
      process.on('uncaughtException', (error) => {
        this.fatal('SYSTEM', 'uncaughtException', 'Erreur non gérée détectée', {
          error: error.message,
          stack: error.stack,
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.fatal('SYSTEM', 'unhandledRejection', 'Promise rejetée non gérée', {
          reason,
          promise: promise.toString(),
        });
      });
    } else {
      // Capturer les erreurs côté client
      window.addEventListener('error', (event) => {
        this.error('CLIENT', 'windowError', 'Erreur JavaScript non gérée', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('CLIENT', 'unhandledRejection', 'Promise rejetée non gérée', {
          reason: event.reason,
        });
      });
    }
  }

  private async log(
    level: LogLevel,
    component: string,
    action: string,
    message: string,
    details?: any
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      message,
      details: details ? this.sanitizeDetails(details) : undefined,
      error_stack: details?.stack || details?.error?.stack,
      environment: process.env.NODE_ENV || 'development',
      session_id: this.sessionId,
    };

    // Ajouter les infos de contexte si disponibles
    if (typeof window !== 'undefined') {
      entry.user_agent = navigator.userAgent;
    }

    // Log dans la console en développement
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    }

    // Ajouter au buffer
    this.buffer.push(entry);

    // Flush immédiatement pour les erreurs critiques
    if (level === 'error' || level === 'fatal') {
      await this.flush();
    }
  }

  private sanitizeDetails(details: any): any {
    try {
      // Retirer les données sensibles
      const sanitized = JSON.parse(JSON.stringify(details));
      
      // Liste des clés sensibles à masquer
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];
      
      const sanitizeObject = (obj: any) => {
        for (const key in obj) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      };
      
      sanitizeObject(sanitized);
      return sanitized;
    } catch (error) {
      return { originalType: typeof details, error: 'Failed to sanitize' };
    }
  }

  private consoleLog(entry: LogEntry) {
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336',
      fatal: 'color: #D32F2F; font-weight: bold',
    };

    const prefix = `[${entry.timestamp}] [${entry.component}] ${entry.action}`;
    
    console.log(
      `%c${prefix}: ${entry.message}`,
      styles[entry.level]
    );
    
    if (entry.details) {
      console.log('Details:', entry.details);
    }
    
    if (entry.error_stack) {
      console.log('Stack:', entry.error_stack);
    }
  }

  private startFlushInterval() {
    // Flush les logs toutes les 10 secondes
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      // Sauvegarder dans Supabase
      const { error } = await supabaseAdmin
        .from('application_logs')
        .insert(logsToFlush);

      if (error) {
        // En cas d'erreur, remettre les logs dans le buffer
        this.buffer = [...logsToFlush, ...this.buffer];
        console.error('Erreur lors de la sauvegarde des logs:', error);
      }
    } catch (error) {
      // En cas d'erreur réseau, remettre les logs dans le buffer
      this.buffer = [...logsToFlush, ...this.buffer];
      console.error('Erreur réseau lors de la sauvegarde des logs:', error);
    }
  }

  // Méthodes publiques pour chaque niveau de log
  debug(component: string, action: string, message: string, details?: any) {
    this.log('debug', component, action, message, details);
  }

  info(component: string, action: string, message: string, details?: any) {
    this.log('info', component, action, message, details);
  }

  warn(component: string, action: string, message: string, details?: any) {
    this.log('warn', component, action, message, details);
  }

  error(component: string, action: string, message: string, details?: any) {
    this.log('error', component, action, message, details);
  }

  fatal(component: string, action: string, message: string, details?: any) {
    this.log('fatal', component, action, message, details);
  }

  // Méthode pour mesurer la durée d'une opération
  async measureTime<T>(
    component: string,
    action: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.debug(component, `${action}_start`, `Début de l'opération ${action}`);
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.info(component, `${action}_success`, `Opération ${action} réussie`, {
        duration_ms: duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(component, `${action}_error`, `Erreur lors de ${action}`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      });
      
      throw error;
    }
  }

  // Logger pour les requêtes API
  logApiRequest(
    method: string,
    path: string,
    body?: any,
    headers?: any,
    requestId?: string
  ) {
    this.info('API', 'request', `${method} ${path}`, {
      method,
      path,
      body: this.sanitizeDetails(body),
      headers: this.sanitizeDetails(headers),
      request_id: requestId,
    });
  }

  logApiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    error?: any
  ) {
    const level = statusCode >= 400 ? 'error' : 'info';
    
    this.log(level, 'API', 'response', `${method} ${path} - ${statusCode}`, {
      method,
      path,
      status_code: statusCode,
      duration_ms: duration,
      request_id: requestId,
      error: error ? this.sanitizeDetails(error) : undefined,
    });
  }

  // Logger pour les opérations de génération
  logGeneration(
    clientEmail: string,
    documentType: string,
    success: boolean,
    details?: any
  ) {
    const level = success ? 'info' : 'error';
    const action = `generate_${documentType}`;
    const message = success 
      ? `Document ${documentType} généré avec succès`
      : `Échec de génération du document ${documentType}`;
    
    this.log(level, 'GENERATOR', action, message, {
      client_email: clientEmail,
      document_type: documentType,
      success,
      ...details,
    });
  }

  // Logger pour les opérations Supabase
  logSupabase(
    operation: string,
    table: string,
    success: boolean,
    details?: any
  ) {
    const level = success ? 'debug' : 'error';
    const message = `Opération Supabase ${operation} sur ${table}`;
    
    this.log(level, 'SUPABASE', operation, message, {
      table,
      success,
      ...details,
    });
  }

  // Logger pour les opérations GitHub
  logGitHub(
    operation: string,
    path: string,
    success: boolean,
    details?: any
  ) {
    const level = success ? 'info' : 'error';
    const message = `Opération GitHub ${operation} sur ${path}`;
    
    this.log(level, 'GITHUB', operation, message, {
      path,
      success,
      ...details,
    });
  }

  // Nettoyer avant la fermeture
  async cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

// Export de l'instance unique
export const logger = Logger.getInstance();

// Créer la table de logs dans Supabase
export const createLogsTableSQL = `
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  level VARCHAR(10) NOT NULL,
  component VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  error_stack TEXT,
  user_email VARCHAR(255),
  client_email VARCHAR(255),
  request_id VARCHAR(100),
  session_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  duration_ms INTEGER,
  status_code INTEGER,
  environment VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX idx_logs_level ON application_logs(level);
CREATE INDEX idx_logs_component ON application_logs(component);
CREATE INDEX idx_logs_client_email ON application_logs(client_email);
CREATE INDEX idx_logs_request_id ON application_logs(request_id);
CREATE INDEX idx_logs_session_id ON application_logs(session_id);

-- Politique de rétention (optionnel - supprimer les logs de plus de 90 jours)
-- CREATE OR REPLACE FUNCTION delete_old_logs() RETURNS void AS $$
-- BEGIN
--   DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql;
`;