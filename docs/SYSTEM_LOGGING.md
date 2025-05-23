# 📊 Système de Logging Complet - HTML Personalizer V2

## Vue d'ensemble

Le système de logging capture **ABSOLUMENT TOUT** ce qui se passe dans l'application, à tous les niveaux, avec sauvegarde automatique dans Supabase.

## 🎯 Ce qui est capturé

### 1. **Erreurs globales**
- ✅ Erreurs JavaScript non gérées (client)
- ✅ Exceptions non capturées (serveur)
- ✅ Promesses rejetées non gérées
- ✅ Erreurs React (ErrorBoundary)
- ✅ Erreurs de syntaxe et runtime

### 2. **Requêtes HTTP**
- ✅ Toutes les requêtes API (méthode, URL, durée)
- ✅ Corps des requêtes (sanitizé)
- ✅ Codes de réponse et erreurs
- ✅ Headers et métadonnées
- ✅ Request ID unique pour traçabilité

### 3. **Performance**
- ✅ Temps de réponse des API
- ✅ Durée des opérations métier
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ Temps de rendu des composants
- ✅ Détection des rendus lents

### 4. **Actions utilisateur**
- ✅ Clics sur boutons/liens
- ✅ Upload de fichiers
- ✅ Changements de formulaire
- ✅ Navigation entre pages
- ✅ Téléchargements

### 5. **Opérations métier**
- ✅ Génération de documents (succès/échec)
- ✅ Publication GitHub
- ✅ Opérations Supabase
- ✅ Parsing CSV
- ✅ Export de données

### 6. **Réseau**
- ✅ Statut de connexion (online/offline)
- ✅ Type de connexion (4G, WiFi, etc.)
- ✅ Détection connexion lente
- ✅ Retry automatique des requêtes
- ✅ Queue de requêtes hors ligne

## 📝 Structure d'un log

```typescript
{
  id: "uuid",
  timestamp: "2024-01-15T10:30:00Z",
  level: "info|debug|warn|error|fatal",
  component: "API_GENERATE|SUPABASE|GITHUB|...",
  action: "process_start|fetch_data|error|...",
  message: "Description lisible",
  details: {
    // Données contextuelles (sanitizées)
  },
  error_stack: "Stack trace si erreur",
  client_email: "email@client.com",
  request_id: "req_12345",
  session_id: "session_67890",
  duration_ms: 234,
  environment: "development|production"
}
```

## 🛠️ Utilisation dans le code

### 1. **Dans les composants React**

```typescript
import { useLogging } from '@/hooks/useLogging';

function MyComponent() {
  const { logAction, logClick, logError, logAsync } = useLogging({
    component: 'MyComponent'
  });
  
  // Logger un clic
  const handleClick = () => {
    logClick('submit_button', { form: 'contact' });
  };
  
  // Logger une opération async
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
import { withApiLogging } from '@/lib/api-wrapper';

export const POST = withApiLogging('API_NAME', async (request, context) => {
  // Tout est automatiquement loggé
  // context.requestId disponible
});
```

### 3. **Logging manuel**

```typescript
import { logger } from '@/lib/logger';

// Différents niveaux
logger.debug('COMPONENT', 'action', 'Message debug');
logger.info('COMPONENT', 'action', 'Message info');
logger.warn('COMPONENT', 'action', 'Avertissement');
logger.error('COMPONENT', 'action', 'Erreur', { error });
logger.fatal('COMPONENT', 'action', 'Erreur fatale');

// Mesurer le temps
await logger.measureTime('COMPONENT', 'operation', async () => {
  // Code à mesurer
});
```

## 🔍 Consultation des logs

### 1. **Interface web**
- Bouton "Voir les logs" dans l'application
- Filtrage par niveau, composant, date
- Export CSV
- Statistiques visuelles

### 2. **CLI - Visualiseur**
```bash
# Tous les logs
npm run logs

# Temps réel
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

### 4. **Requêtes Supabase directes**
```sql
-- Erreurs des dernières 24h
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

## 🧹 Maintenance

### Nettoyage automatique
```bash
# Configurer
node scripts/cleanup-logs.js setup

# Nettoyer manuellement
npm run cleanup

# Avec archivage
node scripts/cleanup-logs.js --archive --days 30
```

### Politique de rétention
- Logs `debug` : 7 jours
- Logs `info` : 30 jours
- Logs `warn` : 90 jours
- Logs `error`/`fatal` : 1 an

## ⚡ Performance

### Optimisations
- **Buffer** : Les logs sont bufferisés et envoyés par batch
- **Async** : Logging non-bloquant
- **Sanitization** : Données sensibles automatiquement masquées
- **Compression** : Détails en JSONB compressé

### Impact minimal
- < 1ms pour un log standard
- Buffer de 10 secondes
- Retry automatique en cas d'échec

## 🚨 Alertes automatiques

Le système détecte et alerte pour :
- Plus de 10 erreurs en 5 minutes
- Requêtes > 5 secondes
- Taux d'erreur > 5%
- Client hors ligne
- Espace disque Supabase > 80%

## 🔐 Sécurité

### Données sanitizées
Les champs suivants sont automatiquement masqués :
- `password`, `token`, `key`, `secret`
- Headers `Authorization`
- Données de carte bancaire
- Tokens d'API

### Exemple
```javascript
// Input
{ password: "123456", email: "test@test.com" }

// Loggé comme
{ password: "[REDACTED]", email: "test@test.com" }
```

## 📊 Métriques clés

### Dashboard temps réel
- Logs par niveau (graphique)
- Performance API (ligne)
- Erreurs récentes (tableau)
- Statistiques 24h

### KPIs surveillés
- **Uptime** : % sans erreur fatale
- **Performance** : P50, P95, P99 des temps de réponse
- **Taux d'erreur** : Par endpoint et global
- **Utilisation** : Requêtes/minute

## 🔧 Troubleshooting

### Logs non envoyés
1. Vérifier la connexion Supabase
2. Vérifier les clés d'API
3. Consulter la console navigateur
4. Vérifier le buffer local

### Performance dégradée
1. Réduire le niveau de log en production
2. Augmenter l'intervalle de flush
3. Nettoyer les anciens logs

### Espace insuffisant
1. Exécuter le cleanup
2. Archiver les anciens logs
3. Ajuster la rétention

## 🎯 Best Practices

### DO ✅
- Logger les actions métier importantes
- Inclure le contexte nécessaire
- Utiliser le bon niveau de log
- Mesurer les opérations critiques

### DON'T ❌
- Logger des données sensibles
- Logger dans des boucles serrées
- Utiliser `console.log` en production
- Ignorer les erreurs

## 📈 Évolutions futures

- [ ] Intégration Sentry/DataDog
- [ ] Alertes par email/SMS
- [ ] Dashboard Grafana
- [ ] Export vers S3
- [ ] Machine Learning pour détection d'anomalies