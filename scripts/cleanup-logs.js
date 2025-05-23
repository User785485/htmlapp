#!/usr/bin/env node

/**
 * Script de maintenance pour nettoyer les anciens logs
 * 
 * Usage:
 * node scripts/cleanup-logs.js                    # Nettoyer les logs > 30 jours
 * node scripts/cleanup-logs.js --days 7           # Nettoyer les logs > 7 jours
 * node scripts/cleanup-logs.js --level debug      # Nettoyer seulement les logs debug
 * node scripts/cleanup-logs.js --dry-run          # Voir ce qui serait supprimé
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const { program } = require('commander');
const ora = require('ora');

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
  .option('-d, --days <number>', 'Nombre de jours à conserver', '30')
  .option('-l, --level <level>', 'Nettoyer seulement ce niveau de log')
  .option('--dry-run', 'Mode simulation (ne supprime rien)')
  .option('--keep-errors', 'Conserver les logs error et fatal')
  .option('--archive', 'Archiver avant suppression')
  .parse(process.argv);

const options = program.opts();

// Fonction pour archiver les logs
async function archiveLogs(logs) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const archiveDir = path.join(process.cwd(), 'archives', 'logs');
  await fs.mkdir(archiveDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `logs_archive_${timestamp}.json`;
  const filepath = path.join(archiveDir, filename);
  
  await fs.writeFile(filepath, JSON.stringify(logs, null, 2));
  
  return filepath;
}

// Fonction pour analyser les logs avant suppression
async function analyzeLogs(logs) {
  const analysis = {
    total: logs.length,
    byLevel: {},
    byComponent: {},
    oldestLog: null,
    newestLog: null,
    totalSize: JSON.stringify(logs).length,
  };
  
  logs.forEach(log => {
    // Par niveau
    analysis.byLevel[log.level] = (analysis.byLevel[log.level] || 0) + 1;
    
    // Par composant
    analysis.byComponent[log.component] = (analysis.byComponent[log.component] || 0) + 1;
    
    // Dates
    const logDate = new Date(log.timestamp);
    if (!analysis.oldestLog || logDate < new Date(analysis.oldestLog)) {
      analysis.oldestLog = log.timestamp;
    }
    if (!analysis.newestLog || logDate > new Date(analysis.newestLog)) {
      analysis.newestLog = log.timestamp;
    }
  });
  
  return analysis;
}

// Fonction principale de nettoyage
async function cleanupLogs() {
  console.log(chalk.cyan.bold('\n🧹 Nettoyage des Logs\n'));
  
  const spinner = ora('Analyse des logs...').start();
  
  try {
    // Calculer la date limite
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days));
    
    // Construire la requête
    let query = supabase
      .from('application_logs')
      .select('*')
      .lt('timestamp', cutoffDate.toISOString());
    
    // Filtrer par niveau si spécifié
    if (options.level) {
      query = query.eq('level', options.level);
    }
    
    // Exclure les erreurs si demandé
    if (options.keepErrors) {
      query = query.not('level', 'in', '(error,fatal)');
    }
    
    // Récupérer les logs à supprimer
    const { data: logsToDelete, error } = await query;
    
    if (error) {
      spinner.fail('Erreur lors de la récupération des logs');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
    
    if (!logsToDelete || logsToDelete.length === 0) {
      spinner.succeed('Aucun log à nettoyer');
      return;
    }
    
    spinner.succeed(`${logsToDelete.length} logs trouvés`);
    
    // Analyser les logs
    console.log(chalk.yellow('\n📊 Analyse des logs à supprimer:\n'));
    const analysis = await analyzeLogs(logsToDelete);
    
    console.log(chalk.white(`  Total: ${chalk.bold(analysis.total)} logs`));
    console.log(chalk.white(`  Période: ${new Date(analysis.oldestLog).toLocaleDateString()} → ${new Date(analysis.newestLog).toLocaleDateString()}`));
    console.log(chalk.white(`  Taille: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`));
    
    console.log(chalk.white('\n  Par niveau:'));
    Object.entries(analysis.byLevel).forEach(([level, count]) => {
      const color = {
        debug: chalk.gray,
        info: chalk.blue,
        warn: chalk.yellow,
        error: chalk.red,
        fatal: chalk.bgRed
      }[level] || chalk.white;
      
      console.log(`    ${color(`${level}: ${count}`)}`);
    });
    
    console.log(chalk.white('\n  Top 5 composants:'));
    Object.entries(analysis.byComponent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([component, count]) => {
        console.log(`    ${component}: ${count}`);
      });
    
    // Mode dry-run
    if (options.dryRun) {
      console.log(chalk.yellow('\n⚠️  Mode simulation activé - Aucune suppression effectuée'));
      return;
    }
    
    // Confirmation
    console.log('');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmation = await new Promise(resolve => {
      readline.question(chalk.red(`\n⚠️  Confirmer la suppression de ${logsToDelete.length} logs? (oui/non) `), resolve);
    });
    
    readline.close();
    
    if (confirmation.toLowerCase() !== 'oui') {
      console.log(chalk.yellow('\nSuppression annulée'));
      return;
    }
    
    // Archivage si demandé
    if (options.archive) {
      const archiveSpinner = ora('Archivage des logs...').start();
      try {
        const archivePath = await archiveLogs(logsToDelete);
        archiveSpinner.succeed(`Logs archivés dans: ${archivePath}`);
      } catch (error) {
        archiveSpinner.fail('Erreur lors de l\'archivage');
        console.error(chalk.red(error.message));
        return;
      }
    }
    
    // Suppression
    const deleteSpinner = ora('Suppression des logs...').start();
    
    // Supprimer par batch pour éviter les timeouts
    const batchSize = 1000;
    let deleted = 0;
    
    for (let i = 0; i < logsToDelete.length; i += batchSize) {
      const batch = logsToDelete.slice(i, i + batchSize);
      const ids = batch.map(log => log.id);
      
      const { error: deleteError } = await supabase
        .from('application_logs')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        deleteSpinner.fail(`Erreur lors de la suppression du batch ${i / batchSize + 1}`);
        console.error(chalk.red(deleteError.message));
        break;
      }
      
      deleted += batch.length;
      deleteSpinner.text = `Suppression des logs... ${deleted}/${logsToDelete.length}`;
    }
    
    deleteSpinner.succeed(`${deleted} logs supprimés avec succès`);
    
    // Statistiques finales
    console.log(chalk.green('\n✅ Nettoyage terminé!\n'));
    
    // Afficher l'espace libéré
    const { data: remaining } = await supabase
      .from('application_logs')
      .select('id', { count: 'exact', head: true });
    
    console.log(chalk.cyan(`Logs restants: ${remaining?.length || 0}`));
    
  } catch (error) {
    spinner.fail('Erreur lors du nettoyage');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Configuration de maintenance automatique
async function setupAutoCleanup() {
  console.log(chalk.cyan('\n🔧 Configuration du nettoyage automatique\n'));
  
  const cron = require('node-cron');
  const fs = require('fs').promises;
  const path = require('path');
  
  const configPath = path.join(process.cwd(), '.cleanup-config.json');
  
  const config = {
    enabled: true,
    schedule: '0 3 * * *', // Tous les jours à 3h du matin
    retentionDays: options.days,
    keepErrors: options.keepErrors,
    archive: options.archive
  };
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green('✅ Configuration sauvegardée'));
  console.log(chalk.white(`\nPour activer le nettoyage automatique, ajoutez cette ligne à votre crontab:`));
  console.log(chalk.yellow(`0 3 * * * cd ${process.cwd()} && node scripts/cleanup-logs.js --days ${options.days}\n`));
}

// Menu principal
async function main() {
  if (program.args.includes('setup')) {
    await setupAutoCleanup();
  } else {
    await cleanupLogs();
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Erreur non gérée:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Promise rejetée:'), error);
  process.exit(1);
});

// Lancer le script
main().catch((error) => {
  console.error(chalk.red('\n❌ Erreur:'), error);
  process.exit(1);
});