#!/usr/bin/env node

/**
 * Visualiseur de logs en temps réel depuis la ligne de commande
 * 
 * Usage:
 * node scripts/logs-viewer.js                    # Voir tous les logs
 * node scripts/logs-viewer.js --level error      # Filtrer par niveau
 * node scripts/logs-viewer.js --component API    # Filtrer par composant
 * node scripts/logs-viewer.js --follow          # Mode temps réel
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const Table = require('cli-table3');
const { program } = require('commander');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Variables Supabase manquantes dans .env.local'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration des couleurs par niveau
const levelColors = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  fatal: chalk.bgRed.white,
};

// Icônes par niveau
const levelIcons = {
  debug: '🔍',
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌',
  fatal: '💀',
};

// Parser les arguments
program
  .option('-l, --level <level>', 'Filtrer par niveau (debug, info, warn, error, fatal)')
  .option('-c, --component <component>', 'Filtrer par composant')
  .option('-e, --email <email>', 'Filtrer par email client')
  .option('-f, --follow', 'Mode temps réel (tail -f)')
  .option('-n, --lines <number>', 'Nombre de lignes à afficher', '50')
  .option('--json', 'Afficher en format JSON brut')
  .option('--table', 'Afficher en format tableau')
  .parse(process.argv);

const options = program.opts();

// Fonction pour formater un log
function formatLog(log, format = 'default') {
  if (format === 'json') {
    return JSON.stringify(log, null, 2);
  }

  const timestamp = new Date(log.timestamp).toLocaleString();
  const level = log.level.toUpperCase().padEnd(5);
  const component = log.component.padEnd(20);
  const icon = levelIcons[log.level] || '  ';
  const color = levelColors[log.level] || chalk.white;

  if (format === 'table') {
    return [
      color(icon),
      color(level),
      timestamp,
      component,
      log.action,
      log.message.substring(0, 50) + (log.message.length > 50 ? '...' : ''),
      log.duration_ms ? `${log.duration_ms}ms` : '-'
    ];
  }

  // Format par défaut
  let output = color(`${icon} [${timestamp}] [${level}] [${component}] ${log.action}: ${log.message}`);
  
  if (log.client_email) {
    output += chalk.gray(` (client: ${log.client_email})`);
  }
  
  if (log.duration_ms) {
    output += chalk.cyan(` [${log.duration_ms}ms]`);
  }
  
  if (log.error_stack) {
    output += '\n' + chalk.red(log.error_stack);
  }
  
  if (log.details && Object.keys(log.details).length > 0) {
    output += '\n' + chalk.gray('Details: ' + JSON.stringify(log.details, null, 2));
  }
  
  return output;
}

// Fonction pour récupérer les logs
async function fetchLogs(limit = 50) {
  let query = supabase
    .from('application_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  // Appliquer les filtres
  if (options.level) {
    query = query.eq('level', options.level.toLowerCase());
  }
  if (options.component) {
    query = query.eq('component', options.component);
  }
  if (options.email) {
    query = query.eq('client_email', options.email);
  }

  const { data, error } = await query;

  if (error) {
    console.error(chalk.red('❌ Erreur lors de la récupération des logs:'), error);
    process.exit(1);
  }

  return data || [];
}

// Fonction pour afficher les logs
async function displayLogs() {
  const logs = await fetchLogs(parseInt(options.lines));
  
  if (logs.length === 0) {
    console.log(chalk.yellow('Aucun log trouvé avec ces critères.'));
    return;
  }

  if (options.table) {
    // Affichage en tableau
    const table = new Table({
      head: ['', 'Niveau', 'Timestamp', 'Composant', 'Action', 'Message', 'Durée'],
      colWidths: [3, 7, 20, 22, 20, 50, 10],
      style: { head: ['cyan'] }
    });

    logs.reverse().forEach(log => {
      table.push(formatLog(log, 'table'));
    });

    console.log(table.toString());
  } else {
    // Affichage standard
    logs.reverse().forEach(log => {
      console.log(formatLog(log, options.json ? 'json' : 'default'));
      if (!options.json) console.log(''); // Ligne vide entre les logs
    });
  }
}

// Fonction pour le mode follow
async function followLogs() {
  console.log(chalk.cyan('📡 Mode temps réel activé. Appuyez sur Ctrl+C pour quitter.\n'));
  
  let lastTimestamp = new Date().toISOString();
  
  const checkNewLogs = async () => {
    let query = supabase
      .from('application_logs')
      .select('*')
      .gt('timestamp', lastTimestamp)
      .order('timestamp', { ascending: true });

    // Appliquer les filtres
    if (options.level) {
      query = query.eq('level', options.level.toLowerCase());
    }
    if (options.component) {
      query = query.eq('component', options.component);
    }
    if (options.email) {
      query = query.eq('client_email', options.email);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      data.forEach(log => {
        console.log(formatLog(log, options.json ? 'json' : 'default'));
        if (!options.json) console.log('');
      });
      
      // Mettre à jour le timestamp
      lastTimestamp = data[data.length - 1].timestamp;
    }
  };

  // Vérifier toutes les 2 secondes
  setInterval(checkNewLogs, 2000);
  
  // Garder le processus actif
  process.stdin.resume();
}

// Afficher les statistiques
async function showStats() {
  const { data: stats } = await supabase
    .from('application_logs')
    .select('level')
    .order('timestamp', { ascending: false })
    .limit(1000);

  if (stats) {
    const counts = stats.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    console.log(chalk.cyan('\n📊 Statistiques des derniers 1000 logs:\n'));
    
    Object.entries(counts).forEach(([level, count]) => {
      const color = levelColors[level] || chalk.white;
      const icon = levelIcons[level] || '  ';
      const percentage = ((count / stats.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(percentage / 2));
      
      console.log(color(`${icon} ${level.padEnd(5)}: ${count.toString().padStart(4)} (${percentage}%) ${bar}`));
    });
  }
}

// Main
async function main() {
  console.clear();
  console.log(chalk.cyan.bold('🔍 HTML Personalizer - Visualiseur de Logs\n'));

  if (options.follow) {
    await followLogs();
  } else {
    await displayLogs();
    await showStats();
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Erreur non gérée:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Promise rejetée:'), error);
  process.exit(1);
});

// Lancer l'application
main().catch((error) => {
  console.error(chalk.red('❌ Erreur:'), error);
  process.exit(1);
});