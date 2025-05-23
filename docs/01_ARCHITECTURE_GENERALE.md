# 🏗️ Architecture Générale - HTML Personalizer V2

## 📋 Vue d'ensemble

HTML Personalizer V2 est une application web moderne construite avec Next.js 14 qui permet de générer des documents HTML personnalisés à partir de données CSV, de les protéger par mot de passe, et de les publier automatiquement sur GitHub Pages.

## 🔍 Structure du projet

```
.
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes
│   │   ├── generate/        # Endpoint de génération de documents
│   │   ├── github/          # Endpoints liés à GitHub
│   │   ├── logs/            # Endpoints de gestion des logs
│   │   └── supabase/        # Endpoints liés à Supabase
│   ├── page.tsx             # Page principale (interface utilisateur)
│   ├── layout.tsx           # Layout global de l'application
│   └── globals.css          # Styles CSS globaux
├── components/              # Composants React réutilisables
│   ├── Dashboard.tsx        # Interface principale
│   ├── ErrorBoundary.tsx    # Capture des erreurs React
│   ├── NavigationLogger.tsx # Logging de navigation
│   ├── ProgressBar.tsx      # Barre de progression
│   ├── ResultsTable.tsx     # Tableau des résultats
│   └── UploadZone.tsx       # Zone de dépôt de fichiers
├── lib/                     # Logique métier et utilitaires
│   ├── api-utils.ts         # Utilitaires pour API routes
│   ├── csv-parser.ts        # Parseur de fichiers CSV
│   ├── document-generator.ts # Générateur de documents HTML
│   ├── github-publisher.ts  # Publication sur GitHub Pages
│   ├── hooks/               # Custom React hooks
│   │   ├── useLogging.tsx   # Hook de logging
│   │   └── useNetworkError.tsx # Gestion erreurs réseau
│   ├── logger.ts            # Système de logging central
│   ├── supabase-client.ts   # Client Supabase
│   └── types.ts             # Types TypeScript
├── public/                  # Fichiers statiques
├── scripts/                 # Scripts utilitaires
│   ├── cleanup-logs.js      # Nettoyage des anciens logs
│   ├── logs-viewer.js       # Visualiseur de logs
│   └── monitor.js           # Monitoring temps réel
├── templates/               # Templates HTML
│   ├── protection.html      # Template de protection par mot de passe
│   ├── vente/               # Templates de pages de vente
│   ├── compte-rendu/        # Templates de comptes-rendus
│   └── onboarding/          # Templates d'onboarding
├── types/                   # Types globaux
│   └── next-server.d.ts     # Déclarations pour next/server
├── docs/                    # Documentation
├── middleware.ts           # Middleware Next.js
├── next.config.js          # Configuration Next.js
├── package.json            # Dépendances
└── tsconfig.json           # Configuration TypeScript
```

## 🚀 Technologies utilisées

### 🧰 Stack technique principale

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Langage fortement typé
- **Supabase** - Base de données PostgreSQL et authentification
- **GitHub API** - Publication automatique sur GitHub Pages
- **Tailwind CSS** - Framework CSS utilitaire

### 📦 Principales dépendances

- **@supabase/supabase-js** - Client officiel Supabase
- **@octokit/rest** - SDK GitHub API
- **papaparse** - Parsing CSV
- **react-dropzone** - Gestion des uploads de fichiers
- **lucide-react** - Icônes modernes

### 🔧 Outils de développement

- **ESLint** - Linting du code
- **TypeScript** - Vérification des types
- **CLI tools** - Scripts d'aide au développement

## 🧠 Architecture logicielle

### 📱 Frontend

- **Architecture basée sur les composants React**
- **État global** géré via React Context et Custom Hooks
- **TailwindCSS** pour le styling
- **Interface responsive** adaptée à tous les appareils

### 🖥️ Backend

- **Architecture API Routes** avec Next.js
- **Services modulaires** pour la séparation des responsabilités :
  - `DocumentGenerator` - Génération de documents
  - `GitHubPublisher` - Publication sur GitHub Pages
  - `CSVParser` - Traitement des fichiers CSV
  - `Logger` - Système de logging

### 💾 Persistance

- **Supabase PostgreSQL** pour le stockage des données
  - Table `generated_documents` - Documents générés
  - Table `application_logs` - Logs système
- **GitHub Pages** pour l'hébergement des documents publiés

## 🔄 Flux de données

1. **Upload CSV** → Parsé et validé par `CSVParser`
2. **Traitement des clients** :
   - Vérifié dans Supabase via `SupabaseClient`
   - Documents générés via `DocumentGenerator`
   - Protection par mot de passe ajoutée
   - Publiés sur GitHub via `GitHubPublisher`
   - Enregistrés dans Supabase
3. **Export CSV** avec tous les liens générés

## 🔒 Sécurité

- **Protection par mot de passe** sur tous les documents
- **Variables d'environnement** pour les clés sensibles
- **Validation des entrées** à tous les niveaux
- **Headers de sécurité** via middleware Next.js
- **Sanitization des logs** pour masquer les données sensibles

## 🌐 Déploiement

- **Vercel** pour l'hébergement de l'application
- **GitHub Pages** pour les documents générés
- **Supabase Cloud** pour la base de données

## 🔍 Observabilité

- **Système de logging** complet (voir `SYSTEM_LOGGING.md`)
- **Scripts de monitoring** pour suivre l'application en production
- **Outils de debug** intégrés

## 🧩 Points d'extension

- **Templates personnalisables** dans le dossier `/templates`
- **Middleware extensible** pour ajouter des fonctionnalités
- **API modulaire** facilitant l'ajout de nouvelles fonctionnalités

---

Voir les autres fichiers de documentation pour des informations détaillées sur chaque composant.
