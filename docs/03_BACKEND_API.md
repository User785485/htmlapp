# ud83cudf10 Backend et API - HTML Personalizer V2

## ud83dudd0d Vue d'ensemble

Le backend de HTML Personalizer V2 est construit sur Next.js 14 avec le systu00e8me d'API Routes, fournissant une API RESTful pour gu00e9rer la gu00e9nu00e9ration de documents, la publication GitHub, et l'interaction avec Supabase.

## ud83dudcdd Structure des API Routes

```
app/api/
u251cu2500u2500 generate/
u2502   u2514u2500u2500 route.ts       # Endpoint principal de gu00e9nu00e9ration de documents
u251cu2500u2500 github/
u2502   u251cu2500u2500 test/
u2502   u2502   u2514u2500u2500 route.ts   # Test de connexion GitHub
u2502   u2514u2500u2500 publish/
u2502       u2514u2500u2500 route.ts   # Publication manuelle sur GitHub
u251cu2500u2500 logs/
u2502   u2514u2500u2500 route.ts       # Gestion des logs d'application
u251cu2500u2500 status/
u2502   u2514u2500u2500 route.ts       # u00c9tat de l'application et statistiques
u2514u2500u2500 supabase/
    u251cu2500u2500 clients/
    u2502   u2514u2500u2500 route.ts   # Gestion des clients dans Supabase
    u2514u2500u2500 documents/
        u2514u2500u2500 route.ts   # Gestion des documents dans Supabase
```

## ud83dudcad API Routes du00e9taillu00e9es

### `POST /api/generate`

Endpoint principal qui orchestre tout le processus de gu00e9nu00e9ration de documents.

```typescript
// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-utils';
import { CSVParser } from '@/lib/csv-parser';
import { DocumentGenerator } from '@/lib/document-generator';
import { GitHubPublisher } from '@/lib/github-publisher';
import { supabaseAdmin } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

export const POST = withApiLogging('API_GENERATE', async (request) => {
  const startTime = Date.now();
  const data = await request.json();
  const { csvData } = data;
  
  // Validation
  if (!csvData || !csvData.data || !Array.isArray(csvData.data)) {
    return NextResponse.json(
      { error: 'Donnu00e9es CSV invalides' },
      { status: 400 }
    );
  }
  
  try {
    // Initialisation
    await DocumentGenerator.loadTemplates();
    const githubPublisher = new GitHubPublisher();
    const results = [];
    
    // Traiter chaque client
    for (const clientData of csvData.data) {
      // Gu00e9nu00e9rer les documents
      // Publier sur GitHub
      // Sauvegarder dans Supabase
      // ...
    }
    
    // Ru00e9sultat final
    const duration = Date.now() - startTime;
    logger.info('API_GENERATE', 'process_complete', 'Gu00e9nu00e9ration terminu00e9e', {
      total_clients: csvData.data.length,
      success_count: results.filter(r => r.success).length,
      error_count: results.filter(r => !r.success).length,
      duration_ms: duration,
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    // Gestion des erreurs
    logger.error('API_GENERATE', 'process_error', 'Erreur lors de la gu00e9nu00e9ration', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: 'Erreur lors de la gu00e9nu00e9ration de documents' },
      { status: 500 }
    );
  }
});
```

Point clu00e9s :
- Utilise `withApiLogging` pour la tracu00e7abilitu00e9
- Valide les donnu00e9es d'entru00e9e
- Orchestre les services : `DocumentGenerator`, `GitHubPublisher`, Supabase
- Gestion des erreurs et journalisation complu00e8te

### `GET/POST /api/logs`

Gestion des logs de l'application.

```typescript
// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase-client';

// Ru00e9cupu00e9rer les logs
export const GET = withApiLogging('API_LOGS', async (request) => {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const component = searchParams.get('component');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  let query = supabaseAdmin
    .from('application_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);
  
  if (level) {
    query = query.eq('level', level);
  }
  
  if (component) {
    query = query.eq('component', component);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ logs: data, count });
});

// Supprimer des logs
export const DELETE = withApiLogging('API_LOGS', async (request) => {
  const { searchParams } = new URL(request.url);
  const before = searchParams.get('before'); // Date ISO
  const level = searchParams.get('level');
  
  if (!before) {
    return NextResponse.json(
      { error: 'Paramu00e8tre "before" requis' },
      { status: 400 }
    );
  }
  
  let query = supabaseAdmin
    .from('application_logs')
    .delete()
    .lt('timestamp', before);
  
  if (level) {
    query = query.eq('level', level);
  }
  
  const { error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ deleted: count });
});
```

Point clu00e9s :
- Filtrage par niveau, composant, date
- Pagination avec limit/offset
- Su00e9curisu00e9 avec validation des paramu00e8tres
- Nettoyage des logs anciens avec filtres

### `GET /api/status`

Fournit des informations sur l'u00e9tat de l'application.

```typescript
// app/api/status/route.ts
import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase-client';
import { GitHubPublisher } from '@/lib/github-publisher';

export const GET = withApiLogging('API_STATUS', async () => {
  try {
    // Vu00e9rifier la connexion Supabase
    const { data: supabaseCheck, error: supabaseError } = await supabaseAdmin
      .from('generated_documents')
      .select('id', { count: 'exact', head: true });
    
    // Vu00e9rifier la connexion GitHub
    const githubPublisher = new GitHubPublisher();
    const githubConnected = await githubPublisher.testConnection();
    
    // Ru00e9cupu00e9rer les statistiques
    const { data: stats, error: statsError } = await supabaseAdmin.rpc(
      'get_application_stats'
    );
    
    return NextResponse.json({
      status: 'ok',
      supabase: {
        connected: !supabaseError,
        error: supabaseError ? supabaseError.message : null,
      },
      github: {
        connected: githubConnected,
      },
      stats: stats || {
        total_clients: 0,
        total_documents: 0,
        documents_by_type: {},
      },
      version: process.env.APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
});
```

Point clu00e9s :
- Vu00e9rification de santu00e9 des services (Supabase, GitHub)
- Statistiques d'utilisation
- Informations sur la version et l'environnement

## ud83duddddufe0f Middleware

Le middleware Next.js traite toutes les requu00eates entrantes pour ajouter des fonctionnalitu00e9s transversales :

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';

export function middleware(request: NextRequest) {
  // Gu00e9nu00e9rer un ID unique pour cette requu00eate
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Ajouter l'ID de requu00eate aux headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // Logger la requu00eate entrante
  logger.debug('MIDDLEWARE', 'request_start', `${request.method} ${request.nextUrl.pathname}`, {
    method: request.method,
    url: request.url,
    path: request.nextUrl.pathname,
    ip: request.ip,
    request_id: requestId,
  });
  
  // Mesurer le temps de ru00e9ponse
  const startTime = Date.now();
  
  // Ajouter des headers de su00e9curitu00e9
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Mesurer le temps de ru00e9ponse en fin de middleware
  const duration = Date.now() - startTime;
  logger.debug('MIDDLEWARE', 'request_middleware_end', `Middleware terminu00e9 en ${duration}ms`, {
    duration_ms: duration,
    request_id: requestId,
  });
  
  return response;
}

// Configuration du middleware
export const config = {
  matcher: [
    // Appliquer u00e0 toutes les routes API
    '/api/:path*',
    // Exclure les ressources statiques
    '/((?!_next/static|favicon.ico).*)',
  ],
};
```

Point clu00e9s :
- Gu00e9nu00e9ration d'ID de requu00eate unique pour la trau00e7abilitu00e9
- Ajout de headers de su00e9curitu00e9
- Mesure de la performance des requu00eates
- Logging de chaque requu00eate entrante

## ud83dudcdd Utilitaires API

### `api-utils.ts`

Collection d'utilitaires pour les API routes :

```typescript
// lib/api-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodSchema } from 'zod';

type ApiHandler = (request: NextRequest, context: any) => Promise<NextResponse>;

// Wrapper de logging pour les routes API
export function withApiLogging(
  component: string,
  handler: ApiHandler
) {
  return async (request: NextRequest, context: any) => {
    const requestId = request.headers.get('x-request-id') || logger.generateRequestId();
    const startTime = Date.now();
    
    try {
      // Logger le du00e9but de la requu00eate
      logger.debug(component, 'request_start', `${request.method} ${request.nextUrl.pathname}`, {
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
        request_id: requestId,
      });
      
      // Exu00e9cuter le handler
      const response = await handler(request, {
        ...context,
        requestId,
      });
      
      // Calculer la duru00e9e
      const duration = Date.now() - startTime;
      
      // Logger la fin de la requu00eate
      logger.info(component, 'request_complete', `${request.method} ${request.nextUrl.pathname} ${response.status}`, {
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration_ms: duration,
        request_id: requestId,
      });
      
      return response;
    } catch (error) {
      // Calculer la duru00e9e
      const duration = Date.now() - startTime;
      
      // Logger l'erreur
      logger.error(component, 'request_error', `Erreur API: ${error instanceof Error ? error.message : error}`, {
        method: request.method,
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
        request_id: requestId,
      });
      
      // Retourner une ru00e9ponse d'erreur
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      );
    }
  };
}

// Validation du body avec Zod
export function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; valid: true } | { error: string; valid: false }> {
  return request.json()
    .then(body => {
      const result = schema.safeParse(body);
      if (result.success) {
        return { data: result.data, valid: true };
      }
      return { error: result.error.message, valid: false };
    })
    .catch(error => {
      return { error: 'Erreur de parsing JSON', valid: false };
    });
}
```

Point clu00e9s :
- Wrapper pour standardiser le logging des API routes
- Mesure de performance pour chaque requu00eate
- Validation des corps de requu00eate avec Zod
- Gestion standardisu00e9e des erreurs

## ud83dudee0ufe0f Services backend

### `DocumentGenerator`

Service pour gu00e9nu00e9rer des documents HTML personnalisu00e9s :

```typescript
// lib/document-generator.ts
import { ClientData, DocumentType } from './types';
import { logger } from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DocumentGenerator {
  private static protectionTemplate: string | null = null;
  private static templates: Map<DocumentType, string> = new Map();
  
  // Charge tous les templates au du00e9marrage
  static async loadTemplates(): Promise<void> { /* ... */ }
  
  // Gu00e9nu00e8re un document HTML personnalisu00e9
  static generateDocument(client: ClientData, type: DocumentType): string { /* ... */ }
  
  // Ajoute la protection par mot de passe
  static addPasswordProtection(html: string, accessCode: string): string { /* ... */ }
  
  // Gu00e9nu00e8re un nom de fichier unique pour un document
  static generateFilename(client: ClientData, type: DocumentType): string { /* ... */ }
  
  // Pru00e9pare les variables pour le template
  private static prepareVariables(client: ClientData, type: DocumentType): Record<string, string> { /* ... */ }
}
```

### `GitHubPublisher`

Service pour publier des documents sur GitHub Pages :

```typescript
// lib/github-publisher.ts
import { Octokit } from '@octokit/rest';
import { DocumentType } from './types';
import { logger } from './logger';

export class GitHubPublisher {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseUrl: string;
  
  constructor() { /* ... */ }
  
  // Publie un fichier sur GitHub
  async publishFile(path: string, content: string, message: string): Promise<string> { /* ... */ }
  
  // Publie tous les documents d'un client
  async publishClientDocuments(
    clientEmail: string,
    documents: Record<DocumentType, { content: string; filename: string }>
  ): Promise<Record<DocumentType, string>> { /* ... */ }
  
  // Met u00e0 jour la page d'index
  async updateIndexPage(stats: { totalClients: number; totalDocuments: number; lastUpdate: string }): Promise<void> { /* ... */ }
  
  // Vu00e9rifie la connexion GitHub
  async testConnection(): Promise<boolean> { /* ... */ }
}
```

### `CSVParser`

Service pour parser et valider les fichiers CSV :

```typescript
// lib/csv-parser.ts
import Papa from 'papaparse';
import { ClientData } from './types';
import { logger } from './logger';

export class CSVParser {
  // Parse un fichier CSV et valide les donnu00e9es
  static parseClientData(csvContent: string): { valid: true; data: ClientData[] } | { valid: false; errors: string[] } { /* ... */ }
  
  // Valide un client individuel
  static validateClient(client: any, rowIndex: number): { valid: true; data: ClientData } | { valid: false; errors: string[] } { /* ... */ }
  
  // Gu00e9nu00e8re un CSV avec les ru00e9sultats
  static generateResultsCSV(results: any[]): string { /* ... */ }
}
```

## ud83duddfaufe0f Schu00e9ma de base de donnu00e9es

### Table `generated_documents`

```sql
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('vente', 'compte-rendu', 'onboarding')),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE (client_email, document_type)
);

CREATE INDEX idx_generated_documents_client_email ON generated_documents (client_email);
CREATE INDEX idx_generated_documents_document_type ON generated_documents (document_type);
CREATE INDEX idx_generated_documents_created_at ON generated_documents (created_at);
```

### Table `application_logs`

```sql
CREATE TABLE application_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  component TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT NULL,
  error_stack TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL,
  client_email TEXT DEFAULT NULL,
  request_id TEXT DEFAULT NULL,
  session_id TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL,
  status_code INTEGER DEFAULT NULL,
  environment TEXT DEFAULT 'development'
);

CREATE INDEX idx_application_logs_timestamp ON application_logs (timestamp DESC);
CREATE INDEX idx_application_logs_level ON application_logs (level);
CREATE INDEX idx_application_logs_component ON application_logs (component);
```

## ud83dudee0ufe0f Performance backend

### Optimisations

- **Traitement par batch** pour la gu00e9nu00e9ration de documents
- **Caching des templates** pour u00e9viter les lectures disque ru00e9pu00e9tu00e9es
- **Retry avec backoff exponentiel** pour les opu00e9rations GitHub
- **Bulk operations** pour les insertions Supabase
- **Logging asynchrone** pour ne pas bloquer les requu00eates

### Limites et considu00e9rations

- GitHub API a des limites de rate (5000 requu00eates/heure)
- Taille maximale des fichiers GitHub : 100MB
- Du00e9lai de propagation GitHub Pages : ~5-10 minutes
- Nombre maximal de clients traitu00e9s par batch : 100

## ud83dudca1 Points d'extension backend

- **Webhooks** pour notifications externes (Slack, Discord, etc.)
- **Files d'attente** pour le traitement asynchrone
- **Cache distribuu00e9** pour amu00e9liorer les performances
- **API versioning** pour u00e9volution future

---

Voir les autres fichiers de documentation pour des informations du00e9taillu00e9es sur les autres aspects de l'application.
