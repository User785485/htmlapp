import { ClientData, DocumentType } from './types';
import { logger } from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DocumentGenerator {
  private static protectionTemplate: string | null = null;
  private static templates: Map<DocumentType, string> = new Map();
  
  /**
   * Charge tous les templates au démarrage
   */
  static async loadTemplates(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🔍 Début du chargement des templates...');
    try {
      logger.info('DOCUMENT_GENERATOR', 'load_templates_start', 'Début du chargement des templates');
      
      // Charger le template de protection avec encodage UTF-8 EXPLICITE
      const protectionPath = path.join(process.cwd(), 'templates', 'protection.html');
      console.log(`📦 Chargement du template de protection depuis: ${protectionPath}`);
      
      // CRITIQUE : Spécifier l'encodage UTF-8 explicitement
      this.protectionTemplate = await fs.readFile(protectionPath, { encoding: 'utf8' });
      
      // Vérifier la validité de l'encodage UTF-8
      if (this.protectionTemplate.includes('â€')) {
        console.error(`❌ PROBLÈME D'ENCODAGE détecté dans le template de protection`);
        throw new Error(`Problème d'encodage UTF-8 dans le template de protection`);
      }
      
      console.log(`✅ Template de protection chargé (${this.protectionTemplate.length} caractères)`);
      
      // Charger les templates de documents
      const templateTypes: DocumentType[] = ['vente', 'compte-rendu', 'onboarding'];
      console.log(`📁 Types de templates à charger: ${templateTypes.join(', ')}`);
      
      for (const type of templateTypes) {
        const templatePath = path.join(process.cwd(), 'templates', type, 'template.html');
        console.log(`📦 Chargement du template '${type}' depuis: ${templatePath}`);
        
        try {
          // CRITIQUE : Spécifier l'encodage UTF-8 explicitement
          const template = await fs.readFile(templatePath, { encoding: 'utf8' });
          
          // Vérifier la validité de l'encodage UTF-8
          if (template.includes('â€')) {
            console.error(`❌ PROBLÈME D'ENCODAGE détecté dans ${type}`);
            throw new Error(`Problème d'encodage UTF-8 dans le template ${type}`);
          }
          
          this.templates.set(type, template);
          
          // Analyser le contenu du template pour détecter les variables
          const templateVariables = template.match(/{{([^}]+)}}/g) || [];
          const uniqueVars = Array.from(new Set(templateVariables.map(v => v.replace(/[{}]/g, ''))));
          
          console.log(`✅ Template '${type}' chargé avec succès:`);
          console.log(`   - Taille: ${template.length} caractères`);
          console.log(`   - Variables détectées: ${uniqueVars.length}`);
          console.log(`   - Premières variables: ${uniqueVars.slice(0, 10).join(', ')}`);
          
        } catch (error) {
          console.error(`❌ Erreur lors du chargement du template '${type}':`, error);
          throw error;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`🔔 Tous les templates chargés en ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ ERREUR CRITIQUE: Impossible de charger les templates:', error);
      throw error;
    }
  }
  
  /**
   * Génère un document HTML personnalisé - VERSION SILENCIEUSE SANS BARRE DE DEBUG
   */
  static generateDocument(client: ClientData, type: DocumentType): string {
    const startTime = Date.now();
    
    // DÉSACTIVER TEMPORAIREMENT LES LOGS CONSOLE POUR ÉVITER L'INJECTION
    // DE LA BARRE DE DÉBOGAGE VERTE
    // ========================================
    // DÉSACTIVER LES FONCTIONS CONSOLE
    // ========================================
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Mode silencieux pour éviter les logs qui seraient capturés et affichés
    // En production, on désactive complètement les logs pour éviter toute injection
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Configuration explicite: désactivation PERMANENTE de la barre de débogage
    const SHOW_DEBUG_BAR = false; // Toujours désactivé en production
    
    try {
      // 1. RÉCUPÉRATION DU TEMPLATE
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template ${type} non trouvé - loadTemplates() appelé ?`);
      }
      
      // 2. DIAGNOSTIC ET CORRECTION D'ENCODAGE (silencieux)
      const encodingProblems = [];
      if (template.includes('â€')) encodingProblems.push('â€');
      if (template.includes('Ã©')) encodingProblems.push('Ã©');
      if (template.includes('Ã ')) encodingProblems.push('Ã ');
      if (template.includes('âŸ')) encodingProblems.push('âŸ');
      if (template.includes('âc')) encodingProblems.push('âc');
      if (template.includes('spÃ©')) encodingProblems.push('spÃ©');
      if (template.includes('rÃ©')) encodingProblems.push('rÃ©');
      if (template.includes('Ã©co')) encodingProblems.push('Ã©co');
      
      // 3. CORRECTION ENCODAGE ÉTENDUE (silencieux)
      let cleanTemplate = template;
      if (encodingProblems.length > 0) {
        cleanTemplate = template
          // Corrections de base
          .replace(/â€/g, '✨')
          .replace(/Ã©/g, 'é')
          .replace(/Ã /g, 'à')
          .replace(/Ã¨/g, 'è')
          .replace(/Ã§/g, 'ç')
          .replace(/Ã´/g, 'ô')
          .replace(/Ã¢/g, 'â')
          .replace(/Ãª/g, 'ê')
          .replace(/Ã¯/g, 'ï')
          .replace(/Ã¹/g, 'ù')
          .replace(/ð/g, '✨')
          .replace(/â€™/g, "'")
          .replace(/â€œ/g, '"')
          .replace(/â€/g, '"')
          // NOUVELLES CORRECTIONS SPÉCIFIQUES
          .replace(/âŸ/g, '✨')
          .replace(/âc/g, '™')
          .replace(/spÃ©/g, 'spé')
          .replace(/rÃ©/g, 'ré')
          .replace(/Ã©co/g, 'éco')
          .replace(/TRANSFORMATIONâŸc/g, 'LOVE TRANSFORMATION™')
          .replace(/TRANSFORMATIONâc/g, 'LOVE TRANSFORMATION™');
      }
      
      // 4. ANALYSE DES VARIABLES TEMPLATE (silencieux)
      const templateVariables = cleanTemplate.match(/{{([^}]+)}}/g) || [];
      // Correction pour compatibilité ES5 - sans utiliser [...Set] qui n'est pas supporté par la config TypeScript actuelle
      const varsSet = new Set(templateVariables.map(v => v.replace(/[{}]/g, '')));
      const uniqueVars = Array.from(varsSet);
      
      // 5. PRÉPARATION DES VARIABLES (silencieux)
      const variables = this.prepareVariables(client, type);
      
      // 6. AJOUT VALEURS PAR DÉFAUT FORCÉES (silencieux)
      const forcedDefaults = {
        'PLACES_DISPONIBLES': '7',
        'FORMULE_RECOMMANDEE': 'LA PLUS POPULAIRE',
        'MENSUALITE_3X': '665€',
        'PRIX_UNIQUE': '1997€',
        'FAQ_QUESTION_1': 'Comment ce programme peut-il m\'aider dans ma quête amoureuse ?',
        'FAQ_REPONSE_1': 'Ce programme t\'accompagne dans un cheminement spirituel profond qui harmonise ta foi et tes besoins affectifs.',
        'MESSAGE_BIENVENUE_SPIRITUEL': 'Qu\'Allah te bénisse dans cette démarche sincère vers l\'amour halal.',
        'PONT_EMOTIONNEL_INTRODUCTION': 'Je comprends cette tension entre respecter sa foi et aspirer à l\'amour véritable.',
        'NUMERO_WHATSAPP': '+33123456789',
        'DATE_DEBUT_PROGRAMME': 'La prochaine session débute dans 7 jours'
      };
      
      // Forcer les valeurs par défaut
      Object.entries(forcedDefaults).forEach(([key, defaultValue]) => {
        variables[key] = defaultValue;
      });
      
      // 7. GESTION DES VARIABLES MANQUANTES (silencieux)
      const missingVars = uniqueVars.filter(v => !variables[v]);
      missingVars.forEach(varName => {
        variables[varName] = `[${varName}]`;
      });
      
      // 8. REMPLACEMENT COMPLET DES VARIABLES (silencieux)
      let html = cleanTemplate;
      let totalReplacements = 0;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const matches = html.match(regex);
        
        if (matches) {
          totalReplacements += matches.length;
          html = html.replace(regex, value);
        }
      });
      
      // 9. VÉRIFICATION FINALE SILENCIEUSE
      const unreplacedVars = html.match(/{{[^}]+}}/g);
      
      // 10. NETTOYAGE ET FINALISATION DU HTML
      let finalHtml = html;
      
      // Patterns pour supprimer toute barre de debug potentielle dans le HTML statique
      // Ces patterns sont conservés pour nettoyer tout code de débogage existant qui pourrait être dans les templates
      const debugBarPatterns = [
        /<div[^>]*style="[^"]*position:\s*fixed[^"]*background:\s*#28a745[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<div[^>]*style='[^']*position:\s*fixed[^']*background:\s*#28a745[^']*'[^>]*>[\s\S]*?<\/div>/gi,
        /<div[^>]*(?:class|id)="[^"]*debug[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<div[^>]*>[\s\S]*?\|\s*Type:\s*\w+[\s\S]*?<\/div>/gi,
        /<div[^>]*information de débogage[^>]*>[\s\S]*?<\/div>/gi,
        /<div[^>]*debug\-bar[^>]*>[\s\S]*?<\/div>/gi,
      ];
      
      // Toujours supprimer les éléments de débogage existants dans le HTML
      debugBarPatterns.forEach(pattern => {
        finalHtml = finalHtml.replace(pattern, '');
      });
      
      // Nettoyer les divs vides et l'espacement excessif
      finalHtml = finalHtml.replace(/<div[^>]*>\s*<\/div>/gi, '');
      finalHtml = finalHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // 11. SCRIPT DE SÉCURITÉ POUR SUPPRIMER TOUTE BARRE DE DÉBOGAGE RÉSIDUELLE
      // La barre de débogage est désactivée via SHOW_DEBUG_BAR = false
      // Ce script est une mesure de sécurité supplémentaire pour garantir qu'aucune barre n'apparaît
      // ========================================
      // INJECTION DU SCRIPT ANTI-BARRE DE DEBUG
      // ========================================

      // SOLUTION ULTRA-RADICALE : Script de suppression de la barre verte
      const antiDebugScript = `
<script>
(function() {
    'use strict';
    function killDebugBar() {
        let removedCount = 0;
        
        // Sélecteurs hyper-agressifs pour cibler toute barre verte potentielle
        const selectors = [
            // Par couleur
            'div[style*="#28a745"]',
            'div[style*="rgb(40, 167, 69)"]',
            'div[style*="green"]',
            // Par position
            'div[style*="position: fixed"]',
            'div[style*="position:fixed"]',
            // Par classe/id
            '.debug-bar', '#debug-bar',
            '[class*="debug"]', '[id*="debug"]',
            // Combinaisons spécifiques
            'div[style*="z-index: 9999"]',
            'div[style*="top: 0"][style*="position: fixed"]',
            'div[style*="top:0"][style*="position:fixed"]'
        ];
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                        removedCount++;
                    }
                });
            } catch (e) {}
        });
        
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
            const text = div.textContent || '';
            const style = div.getAttribute('style') || '';
            
            const hasDebugContent = 
                text.includes('Variables:') ||
                text.includes('Encodage:') ||
                text.includes('Non remplacées:') ||
                text.includes('Marie Martin') ||
                text.includes('Type: vente') ||
                text.includes('Type: compte-rendu') ||
                text.includes('Type: onboarding');
                
            const hasDebugStyle = 
                style.includes('#28a745') ||
                style.includes('position: fixed') ||
                style.includes('position:fixed');
            
            if ((hasDebugContent || hasDebugStyle) && div.parentNode) {
                div.parentNode.removeChild(div);
                removedCount++;
            }
        });
        
        return removedCount;
    }
    
    function setupWatch() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node;
                            const style = element.getAttribute ? element.getAttribute('style') : '';
                            const text = element.textContent || '';
                            
                            if (
                                style.includes('#28a745') ||
                                text.includes('Variables:') ||
                                text.includes('Marie Martin')
                            ) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                setTimeout(killDebugBar, 10);
            }
        });
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
        
        return observer;
    }
    
    function init() {
        killDebugBar();
        setupWatch();
        
        setInterval(killDebugBar, 2000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.addEventListener('load', () => {
        setTimeout(killDebugBar, 100);
    });
    
})();
</script>`;

      // N'ajouter le script anti-debug que si nécessaire (par sécurité)
      // Même si SHOW_DEBUG_BAR = false, on ajoute quand même le script comme mesure de sécurité
      // pour s'assurer qu'aucune barre ne puisse être injectée par un autre moyen
      if (finalHtml.includes('</body>')) {
          finalHtml = finalHtml.replace('</body>', `${antiDebugScript}
</body>`);
      } else {
          // Si pas de </body>, ajouter à la fin
          finalHtml += antiDebugScript;
      }

      console.log('🛡️ Protection anti-barre de debug injectée dans le document');
      
      // ========================================
      // RESTAURER LES FONCTIONS CONSOLE
      // ========================================
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      
      // LOGS DE DIAGNOSTIC POUR BARRE DE DÉBOGAGE
      console.log(`🔍 Début de la recherche de barre de débogage dans le HTML généré...`);
      console.log(`Document final généré (premiers 500 caractères): ${finalHtml.substring(0, 500).replace(/\n/g, '').replace(/\s+/g, ' ')}`);
      
      // Recherche d'indices de barre de débogage
      const hasGreenColor = finalHtml.includes('#28a745');
      const hasFixedPosition = finalHtml.includes('position: fixed') || finalHtml.includes('position:fixed');
      const hasDebugText = finalHtml.includes('Variables:') || finalHtml.includes('Encodage:') || finalHtml.includes('Non remplacées:');
      
      console.log(`Vérification présence #28a745 (vert): ${hasGreenColor ? '⚠️ PRÉSENTE' : '✅ ABSENTE'}`);
      console.log(`Vérification présence position: fixed: ${hasFixedPosition ? '⚠️ PRÉSENTE' : '✅ ABSENTE'}`);
      console.log(`Vérification présence texte debug: ${hasDebugText ? '⚠️ PRÉSENT' : '✅ ABSENT'}`);
      
      // Script de diagnostic pour inspection côté client
      const clientInspectionScript = `
<script>
  console.log("🔍 Analyse du DOM pour détecter la barre de débogage");
  document.addEventListener('DOMContentLoaded', () => {
    const debugElements = document.querySelectorAll('div[style*=\"#28a745\"], div[style*=\"position: fixed\"]');
    console.log("💡 Éléments potentiels de débogage trouvés: " + debugElements.length);
    debugElements.forEach(el => console.log("Source HTML:", el.outerHTML));
  });
</script>`;
      
      // Ajouter le script de diagnostic avant le script anti-barre de débogage
      if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `${clientInspectionScript}
</body>`);
      } else {
        finalHtml += clientInspectionScript;
      }
      
      console.log(`🔍 Script de diagnostic côté client ajouté au document`);
      
      // Log final de succès (maintenant que console.log est restauré)
      const duration = Date.now() - startTime;
      console.log(`✅ Document ${type} généré silencieusement pour ${client.prenom} ${client.nom} (${finalHtml.length} caractères) en ${duration}ms`);
      
      return finalHtml;
      
    } catch (error) {
      // RESTAURER LES FONCTIONS CONSOLE EN CAS D'ERREUR
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      
      // Maintenant on peut logger l'erreur
      console.error('❌ ERREUR CRITIQUE dans generateDocument:', error);
      
      // En cas d'erreur, retourner un HTML d'erreur informatif
      return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Erreur - ${type}</title></head>
<body style="font-family: Arial; padding: 20px; background: #f8d7da; color: #721c24;">
  <h1>❌ Erreur de génération</h1>
  <p><strong>Type:</strong> ${type}</p>
  <p><strong>Client:</strong> ${client.email}</p>
  <p><strong>Erreur:</strong> ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
  <p>Contactez le support technique.</p>
</body>
</html>`;
    }
  }
  
  /**
   * Prépare les variables selon le type de document (VERSION SILENCIEUSE)
   */
  private static prepareVariables(client: ClientData, type: DocumentType): Record<string, string> {
    // Variables de base toujours présentes
    const variables: Record<string, string> = {
      PRENOM: client.prenom || '',
      NOM: client.nom || '',
      EMAIL: client.email || '',
      TELEPHONE: client.telephone || '',
      DATE_GENERATION: new Date().toLocaleDateString('fr-FR'),
    };
    
    // Fonction utilitaire pour ajouter des variables (silencieuse)
    const addVariable = (key: string, value: any) => {
      if (value === undefined || value === null) return;
      const upperKey = key.toUpperCase();
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
      variables[upperKey] = stringValue;
    };
    
    // Traitement des donnees_completes (silencieux)
    if (client.donnees_completes) {
      try {
        let donnees;
        if (typeof client.donnees_completes === 'string') {
          donnees = JSON.parse(client.donnees_completes);
        } else {
          donnees = client.donnees_completes;
        }
        
        // Extraction récursive de toutes les variables (silencieuse)
        const extractRecursively = (obj: any, prefix = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}_${key}` : key;
            addVariable(fullKey, value);
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              extractRecursively(value, fullKey);
            }
          });
        };
        
        extractRecursively(donnees);
        
      } catch (error) {
        // Erreur silencieuse - ne pas logger
      }
    }
    
    // Ajouter toutes les autres propriétés du client (silencieux)
    Object.entries(client).forEach(([key, value]) => {
      if (!['prenom', 'nom', 'email', 'telephone', 'donnees_completes'].includes(key.toLowerCase())) {
        addVariable(key, value);
      }
    });
    
    return variables;
  }
  
  /**
   * Génère un nom de fichier unique
   */
  static generateFileName(client: ClientData, type: DocumentType): string {
    const prenom = (client.prenom || 'client').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nom = (client.nom || 'doc').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const fileName = `${prenom}_${nom}_${type}_${timestamp}_${randomSuffix}.html`;
    console.log(`📁 Nom de fichier généré: ${fileName}`);
    return fileName;
  }
  
  /**
   * Génère tous les documents pour un client
   */
  static async generateAllDocuments(client: ClientData): Promise<Record<DocumentType, { content: string; filename: string }>> {
    const startTime = Date.now();
    
    logger.info('DOCUMENT_GENERATOR', 'generate_all_start', 'Génération de tous les documents', {
      client_email: client.email,
      client_name: `${client.prenom} ${client.nom}`,
    });
    
    const documents: Record<string, { content: string; filename: string }> = {};
    const types: DocumentType[] = ['vente', 'compte-rendu', 'onboarding'];
    let successCount = 0;
    let errorCount = 0;
    
    for (const type of types) {
      try {
        const content = this.generateDocument(client, type);
        const filename = this.generateFileName(client, type);
        documents[type] = { content, filename };
        successCount++;
        
        logger.debug('DOCUMENT_GENERATOR', 'document_generated', `Document ${type} généré`, {
          client_email: client.email,
          type,
          filename,
          content_size: content.length,
        });
      } catch (error) {
        errorCount++;
        logger.error('DOCUMENT_GENERATOR', 'generate_document_error', `Erreur génération ${type}`, {
          client_email: client.email,
          type,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('DOCUMENT_GENERATOR', 'generate_all_complete', 'Génération terminée', {
      client_email: client.email,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration,
    });
    
    return documents as Record<DocumentType, { content: string; filename: string }>;
  }
}