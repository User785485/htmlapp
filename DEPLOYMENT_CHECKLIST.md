# ✅ Checklist de Déploiement - HTML Personalizer V2

## 📋 Avant le déploiement

### 1. Configuration Supabase
- [ ] Créer un compte sur [supabase.com](https://supabase.com)
- [ ] Créer un nouveau projet
- [ ] Noter l'URL du projet : `https://xxxxx.supabase.co`
- [ ] Noter la clé publique (anon key)
- [ ] Noter la clé service (service_role key)
- [ ] Exécuter le SQL de création de table (voir README.md)
- [ ] Vérifier que la table `generated_documents` est créée

### 2. Configuration GitHub
- [ ] Le repo `soulful-connections-new` existe
- [ ] GitHub Pages est activé (Settings > Pages)
- [ ] Créer un Personal Access Token :
  - Settings > Developer settings > Personal access tokens
  - Générer un nouveau token (classic)
  - Permissions : cocher `repo` (full control)
  - Copier le token `ghp_xxxx`

### 3. Préparation locale
- [ ] Cloner ce projet
- [ ] Exécuter `npm install`
- [ ] Copier `.env.local.example` vers `.env.local`
- [ ] Remplir toutes les variables dans `.env.local`
- [ ] Tester en local avec `npm run dev`
- [ ] Vérifier l'upload d'un CSV d'exemple

## 🚀 Déploiement sur Vercel

### 1. Préparation GitHub
- [ ] Créer un repo GitHub pour ce projet
- [ ] Push tout le code (sans .env.local !)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOUS/html-personalizer-v2.git
git push -u origin main
```

### 2. Déploiement Vercel
- [ ] Aller sur [vercel.com](https://vercel.com)
- [ ] "New Project" > Importer votre repo GitHub
- [ ] Framework Preset : Next.js (auto-détecté)
- [ ] Root Directory : laisser vide
- [ ] Build Command : laisser par défaut
- [ ] Output Directory : laisser par défaut

### 3. Variables d'environnement Vercel
Ajouter TOUTES ces variables :

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGc...` (clé publique)
- [ ] `SUPABASE_SERVICE_KEY` = `eyJhbGc...` (clé service)
- [ ] `GITHUB_TOKEN` = `ghp_xxxx...`
- [ ] `GITHUB_OWNER` = `User785485`
- [ ] `GITHUB_REPO` = `soulful-connections-new`
- [ ] `GITHUB_BRANCH` = `main`
- [ ] `ACCESS_CODE` = `7744`
- [ ] `SITE_BASE_URL` = `https://user785485.github.io/soulful-connections-new`

### 4. Déployer
- [ ] Cliquer sur "Deploy"
- [ ] Attendre la fin du build (~2-3 minutes)
- [ ] Noter l'URL : `https://votre-app.vercel.app`

## 🧪 Tests post-déploiement

### 1. Test de base
- [ ] Accéder à l'URL Vercel
- [ ] La page s'affiche correctement
- [ ] Pas d'erreurs dans la console

### 2. Test complet
- [ ] Uploader le CSV d'exemple
- [ ] Vérifier l'analyse (nb de clients)
- [ ] Lancer la génération
- [ ] Attendre la fin du traitement
- [ ] Télécharger le CSV de résultat
- [ ] Vérifier les liens dans le CSV

### 3. Vérification GitHub Pages
- [ ] Aller sur le repo GitHub
- [ ] Vérifier le dossier `protected-pages/`
- [ ] Vérifier les sous-dossiers : `vente/`, `compte-rendu/`, `onboarding/`
- [ ] Cliquer sur un fichier HTML
- [ ] Tester l'accès avec le code 7744

### 4. Vérification Supabase
- [ ] Dashboard Supabase > Table Editor
- [ ] Table `generated_documents`
- [ ] Vérifier que les lignes sont créées
- [ ] Vérifier les URLs stockées

## 🔧 Dépannage

### Erreur de build Vercel
- Vérifier les logs de build
- Souvent lié aux types TypeScript
- Solution : `npm run build` en local pour tester

### Erreur Supabase
- Vérifier les clés (anon vs service)
- Vérifier que la table existe
- Tester la connexion depuis Supabase Dashboard

### Erreur GitHub
- Vérifier le token (non expiré)
- Vérifier les permissions
- Vérifier que le repo existe
- Tester avec curl :
```bash
curl -H "Authorization: token ghp_xxx" https://api.github.com/user
```

### Pages non accessibles
- Vérifier GitHub Pages activé
- Attendre 5-10 minutes (propagation)
- Vérifier l'URL exacte
- Tester en navigation privée

## 📊 Monitoring

### Vercel
- Dashboard > Votre projet > Functions
- Voir les logs d'exécution
- Voir les metrics (durée, erreurs)

### Supabase
- Dashboard > Database > Logs
- Voir les requêtes SQL
- Voir les erreurs

### GitHub
- Settings > Webhooks (si configuré)
- Actions (si configuré)

## 🎉 Succès !

Si tout est coché, votre application est opérationnelle !

**URLs importantes :**
- Application : `https://votre-app.vercel.app`
- Pages clients : `https://user785485.github.io/soulful-connections-new/protected-pages/`
- Dashboard Supabase : `https://app.supabase.com/project/xxxxx`
- Logs Vercel : `https://vercel.com/votre-compte/votre-app/functions`

**Maintenance :**
- Surveiller les quotas Vercel (gratuit : 100GB bandwidth/mois)
- Surveiller Supabase (gratuit : 500MB database)
- Renouveler le token GitHub si nécessaire
- Sauvegarder régulièrement le CSV exporté