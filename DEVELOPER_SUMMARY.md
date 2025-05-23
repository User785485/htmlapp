# 📋 Résumé pour le Développeur - HTML Personalizer V2

## 🎯 Ce que fait l'application

1. **Importe un CSV** contenant les données de tous les clients
2. **Génère 3 types de documents HTML** par client :
   - Page de vente
   - Compte-rendu
   - Document d'onboarding
3. **Évite les doublons** en vérifiant dans Supabase
4. **Protège chaque document** avec le code 7744
5. **Publie automatiquement** sur GitHub Pages
6. **Exporte un CSV final** avec tous les liens

## 📁 Fichiers créés

### Structure principale
```
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API endpoints
│   ├── page.tsx              # Page principale
│   ├── layout.tsx            # Layout
│   └── globals.css           # Styles globaux
├── components/               # Composants React
├── lib/                      # Logique métier
├── templates/                # Templates HTML
├── package.json              # Dépendances
├── .env.local.example        # Variables d'environnement
└── README.md                 # Documentation
```

### Fichiers clés à comprendre

1. **`lib/document-generator.ts`** : Génère les HTML à partir des templates
2. **`lib/github-publisher.ts`** : Publie sur GitHub via l'API
3. **`lib/supabase-client.ts`** : Gère la base de données
4. **`app/api/generate/route.ts`** : Endpoint principal de génération
5. **`components/Dashboard.tsx`** : Interface utilisateur complète

## 🚀 Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés

# 3. Lancer en local
npm run dev
```

## ⚙️ Configuration requise

### 1. Supabase
- Créer un projet sur supabase.com
- Exécuter le SQL fourni dans README.md
- Récupérer les clés API

### 2. GitHub
- Créer un Personal Access Token
- Permissions : `repo` (full)
- Le repo doit exister

### 3. Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
GITHUB_TOKEN=...
ACCESS_CODE=7744
```

## 📊 Format CSV attendu

```csv
email,telephone,prenom,nom,produit,prix,offre_speciale,date_rencontre,objectifs,recommandations,etapes_onboarding,conseils_onboarding
```

## 🔄 Workflow de l'application

1. **Upload CSV** → Parse et validation
2. **Pour chaque client** :
   - Check si existe dans Supabase
   - Si nouveau → génère les 3 documents
   - Ajoute protection mot de passe
   - Publie sur GitHub
   - Sauvegarde dans Supabase
3. **Export CSV** avec tous les liens

## 🎨 Personnalisation

### Templates HTML
- Modifier les fichiers dans `templates/`
- Variables disponibles : `{{PRENOM}}`, `{{NOM}}`, etc.
- Le système remplace automatiquement

### Protection mot de passe
- Code par défaut : 7744
- Modifiable dans `.env.local`
- Template dans `templates/protection.html`

## 🐛 Debug

### Logs utiles
- Console navigateur pour erreurs frontend
- Logs Vercel : `vercel logs`
- Supabase Dashboard pour vérifier les données

### Erreurs communes
- **Token GitHub invalide** : Vérifier permissions
- **Supabase connection** : Vérifier les clés
- **CSV malformé** : Vérifier encodage UTF-8

## 📦 Déploiement Vercel

1. Push sur GitHub
2. Importer dans Vercel
3. Ajouter toutes les variables d'environnement
4. Deploy

## 🔗 URLs importantes

- **Application** : https://votre-app.vercel.app
- **Pages publiées** : https://user785485.github.io/soulful-connections-new/protected-pages/
- **Supabase** : https://votre-projet.supabase.co

## 💡 Points d'attention

1. **Sécurité** : Ne jamais commiter `.env.local`
2. **Performance** : Traitement par batch de 10 clients
3. **Limites** : API GitHub a des rate limits
4. **Templates** : Toujours tester avec quelques clients d'abord

## 📞 Support

En cas de problème :
1. Vérifier ce document
2. Consulter les logs
3. Vérifier la configuration
4. Tester avec le CSV d'exemple fourni

---

**Bon développement ! 🚀**