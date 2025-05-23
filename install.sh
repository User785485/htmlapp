#!/bin/bash

echo "🚀 HTML Personalizer V2 - Installation"
echo "======================================"

# Vérifier Node.js
echo "✅ Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi
echo "Node.js version: $(node -v)"

# Vérifier npm
echo "✅ Vérification de npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi
echo "npm version: $(npm -v)"

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Créer les dossiers nécessaires
echo ""
echo "📁 Création de la structure des dossiers..."
mkdir -p templates/vente
mkdir -p templates/compte-rendu
mkdir -p templates/onboarding
mkdir -p public/styles

# Copier le fichier .env
if [ ! -f .env.local ]; then
    echo ""
    echo "🔐 Création du fichier .env.local..."
    cp .env.local.example .env.local
    echo "⚠️  N'oubliez pas de configurer vos variables dans .env.local"
fi

# Message de fin
echo ""
echo "✅ Installation terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Configurer vos variables dans .env.local"
echo "2. Créer votre table Supabase (voir README.md)"
echo "3. Configurer votre token GitHub"
echo "4. Lancer le projet avec: npm run dev"
echo ""
echo "📖 Consultez le README.md pour plus de détails"