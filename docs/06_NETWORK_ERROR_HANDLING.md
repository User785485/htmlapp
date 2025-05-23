# ud83dudcf6 Gestion des Erreurs Ru00e9seau - HTML Personalizer V2

## Vue d'ensemble

L'application dispose d'un systu00e8me robuste de gu00e9ru00e9ation d'erreurs ru00e9seau, implemu00e9ntu00e9 via le hook `useNetworkError`. Ce systu00e8me permet de :

- u2705 Du00e9tecter l'u00e9tat de la connexion (en ligne, hors ligne)
- u2705 Mesurer la qualitu00e9 et la vitesse de la connexion
- u2705 Mettre en file d'attente les requu00eates en cas de probleu00e8me
- u2705 Ru00e9essayer automatiquement les opu00e9rations u00e9chouu00e9es
- u2705 Fournir des retours utilisateur adaptu00e9s aux proble9mes de connexion

## Hook `useNetworkError`

### Fonctionnalitu00e9s

```typescript
// Retourne les u00e9lu00e9ments suivants
export interface NetworkErrorState {
  isOnline: boolean;            // u00c9tat de connexion
  isSlowConnection: boolean;    // Du00e9tection de connexion lente
  lastOnlineTime: Date | null;  // Derniu00e8re fois en ligne
  connectionQuality: 'good' | 'fair' | 'poor' | 'unknown';  // Qualitu00e9
  errorMessage: string | null;  // Message d'erreur pour l'UI
  retryCount: number;           // Nombre de tentatives
  latency: number;              // Temps de ru00e9ponse en ms
}
```

### Utilisation

```tsx
import { useNetworkError } from '@/lib/hooks/useNetworkError';

function MyComponent() {
  const { 
    isOnline,
    isSlowConnection, 
    connectionQuality,
    errorMessage,
    retryOperation,
    checkConnection
  } = useNetworkError();
  
  // Exemple d'utilisation
  const handleSubmit = async () => {
    if (!isOnline) {
      // Afficher une alerte
      return;
    }
    
    try {
      await submitData();
    } catch (error) {
      // Essayer u00e0 nouveau avec backoff exponentiel
      retryOperation(() => submitData(), {
        maxRetries: 3,
        initialDelay: 1000
      });
    }
  };
  
  return (
    <div>
      {!isOnline && (
        <Alert type="warning">
          Vous u00eates hors ligne. Les donnu00e9es seront envoyu00e9es
          quand votre connexion sera ru00e9tablie.
        </Alert>
      )}
      
      {isSlowConnection && (
        <Alert type="info">
          Votre connexion est lente. Les opu00e9rations peuvent prendre plus de temps.
        </Alert>
      )}
      
      <Button onClick={handleSubmit}>
        Soumettre
      </Button>
    </div>
  );
}
```

## Fonctionnement interne

### 1. Du00e9tection de l'u00e9tat de connexion

```typescript
// u00c9coute des u00e9vu00e8nements de navigateur
useEffect(() => {
  const handleOnline = () => {
    setNetworkState(prev => ({
      ...prev,
      isOnline: true,
      lastOnlineTime: new Date(),
      errorMessage: null
    }));
    logger.info('NETWORK', 'connection_restored', 'Connexion internet ru00e9tablie');
  };

  const handleOffline = () => {
    setNetworkState(prev => ({
      ...prev,
      isOnline: false,
      errorMessage: 'Vous u00eates actuellement hors ligne'
    }));
    logger.warn('NETWORK', 'connection_lost', 'Connexion internet perdue');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### 2. Mesure de la qualitu00e9 de connexion

```typescript
const checkConnection = useCallback(async () => {
  try {
    const startTime = performance.now();
    
    // Requu00eate tu00e9moin vers un endpoint rapide
    const response = await fetch('/api/health-check', { 
      method: 'HEAD',
      cache: 'no-store' 
    });
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    // Du00e9terminer la qualitu00e9 en fonction de la latence
    let connectionQuality: ConnectionQuality = 'unknown';
    let isSlowConnection = false;
    
    if (latency < 100) {
      connectionQuality = 'good';
    } else if (latency < 300) {
      connectionQuality = 'fair';
    } else {
      connectionQuality = 'poor';
      isSlowConnection = true;
    }
    
    setNetworkState(prev => ({
      ...prev,
      isOnline: true,
      latency,
      connectionQuality,
      isSlowConnection,
      lastOnlineTime: new Date()
    }));
    
    logger.debug('NETWORK', 'connection_check', `Latence: ${latency}ms, Qualitu00e9: ${connectionQuality}`);
    
    return { latency, connectionQuality, isOnline: true };
  } catch (error) {
    logger.error('NETWORK', 'connection_check_failed', 'Erreur lors du test de connexion', { error });
    
    setNetworkState(prev => ({
      ...prev,
      isOnline: false,
      connectionQuality: 'unknown',
      errorMessage: 'Impossible de se connecter au serveur'
    }));
    
    return { latency: -1, connectionQuality: 'unknown', isOnline: false };
  }
}, []);
```

### 3. Ru00e9essai automatique avec backoff exponentiel

```typescript
const retryOperation = useCallback(async <T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> => {
  const { 
    maxRetries = 3,
    initialDelay = 1000,
    factor = 2,
    jitter = true
  } = options || {};
  
  let currentRetry = 0;
  let delay = initialDelay;
  
  setNetworkState(prev => ({ ...prev, retryCount: 0 }));
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      currentRetry++;
      
      if (currentRetry >= maxRetries) {
        logger.error('NETWORK', 'retry_exceeded', `Nombre maximal de tentatives atteint (${maxRetries})`, { error });
        setNetworkState(prev => ({ 
          ...prev,
          retryCount: currentRetry,
          errorMessage: `u00c9chec apru00e8s ${maxRetries} tentatives`
        }));
        throw error;
      }
      
      // Calculer le du00e9lai avec jitter pour u00e9viter les collisions
      const actualDelay = jitter 
        ? delay * 0.5 + delay * Math.random() * 0.5 
        : delay;
      
      logger.warn('NETWORK', 'retry_scheduled', `Nouvelle tentative ${currentRetry}/${maxRetries} dans ${actualDelay}ms`);
      
      setNetworkState(prev => ({ 
        ...prev,
        retryCount: currentRetry,
        errorMessage: `Nouvelle tentative ${currentRetry}/${maxRetries}...`
      }));
      
      // Attendre le du00e9lai
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      
      // Augmenter le du00e9lai pour la prochaine tentative
      delay *= factor;
    }
  }
}, []);
```

## Intu00e9gration dans les composants

### Exemple : Zone d'upload

```tsx
import { useNetworkError } from '@/lib/hooks/useNetworkError';
import { useDropzone } from 'react-dropzone';
import { Alert } from '@/components/Alert';

export function UploadZone({ onUpload }) {
  const { 
    isOnline, 
    isSlowConnection,
    connectionQuality,
    errorMessage 
  } = useNetworkError();
  
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (files) => {
      if (!isOnline) {
        return;
      }
      
      await onUpload(files);
    },
    disabled: !isOnline
  });
  
  return (
    <div className="upload-container">
      {!isOnline && (
        <Alert type="error">
          Vous u00eates hors ligne. L'upload n'est pas possible actuellement.
        </Alert>
      )}
      
      {isSlowConnection && (
        <Alert type="warning">
          Votre connexion est lente. L'upload pourrait prendre plus de temps que pu00e9vu.
        </Alert>
      )}
      
      <div 
        {...getRootProps()} 
        className={`dropzone ${!isOnline ? 'disabled' : ''} ${connectionQuality}`}
      >
        <input {...getInputProps()} />
        <p>Glissez-du00e9posez votre fichier CSV ici, ou cliquez pour su00e9lectionner</p>
        
        {connectionQuality !== 'unknown' && (
          <div className="connection-indicator">
            Qualitu00e9 de connexion: 
            <span className={`quality-${connectionQuality}`}>
              {connectionQuality === 'good' ? 'Bonne' : 
               connectionQuality === 'fair' ? 'Moyenne' : 'Faible'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

## File d'attente hors ligne

Le systu00e8me inclut u00e9galement une file d'attente pour les opu00e9rations hors ligne :

```typescript
interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  timestamp: number;
  retryCount: number;
}

const [operationQueue, setOperationQueue] = useState<QueuedOperation[]>([]);

// Ajouter une opu00e9ration u00e0 la file d'attente
const queueOperation = useCallback((operation: () => Promise<any>) => {
  const id = uuidv4();
  
  setOperationQueue(prev => [
    ...prev,
    {
      id,
      operation,
      timestamp: Date.now(),
      retryCount: 0
    }
  ]);
  
  logger.info('NETWORK', 'operation_queued', `Opu00e9ration ajoutu00e9e u00e0 la file d'attente: ${id}`);
  
  return id;
}, []);

// Exu00e9cuter les opu00e9rations en file d'attente quand on revient en ligne
useEffect(() => {
  if (isOnline && operationQueue.length > 0) {
    processQueue();
  }
}, [isOnline, operationQueue]);

const processQueue = async () => {
  if (operationQueue.length === 0) return;
  
  logger.info('NETWORK', 'processing_queue', `Traitement de ${operationQueue.length} opu00e9rations en file d'attente`);
  
  // Copier la file pour traitement
  const currentQueue = [...operationQueue];
  setOperationQueue([]);
  
  const results = [];
  
  for (const item of currentQueue) {
    try {
      const result = await retryOperation(item.operation, { maxRetries: 2 });
      results.push({ id: item.id, status: 'success', result });
    } catch (error) {
      logger.error('NETWORK', 'queued_operation_failed', `u00c9chec de l'opu00e9ration en file d'attente: ${item.id}`, { error });
      results.push({ id: item.id, status: 'error', error });
    }
  }
  
  return results;
};
```

## Bonnes pratiques

### DO u2705
- Utiliser `useNetworkError` pour toutes les opu00e9rations ru00e9seau critiques
- Afficher des messages adaptu00e9s en fonction de la qualitu00e9 de connexion
- Configurer des du00e9lais de tentatives adaptu00e9s aux opu00e9rations
- Mettre en file d'attente les opu00e9rations non critiques quand l'utilisateur est hors ligne

### DON'T u274c
- Bloquer l'interface utilisateur pendant les tentatives de reconnexion
- Utiliser des timeouts fixes sans backoff exponentiel
- Ignorer les proble9mes de ru00e9seau dans les opu00e9rations critiques
- Envoyer des requu00eates en boucle sans limite de tentatives

## Tests et simulation

Pour tester le comportement hors ligne :

1. Ouvrir les DevTools Chrome
2. Aller dans l'onglet "Network"
3. Du00e9cocher "Disable cache"
4. Su00e9lectionner "Offline" dans le menu du00e9roulant

Pour simuler une connexion lente :

1. Ouvrir les DevTools Chrome
2. Aller dans l'onglet "Network"
3. Su00e9lectionner "Slow 3G" dans le menu du00e9roulant

## Mu00e9triques et diagnostics

Le systu00e8me collecte les mu00e9triques suivantes :

- Latence moyenne par endpoint
- Nombre de reconnexions
- Taux de succu00e8s des tentatives
- Taille de la file d'attente
- Duru00e9e des pu00e9riodes hors ligne

Ces mu00e9triques sont disponibles dans le dashboard de monitoring :

```bash
npm run monitor -- --network-focus
```

## Pour aller plus loin

### Amu00e9liorations possibles

- [ ] Synchronisation offline avec IndexedDB
- [ ] Envoi diffru00e9s avec Service Workers
- [ ] Notifications utilisateur pour les opu00e9rations terminu00e9es en arriu00e8re-plan
- [ ] Du00e9tection plus pru00e9cise de la bande passante disponible
