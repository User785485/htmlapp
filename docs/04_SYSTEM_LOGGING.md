# ud83dudcca Systu00e8me de Logging Complet - HTML Personalizer V2

## Vue d'ensemble

Le systu00e8me de logging capture **ABSOLUMENT TOUT** ce qui se passe dans l'application, u00e0 tous les niveaux, avec sauvegarde automatique dans Supabase.

## ud83cudfa5 Ce qui est capturu00e9

### 1. **Erreurs globales**
- u2705 Erreurs JavaScript non gu00e9ru00e9es (client)
- u2705 Exceptions non capturu00e9es (serveur)
- u2705 Promesses rejetu00e9es non gu00e9ru00e9es
- u2705 Erreurs React (ErrorBoundary)
- u2705 Erreurs de syntaxe et runtime

### 2. **Requu00eates HTTP**
- u2705 Toutes les requu00eates API (mu00e9thode, URL, duru00e9e)
- u2705 Corps des requu00eates (sanitizu00e9)
- u2705 Codes de ru00e9ponse et erreurs
- u2705 Headers et mu00e9tadonnu00e9es
- u2705 Request ID unique pour trau00e7abilitu00e9

### 3. **Performance**
- u2705 Temps de ru00e9ponse des API
- u2705 Duru00e9e des opu00e9rations mu00e9tier
- u2705 Web Vitals (LCP, FID, CLS)
- u2705 Temps de rendu des composants
- u2705 Du00e9tection des rendus lents

### 4. **Actions utilisateur**
- u2705 Clics sur boutons/liens
- u2705 Upload de fichiers
- u2705 Changements de formulaire
- u2705 Navigation entre pages
- u2705 Tu00e9lu00e9chargements

### 5. **Opu00e9rations mu00e9tier**
- u2705 Gu00e9nu00e9ration de documents (succu00e8s/u00e9chec)
- u2705 Publication GitHub
- u2705 Opu00e9rations Supabase
- u2705 Parsing CSV
- u2705 Export de donnu00e9es

### 6. **Ru00e9seau**
- u2705 Statut de connexion (online/offline)
- u2705 Type de connexion (4G, WiFi, etc.)
- u2705 Du00e9tection connexion lente
- u2705 Retry automatique des requu00eates
- u2705 Queue de requu00eates hors ligne

## ud83dudcdd Structure d'un log

```typescript
{
  id: "uuid",
  timestamp: "2024-01-15T10:30:00Z",
  level: "info|debug|warn|error|fatal",
  component: "API_GENERATE|SUPABASE|GITHUB|...",
  action: "process_start|fetch_data|error|...",
  message: "Description lisible",
  details: {
    // Donnu00e9es contextuelles (sanitizu00e9es)
  },
  error_stack: "Stack trace si erreur",
  client_email: "email@client.com",
  request_id: "req_12345",
  session_id: "session_67890",
  duration_ms: 234,
  environment: "development|production"
}
```

## ud83dudee0ufe0f Utilisation dans le code

### 1. **Dans les composants React**

```typescript
import { useLogging } from '@/lib/hooks/useLogging';

function MyComponent() {
  const { logAction, logClick, logError, logAsync } = useLogging({
    component: 'MyComponent'
  });
  
  // Logger un clic
  const handleClick = () => {
    logClick('submit_button', { form: 'contact' });
  };
  
  // Logger une opu00e9ration async
  const fetchData = () => {
    logAsync('fetch_user_data', async () => {
      const data = await api.getUser();
      return data;
    });
  };
}
```

### 2. **Dans les API routes**

```typescript
import { withApiLogging } from '@/lib/api-utils';

export const POST = withApiLogging('API_NAME', async (request, context) => {
  // Tout est automatiquement loggu00e9
  // context.requestId disponible
});
```

### 3. **Logging manuel**

```typescript
import { logger } from '@/lib/logger';

// Diffu00e9rents niveaux
logger.debug('COMPONENT', 'action', 'Message debug');
logger.info('COMPONENT', 'action', 'Message info');
logger.warn('COMPONENT', 'action', 'Avertissement');
logger.error('COMPONENT', 'action', 'Erreur', { error });
logger.fatal('COMPONENT', 'action', 'Erreur fatale');

// Mesurer le temps
await logger.measureTime('COMPONENT', 'operation', async () => {
  // Code u00e0 mesurer
});
```

## ud83dudd0d Consultation des logs

### 1. **Interface web**
- Bouton "Voir les logs" dans l'application
- Filtrage par niveau, composant, date
- Export CSV
- Statistiques visuelles

### 2. **CLI - Visualiseur**
```bash
# Tous les logs
npm run logs

# Temps ru00e9el
npm run logs:follow

# Filtrer
node scripts/logs-viewer.js --level error --component API
```

### 3. **CLI - Monitoring**
```bash
# Dashboard complet
npm run monitor

# Alertes uniquement
node scripts/monitor.js --alerts-only
```

### 4. **Requu00eates Supabase directes**
```sql
-- Erreurs des derniu00e8res 24h
SELECT * FROM application_logs 
WHERE level IN ('error', 'fatal') 
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Performance API
SELECT 
  component,
  action,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as count
FROM application_logs
WHERE duration_ms IS NOT NULL
GROUP BY component, action
ORDER BY avg_duration DESC;
```

## ud83euddf9 Maintenance

### Nettoyage automatique
```bash
# Configurer
node scripts/cleanup-logs.js setup

# Nettoyer manuellement
npm run cleanup

# Avec archivage
node scripts/cleanup-logs.js --archive --days 30
```

### Politique de ru00e9tention
- Logs `debug` : 7 jours
- Logs `info` : 30 jours
- Logs `warn` : 90 jours
- Logs `error`/`fatal` : 1 an

## u26a1 Performance

### Optimisations
- **Buffer** : Les logs sont bufferisu00e9s et envoyu00e9s par batch
- **Async** : Logging non-bloquant
- **Sanitization** : Donnu00e9es sensibles automatiquement masquu00e9es
- **Compression** : Du00e9tails en JSONB compressu00e9

### Impact minimal
- < 1ms pour un log standard
- Buffer de 10 secondes
- Retry automatique en cas d'u00e9chec

## ud83dudd14 Alertes automatiques

Le systu00e8me du00e9tecte et alerte pour :
- Plus de 10 erreurs en 5 minutes
- Requu00eates > 5 secondes
- Taux d'erreur > 5%
- Client hors ligne
- Espace disque Supabase > 80%

## ud83dudd10 Su00e9curitu00e9

### Donnu00e9es sanitizu00e9es
Les champs suivants sont automatiquement masquu00e9s :
- `password`, `token`, `key`, `secret`
- Headers `Authorization`
- Donnu00e9es de carte bancaire
- Tokens d'API

### Exemple
```javascript
// Input
{ password: "123456", email: "test@test.com" }

// Loggu00e9 comme
{ password: "[REDACTED]", email: "test@test.com" }
```

## ud83dudcca Mu00e9triques clu00e9s

### Dashboard temps ru00e9el
- Logs par niveau (graphique)
- Performance API (ligne)
- Erreurs ru00e9centes (tableau)
- Statistiques 24h

### KPIs surveillu00e9s
- **Uptime** : % sans erreur fatale
- **Performance** : P50, P95, P99 des temps de ru00e9ponse
- **Taux d'erreur** : Par endpoint et global
- **Utilisation** : Requu00eates/minute

## ud83dudee0 Troubleshooting

### Logs non envoyu00e9s
1. Vu00e9rifier la connexion Supabase
2. Vu00e9rifier les clu00e9s d'API
3. Consulter la console navigateur
4. Vu00e9rifier le buffer local

### Performance du00e9gradu00e9e
1. Ru00e9duire le niveau de log en production
2. Augmenter l'intervalle de flush
3. Nettoyer les anciens logs

### Espace insuffisant
1. Exu00e9cuter le cleanup
2. Archiver les anciens logs
3. Ajuster la ru00e9tention

## ud83cudfa5 Best Practices

### DO u2705
- Logger les actions mu00e9tier importantes
- Inclure le contexte nu00e9cessaire
- Utiliser le bon niveau de log
- Mesurer les opu00e9rations critiques

### DON'T u274c
- Logger des donnu00e9es sensibles
- Logger dans des boucles serru00e9es
- Utiliser `console.log` en production
- Ignorer les erreurs

## ud83dudcc8 u00c9volutions futures

- [ ] Intu00e9gration Sentry/DataDog
- [ ] Alertes par email/SMS
- [ ] Dashboard Grafana
- [ ] Export vers S3
- [ ] Machine Learning pour du00e9tection d'anomalies
