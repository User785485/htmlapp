#!/usr/bin/env node

/**
 * Script de monitoring en temps réel de l'application
 * 
 * Usage:
 * node scripts/monitor.js                 # Monitoring complet
 * node scripts/monitor.js --alerts-only   # Seulement les alertes
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { program } = require('commander');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Variables Supabase manquantes dans .env.local'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parser les arguments
program
  .option('-a, --alerts-only', 'Afficher seulement les alertes')
  .option('-r, --refresh <seconds>', 'Intervalle de rafraîchissement', '5')
  .parse(process.argv);

const options = program.opts();

// Créer l'interface
const screen = blessed.screen({
  smartCSR: true,
  title: 'HTML Personalizer - Monitoring'
});

// Créer la grille
const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// Graphique des logs par niveau
const logChart = grid.set(0, 0, 4, 6, contrib.bar, {
  label: ' Logs par Niveau (dernière heure) ',
  barWidth: 12,
  barSpacing: 6,
  xOffset: 0,
  maxHeight: 100,
  style: {
    fg: 'cyan',
    border: { fg: 'cyan' }
  }
});

// Graphique de performance
const performanceChart = grid.set(0, 6, 4, 6, contrib.line, {
  style: {
    line: 'yellow',
    text: 'green',
    baseline: 'black',
    border: { fg: 'cyan' }
  },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  wholeNumbersOnly: false,
  label: ' Performance API (temps de réponse) '
});

// Tableau des erreurs récentes
const errorTable = grid.set(4, 0, 4, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: ' Erreurs Récentes ',
  width: '100%',
  height: '100%',
  border: { type: 'line', fg: 'cyan' },
  columnSpacing: 1,
  columnWidth: [20, 15, 20, 60]
});

// Log en temps réel
const logBox = grid.set(8, 0, 4, 8, contrib.log, {
  fg: 'green',
  selectedFg: 'green',
  label: ' Logs Temps Réel ',
  border: { type: 'line', fg: 'cyan' }
});

// Statistiques
const statsBox = grid.set(8, 8, 4, 4, blessed.box, {
  label: ' Statistiques ',
  content: '',
  border: { type: 'line', fg: 'cyan' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' }
  }
});

// Variables de monitoring
let lastLogTimestamp = new Date().toISOString();
const performanceData = {
  title: 'Temps de réponse (ms)',
  x: [],
  y: []
};

// Fonctions de monitoring
async function updateLogChart() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('application_logs')
    .select('level')
    .gte('timestamp', oneHourAgo);
  
  if (data) {
    const counts = data.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
    
    logChart.setData({
      titles: Object.keys(counts),
      data: Object.values(counts)
    });
  }
}

async function updatePerformanceChart() {
  const { data } = await supabase
    .from('application_logs')
    .select('timestamp, duration_ms')
    .not('duration_ms', 'is', null)
    .order('timestamp', { ascending: false })
    .limit(20);
  
  if (data) {
    const reversed = data.reverse();
    performanceData.x = reversed.map((_, i) => i.toString());
    performanceData.y = reversed.map(log => log.duration_ms);
    
    performanceChart.setData([performanceData]);
  }
}

async function updateErrorTable() {
  const { data } = await supabase
    .from('application_logs')
    .select('*')
    .in('level', ['error', 'fatal'])
    .order('timestamp', { ascending: false })
    .limit(10);
  
  if (data) {
    const tableData = data.map(log => [
      new Date(log.timestamp).toLocaleTimeString(),
      log.component,
      log.action,
      log.message.substring(0, 60)
    ]);
    
    errorTable.setData({
      headers: ['Heure', 'Composant', 'Action', 'Message'],
      data: tableData
    });
  }
}

async function updateLiveLogs() {
  const { data } = await supabase
    .from('application_logs')
    .select('*')
    .gt('timestamp', lastLogTimestamp)
    .order('timestamp', { ascending: true });
  
  if (data && data.length > 0) {
    data.forEach(log => {
      const color = {
        debug: 'gray',
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
        fatal: 'red'
      }[log.level] || 'white';
      
      const message = `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.component}] ${log.message}`;
      
      logBox.log(`{${color}-fg}${message}{/${color}-fg}`);
    });
    
    lastLogTimestamp = data[data.length - 1].timestamp;
  }
}

async function updateStats() {
  // Statistiques des dernières 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: logs } = await supabase
    .from('application_logs')
    .select('level')
    .gte('timestamp', oneDayAgo);
  
  const { count: clientCount } = await supabase
    .from('generated_documents')
    .select('*', { count: 'exact', head: true });
  
  const { data: recentGenerations } = await supabase
    .from('application_logs')
    .select('*')
    .eq('component', 'API_GENERATE')
    .eq('action', 'process_complete')
    .gte('timestamp', oneDayAgo);
  
  if (logs) {
    const errorCount = logs.filter(l => l.level === 'error' || l.level === 'fatal').length;
    const errorRate = ((errorCount / logs.length) * 100).toFixed(1);
    
    let content = `{cyan-fg}Dernières 24h:{/cyan-fg}\n\n`;
    content += `Total logs: {bold}${logs.length}{/bold}\n`;
    content += `Erreurs: {red-fg}${errorCount}{/red-fg} (${errorRate}%)\n`;
    content += `\n{cyan-fg}Total:{/cyan-fg}\n`;
    content += `Clients: {bold}${clientCount || 0}{/bold}\n`;
    
    if (recentGenerations) {
      content += `\n{cyan-fg}Générations 24h:{/cyan-fg}\n`;
      content += `Total: {bold}${recentGenerations.length}{/bold}\n`;
      
      const avgTime = recentGenerations.reduce((sum, log) => {
        return sum + (log.details?.duration_ms || 0);
      }, 0) / recentGenerations.length;
      
      content += `Temps moyen: {yellow-fg}${avgTime.toFixed(0)}ms{/yellow-fg}`;
    }
    
    statsBox.setContent(content);
  }
}

// Alertes
async function checkAlerts() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  // Vérifier les erreurs critiques
  const { count: errorCount } = await supabase
    .from('application_logs')
    .select('*', { count: 'exact', head: true })
    .in('level', ['error', 'fatal'])
    .gte('timestamp', fiveMinutesAgo);
  
  if (errorCount && errorCount > 10) {
    const alert = blessed.message({
      parent: screen,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      label: ' {red-fg}ALERTE{/red-fg} ',
      tags: true,
      hidden: true,
      vi: true
    });
    
    alert.display(`{red-fg}⚠️  ALERTE: ${errorCount} erreurs dans les 5 dernières minutes!{/red-fg}`, 5);
  }
  
  // Vérifier les performances
  const { data: slowRequests } = await supabase
    .from('application_logs')
    .select('*')
    .gt('duration_ms', 5000)
    .gte('timestamp', fiveMinutesAgo);
  
  if (slowRequests && slowRequests.length > 5) {
    logBox.log(`{red-fg}⚠️  ALERTE: ${slowRequests.length} requêtes lentes détectées!{/red-fg}`);
  }
}

// Rafraîchir toutes les données
async function refresh() {
  try {
    await Promise.all([
      updateLogChart(),
      updatePerformanceChart(),
      updateErrorTable(),
      updateLiveLogs(),
      updateStats(),
      checkAlerts()
    ]);
    
    screen.render();
  } catch (error) {
    logBox.log(`{red-fg}Erreur de rafraîchissement: ${error.message}{/red-fg}`);
  }
}

// Configuration des raccourcis clavier
screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['r'], () => {
  refresh();
});

// Mode alertes uniquement
if (options.alertsOnly) {
  // Simplifier l'affichage pour les alertes
  screen.destroy();
  
  console.log(chalk.cyan('🚨 Mode Alertes - Monitoring des erreurs critiques\n'));
  
  setInterval(async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: errors } = await supabase
      .from('application_logs')
      .select('*')
      .in('level', ['error', 'fatal'])
      .gte('timestamp', fiveMinutesAgo)
      .order('timestamp', { ascending: false });
    
    if (errors && errors.length > 0) {
      console.clear();
      console.log(chalk.red(`\n⚠️  ${errors.length} ERREURS DÉTECTÉES\n`));
      
      errors.forEach(error => {
        console.log(chalk.red(`[${new Date(error.timestamp).toLocaleTimeString()}] ${error.component} - ${error.message}`));
        if (error.error_stack) {
          console.log(chalk.gray(error.error_stack.split('\n')[0]));
        }
        console.log('');
      });
    }
  }, 5000);
} else {
  // Mode monitoring complet
  refresh();
  setInterval(refresh, parseInt(options.refresh) * 1000);
  
  // Message de bienvenue
  logBox.log('{cyan-fg}Monitoring démarré - Appuyez sur "q" pour quitter, "r" pour rafraîchir{/cyan-fg}');
  screen.render();
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