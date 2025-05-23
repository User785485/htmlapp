# 🚀 Déploiement et Opérations - HTML Personalizer V2

## 📋 Prérequis

### Services externes

- **GitHub** : Repository et Personal Access Token
- **Supabase** : Projet et clés API
- **Vercel** : Compte pour le déploiement

### Variables d'environnement requises

```plaintext
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# GitHub
GITHUB_TOKEN=ghp_xxxx...
GITHUB_OWNER=User785485
GITHUB_REPO=soulful-connections-new
GITHUB_BRANCH=main

# Application
ACCESS_CODE=7744
SITE_BASE_URL=https://user785485.github.io/soulful-connections-new
```

## 🏗️ Préparation du déploiement

### 1. Configuration Supabase

```sql
-- Créer la table des documents générés
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

-- Créer la table des logs d'application
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

-- Créer les index
CREATE INDEX idx_generated_documents_client_email ON generated_documents (client_email);
CREATE INDEX idx_generated_documents_document_type ON generated_documents (document_type);
CREATE INDEX idx_application_logs_timestamp ON application_logs (timestamp DESC);
CREATE INDEX idx_application_logs_level ON application_logs (level);

-- Créer une fonction pour obtenir les stats
CREATE OR REPLACE FUNCTION get_application_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT client_email) as total_clients,
      COUNT(*) as total_documents,
      jsonb_object_agg(document_type, COUNT(*)) as documents_by_type
    FROM generated_documents
  )
  SELECT 
    jsonb_build_object(
      'total_clients', total_clients,
      'total_documents', total_documents,
      'documents_by_type', documents_by_type
    )
  FROM stats
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2. Configuration GitHub

1. Créer un repository `soulful-connections-new`
2. Activer GitHub Pages dans les Settings
3. Créer un Personal Access Token avec les droits `repo`

## 🚀 Processus de déploiement

### Déploiement sur Vercel

1. **Connexion** : Se connecter à Vercel avec GitHub
2. **Import** : Importer le repository depuis GitHub
3. **Configuration** :
   - Framework preset : Next.js
   - Build Command : `npm run build`
   - Output Directory : `.next`
4. **Variables d'environnement** : Ajouter toutes les variables listées ci-dessus
5. **Déployer** : Cliquer sur "Deploy"

### Suivi du déploiement

1. **Build Logs** : Surveiller les logs de build pour détecter les erreurs
2. **Preview** : Tester l'application dans l'environnement de preview
3. **Production** : Vérifier l'URL de production finale

## 📊 Monitoring et maintenance

### Monitoring en production

1. **Logs Vercel** : Dashboard Vercel > Votre projet > Functions
2. **Logs Supabase** : Dashboard Supabase > Database > Logs
3. **Statut GitHub** : Surveiller les actions GitHub si configurées
4. **Script de monitoring** : Utiliser `npm run monitor` pour un dashboard temps réel

### Alertes et notifications

```bash
# Surveiller les erreurs uniquement
node scripts/monitor.js --alerts-only
```

Configuration des alertes dans le fichier `.monitor-config.json` :

```json
{
  "alerts": {
    "error_threshold": 10,
    "error_window_minutes": 5,
    "slow_request_ms": 5000,
    "error_rate_percent": 5
  },
  "checks": {
    "github": true,
    "supabase": true,
    "disk_space": true
  }
}
```

### Maintenance de routine

#### Nettoyage des logs

```bash
# Nettoyer les logs de plus de 30 jours
npm run cleanup

# Configuration de nettoyage automatique
node scripts/cleanup-logs.js setup
```

Configuration dans `.cleanup-config.json` :

```json
{
  "enabled": true,
  "schedule": "0 3 * * *",
  "retentionDays": 30,
  "keepErrors": true,
  "archive": true
}
```

#### Backups

```bash
# Backup de la base de données Supabase
npx supabase db dump -f backup.sql

# Backup des configurations
cp .env.local .env.backup
```

## 🔧 Troubleshooting

### Problèmes courants et solutions

#### 1. Erreur de connexion Supabase

**Symptômes** : 
- ❌ Erreur 401/403 dans les logs
- ❌ Message "Error: JWT expired"

**Solutions** :
- Vérifier les clés Supabase dans les variables d'environnement
- Regénérer les clés dans le dashboard Supabase
- Vérifier les règles RLS (Row Level Security)

#### 2. Erreur de publication GitHub

**Symptômes** :
- ❌ Erreur 401 lors des appels à l'API GitHub
- ❌ Message "Bad credentials" dans les logs

**Solutions** :
- Vérifier le token GitHub dans les variables d'environnement
- Regénérer le token avec les bonnes permissions
- Vérifier que le repo existe et que l'utilisateur a accès

#### 3. Pages générées inaccessibles

**Symptômes** :
- ❌ Les liens générés donnent une erreur 404
- ❌ GitHub Pages affiche "Site not found"

**Solutions** :
- Vérifier que GitHub Pages est activé sur la branche correcte
- Attendre 5-10 minutes pour la propagation DNS
- Vérifier la structure des fichiers dans le repo

#### 4. Erreurs de build

**Symptômes** :
- ❌ Échec du déploiement sur Vercel
- ❌ Erreurs TypeScript ou ESLint

**Solutions** :
- Vérifier les logs de build sur Vercel
- Exécuter `npm run build` localement pour reproduire
- Vérifier les versions des dépendances

## 📝 Runbooks

### Mise à jour de l'application

1. **Développement local** :
   ```bash
   git pull
   npm install
   npm run dev
   ```

2. **Tests** :
   ```bash
   npm run build
   npm run lint
   # Tester manuellement les fonctionnalités critiques
   ```

3. **Déploiement** :
   ```bash
   git push origin main
   # Vérifier le déploiement sur Vercel
   ```

### Récupération après incident

1. **Rollback** :
   - Vercel : Retourner à un déploiement précédent via le dashboard
   - GitHub : `git revert` ou `git reset`

2. **Restore des données** :
   ```bash
   # Restaurer depuis un backup Supabase
   npx supabase db restore -f backup.sql
   ```

3. **Vérification** :
   - Tester les fonctionnalités critiques
   - Vérifier les logs pour confirmer la résolution

## 💰 Considérations de coûts

### Services gratuits vs payants

- **Vercel** : Plan gratuit limité à 100GB de bande passante/mois
- **Supabase** : Plan gratuit limité à 500MB de base de données
- **GitHub** : Pages gratuit, mais API limitée à 5000 requêtes/heure

### Évolution

Prévoir une mise à jour des plans selon les métriques :

- **Volume** : Nombre de clients > 1000
- **Stockage** : Base de données > 400MB
- **Trafic** : Bande passante > 80GB/mois

## 🔒 Sécurité opérationnelle

### Bonnes pratiques

- **Rotation régulière des tokens** : Tous les 90 jours
- **Audit des accès** : Vérifier les logs de connexion Supabase/GitHub
- **Isolation des environnements** : Dev/Staging/Prod séparés
- **Backup réguliers** : Quotidiens pour la production

### Surveillance des vulnérabilités

```bash
# Vérifier les vulnérabilités des dépendances
npm audit

# Corriger automatiquement si possible
npm audit fix
```

---

Voir les autres fichiers de documentation pour des informations détaillées sur les autres aspects de l'application.
