/**
 * Script de test pour vérifier la configuration
 * Exécuter avec : node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de configuration - HTML Personalizer V2\n');

let errors = 0;
let warnings = 0;

// Vérifier Node.js version
console.log('1. Vérification de Node.js...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} (OK)`);
} else {
    console.log(`   ⚠️  Node.js ${nodeVersion} (Version 18+ recommandée)`);
    warnings++;
}

// Vérifier les fichiers essentiels
console.log('\n2. Vérification des fichiers essentiels...');
const essentialFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    '.env.local.example',
    'app/page.tsx',
    'lib/types.ts'
];

essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} (MANQUANT)`);
        errors++;
    }
});

// Vérifier les dossiers
console.log('\n3. Vérification des dossiers...');
const requiredDirs = [
    'app',
    'app/api',
    'components',
    'lib',
    'templates',
    'templates/vente',
    'templates/compte-rendu',
    'templates/onboarding'
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`   ✅ ${dir}/`);
    } else {
        console.log(`   ❌ ${dir}/ (MANQUANT)`);
        errors++;
    }
});

// Vérifier .env.local
console.log('\n4. Vérification de la configuration...');
if (fs.existsSync('.env.local')) {
    console.log('   ✅ .env.local existe');
    
    // Lire et vérifier les variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_KEY',
        'GITHUB_TOKEN',
        'ACCESS_CODE'
    ];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(varName + '=')) {
            const hasValue = !envContent.includes(varName + '=your');
            if (hasValue) {
                console.log(`   ✅ ${varName} configuré`);
            } else {
                console.log(`   ⚠️  ${varName} à configurer`);
                warnings++;
            }
        } else {
            console.log(`   ❌ ${varName} manquant`);
            errors++;
        }
    });
} else {
    console.log('   ⚠️  .env.local n\'existe pas (copiez .env.local.example)');
    warnings++;
}

// Vérifier les templates
console.log('\n5. Vérification des templates...');
const templates = [
    'templates/protection.html',
    'templates/vente/template.html',
    'templates/compte-rendu/template.html',
    'templates/onboarding/template.html'
];

templates.forEach(template => {
    if (fs.existsSync(template)) {
        const content = fs.readFileSync(template, 'utf8');
        const hasVariables = content.includes('{{') && content.includes('}}');
        if (hasVariables) {
            console.log(`   ✅ ${template} (avec variables)`);
        } else {
            console.log(`   ⚠️  ${template} (sans variables ?)`);
            warnings++;
        }
    } else {
        console.log(`   ❌ ${template} (MANQUANT)`);
        errors++;
    }
});

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
    console.log('✅ Tout est parfait ! Vous pouvez lancer npm run dev');
} else {
    if (errors > 0) {
        console.log(`❌ ${errors} erreur(s) à corriger`);
    }
    if (warnings > 0) {
        console.log(`⚠️  ${warnings} avertissement(s) à vérifier`);
    }
    console.log('\nCorrigez les erreurs avant de continuer.');
}

console.log('\n💡 Prochaines étapes :');
console.log('1. Configurer .env.local avec vos vraies clés');
console.log('2. Créer la table Supabase (voir README.md)');
console.log('3. npm install');
console.log('4. npm run dev');
console.log('\n');