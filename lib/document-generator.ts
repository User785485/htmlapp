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
      
      // Charger le template de protection
      const protectionPath = path.join(process.cwd(), 'templates', 'protection.html');
      console.log(`📦 Chargement du template de protection depuis: ${protectionPath}`);
      this.protectionTemplate = await fs.readFile(protectionPath, 'utf-8');
      console.log(`✅ Template de protection chargé (${this.protectionTemplate.length} caractères)`);
      logger.debug('DOCUMENT_GENERATOR', 'load_protection_template', 'Template de protection chargé', {
        path: protectionPath,
        size: this.protectionTemplate.length,
      });
      
      // Charger les templates de documents
      const templateTypes: DocumentType[] = ['vente', 'compte-rendu', 'onboarding'];
      console.log(`📁 Types de templates à charger: ${templateTypes.join(', ')}`);
      
      for (const type of templateTypes) {
        const templatePath = path.join(process.cwd(), 'templates', type, 'template.html');
        console.log(`📦 Chargement du template '${type}' depuis: ${templatePath}`);
        
        try {
          const template = await fs.readFile(templatePath, 'utf-8');
          this.templates.set(type, template);
          
          // Analyser le contenu du template pour détecter les variables
          const templateVariables = template.match(/{{([^}]+)}}/g) || [];
          const uniqueVars = Array.from(new Set(templateVariables.map(v => v.replace(/[{}]/g, ''))));
          
          console.log(`✅ Template '${type}' chargé avec succès:`);
          console.log(`   - Taille: ${template.length} caractères`);
          console.log(`   - Variables détectées: ${uniqueVars.length} (${uniqueVars.slice(0, 5).join(', ')}${uniqueVars.length > 5 ? '...' : ''})`);
          
          logger.debug('DOCUMENT_GENERATOR', 'load_template', `Template ${type} chargé`, {
            type,
            path: templatePath,
            size: template.length,
            variables_count: uniqueVars.length,
            variables: uniqueVars,
          });
        } catch (error) {
          console.error(`❌ Erreur lors du chargement du template '${type}':`, error);
          logger.error('DOCUMENT_GENERATOR', 'load_template_error', `Erreur chargement template ${type}`, {
            type,
            path: templatePath,
            error: error instanceof Error ? error.message : error,
          });
          throw error;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`🔔 Tous les templates chargés en ${duration}ms. Templates disponibles: ${Array.from(this.templates.keys()).join(', ')}`);
      logger.info('DOCUMENT_GENERATOR', 'load_templates_success', 'Templates chargés avec succès', {
        count: this.templates.size,
        duration_ms: duration,
        template_types: Array.from(this.templates.keys()),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ ERREUR CRITIQUE: Impossible de charger les templates:', error);
      logger.error('DOCUMENT_GENERATOR', 'load_templates_error', 'Erreur lors du chargement des templates', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Génère un document HTML personnalisé avec logs détaillés pour débogage
   */
  static generateDocument(
    client: ClientData, 
    type: DocumentType
  ): string {
    const startTime = Date.now();
    
    // Afficher l'en-tête du processus de génération
    console.log('='.repeat(80));
    console.log(`🚀 DÉBUT GÉNÉRATION DOCUMENT: ${type.toUpperCase()} - ${client.prenom} ${client.nom}`);
      console.log('\n🔍 ÉTAPE 2: ANALYSE DES VARIABLES DU TEMPLATE');
      
      // Rechercher toutes les occurrences de {{VARIABLE}}
      const templateVariables = template.match(/{{([^}]+)}}/g) || [];
      const uniqueTemplateVars = Array.from(new Set(templateVariables.map(v => v.replace(/[{}]/g, ''))));
      
      console.log(`📊 Statistiques: ${templateVariables.length} occurrences, ${uniqueTemplateVars.length} variables uniques`);
      
      // Lister les 10 premières variables
      if (uniqueTemplateVars.length > 0) {
        console.log(`📋 Exemples de variables: ${uniqueTemplateVars.slice(0, 10).join(', ')}${uniqueTemplateVars.length > 10 ? '...' : ''}`);
      } else {
        console.warn('⚠️ ATTENTION: Aucune variable détectée dans le template!');
      }
      
      // ÉTAPE 3: Préparation des variables
      console.log('\n📝 ÉTAPE 3: PRÉPARATION DES VARIABLES');
      const variables = this.prepareVariables(client, type);
      console.log(`📊 Variables préparées: ${Object.keys(variables).length}`);
      
      // ÉTAPE 4: Validation de la correspondance
      console.log('\n🔎 ÉTAPE 4: VALIDATION DE LA CORRESPONDANCE');
      
      const presentVars = uniqueTemplateVars.filter(v => variables[v]);
      const missingVars = uniqueTemplateVars.filter(v => !variables[v]);
      
      console.log(`📊 Bilan: ${presentVars.length}/${uniqueTemplateVars.length} variables correspondantes, ${missingVars.length} manquantes`);
      
      if (missingVars.length > 0) {
        console.warn(`⚠️ Variables manquantes: ${missingVars.join(', ')}`);
      }
      
      // ÉTAPE 5: Remplacement des variables
      console.log('\n🔄 ÉTAPE 5: REMPLACEMENT DES VARIABLES');
      
      let html = template;
      let replacementCount = 0;
      let replacementFailed = 0;
      
      // Effectuer les remplacements
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const matches = html.match(regex);
        
        if (matches) {
          replacementCount += matches.length;
          const displayValue = value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '[VIDE]';
          console.log(`✅ {{${key}}} → ${displayValue} (${matches.length}x)`);
          
          const originalHtml = html;
          html = html.replace(regex, value || '');
          
          if (originalHtml === html) {
            console.error(`❌ Échec du remplacement pour {{${key}}}!`);
            replacementFailed++;
          }
        }
      });
      
      // ÉTAPE 6: Vérification finale
      console.log('\n🔎 ÉTAPE 6: VÉRIFICATION FINALE');
      
      const unreplacedVariables = html.match(/{{[^}]+}}/g);
      
      if (unreplacedVariables && unreplacedVariables.length > 0) {
        console.error(`❌ ${unreplacedVariables.length} variables non remplacées: ${unreplacedVariables.join(', ')}`);
        
        unreplacedVariables.forEach(variable => {
          const varName = variable.replace(/[{}]/g, '');
          if (variables[varName]) {
            console.error(`   ⁉️ ${variable}: Existe dans le dictionnaire mais non remplacée`);
          } else {
            console.error(`   ❓ ${variable}: N'existe pas dans le dictionnaire`);
          }
        });
        
        logger.error('DOCUMENT_GENERATOR', 'unreplaced_variables', 'Variables non remplacées', {
          client_email: client.email,
          document_type: type,
          unreplaced: unreplacedVariables,
          variables_keys: Object.keys(variables)
      // Bilan des remplacements
      console.log(`📊 Bilan: ${replacementCount} remplacements réussis, ${missingVars.length} variables non remplacées`);
      
      // ÉTAPE 7: TEMPORAIREMENT DÉSACTIVÉE - Pas de protection par mot de passe
      console.log('🔒 ÉTAPE 7: PROTECTION DU DOCUMENT DÉSACTIVÉE');
      console.log('⚠️ Test sans protection par mot de passe - Retour du HTML brut');
      
      // Finalisation
      const duration = Date.now() - startTime;
      
      // Créer un div de débogage pour afficher les logs directement dans le HTML
      const debugInfoDiv = `
<div style="position: fixed; top: 0; left: 0; right: 0; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 15px; z-index: 9999; font-family: monospace; max-height: 50vh; overflow-y: auto;">
  <h3 style="margin-top: 0; color: #0d6efd;">Information de débogage HTML (v2)</h3>
  <p><strong>Type de document:</strong> ${type}</p>
  <p><strong>Client:</strong> ${client.email} (${client.prenom || 'Pas de prénom'} ${client.nom || 'Pas de nom'})</p>
  <p><strong>Généré en:</strong> ${duration}ms</p>
  <p><strong>Taille du HTML:</strong> ${html.length} caractères</p>
  <p><strong>Variables remplacées:</strong> ${replacementCount}</p>
  <p><strong>Variables non remplacées:</strong> ${missingVars.length}</p>
  <div style="margin-top: 10px;">
    <button onclick="document.getElementById('debug-variables').style.display = document.getElementById('debug-variables').style.display === 'none' ? 'block' : 'none'" style="background-color: #0d6efd; color: white; border: none; padding: 5px 10px; cursor: pointer;">
      Afficher/Masquer les variables
    </button>
    <div id="debug-variables" style="display: none; margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 4px;">
      <h4>Variables utilisées:</h4>
      <pre>${JSON.stringify(variables, null, 2)}</pre>
    </div>
  </div>
  <div style="margin-top: 10px;">
    <button onclick="this.parentNode.parentNode.style.display = 'none'" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer;">
      Fermer cette barre
    </button>
  </div>
</div>
`;
      
      // Insérer le div de débogage dans le HTML (juste après le tag <body>)
      const finalHtml = html.replace('<body>', '<body>' + debugInfoDiv);
      
      console.log('='.repeat(80));
      console.log(`✅ DOCUMENT GÉNÉRÉ AVEC SUCCÈS en ${duration}ms (${finalHtml.length} caractères)`);
      console.log(`✅ Logs de débogage ajoutés directement dans le HTML`);
      console.log('='.repeat(80));
      
      logger.info('DOCUMENT_GENERATOR', 'generate_success', `Document ${type} généré (sans protection, avec logs)`, {
        client_email: client.email,
        document_type: type,
        duration_ms: duration,
        final_size: finalHtml.length,
        unreplaced_count: missingVars.length
      });
      
      return finalHtml; // Retourne le HTML avec les logs visibles
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('='.repeat(80));
      console.error(`❌ ERREUR DE GÉNÉRATION DU DOCUMENT: ${error instanceof Error ? error.message : error}`);
      console.error('='.repeat(80));
      
      logger.error('DOCUMENT_GENERATOR', 'generate_error', `Erreur génération ${type}`, {
        client_email: client.email,
        document_type: type,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      });
      
      throw error;
    }
  }
  
  /**
   * Prépare les variables selon le type de document
   */
  private static prepareVariables(
    client: ClientData, 
    type: DocumentType
  ): Record<string, string> {
    // Variables de base toujours présentes
    const baseVariables = {
      PRENOM: client.prenom,
      NOM: client.nom,
      EMAIL: client.email,
      TELEPHONE: client.telephone,
      DATE_GENERATION: new Date().toLocaleDateString('fr-FR'),
    };
    
    const variables: Record<string, string> = { ...baseVariables };
    
    // Fonction utilitaire pour ajouter des variables avec conversion en majuscules
    const addVariable = (key: string, value: any) => {
      if (value === undefined || value === null) return;
      const upperKey = key.toUpperCase();
      // Convertir les valeurs en string et gérer les cas spéciaux
      let stringValue = '';
      if (typeof value === 'object') {
        try {
          stringValue = JSON.stringify(value);
        } catch (e) {
          stringValue = String(value || '');
        }
      } else {
        stringValue = String(value || '');
      }
      variables[upperKey] = stringValue;
      
      // DEBUG: Tracer chaque variable ajoutée
      console.log(`🔄 Variable ajoutée: ${upperKey} = ${stringValue.substring(0, 30)}${stringValue.length > 30 ? '...' : ''}`);
    };
    
    // EXTRACTION: Extraire les variables du champ donnees_completes
    // Ce champ contient un JSON stringifié avec toutes les variables du template Love Transformation
    if (client.donnees_completes) {
      console.log(`🔍 Traitement de donnees_completes (type: ${typeof client.donnees_completes})`);
      try {
        // Parser le JSON stringifié
        let donnees;
        try {
          // Si c'est une chaîne, essayer de parser le JSON
          if (typeof client.donnees_completes === 'string') {
            donnees = JSON.parse(client.donnees_completes);
            console.log(`✅ JSON parsé avec succès: ${Object.keys(donnees).length} clés au premier niveau`);
          } else {
            // Sinon, c'est déjà un objet
            donnees = client.donnees_completes;
            console.log(`ℹ️ donnees_completes est déjà un objet: ${Object.keys(donnees).length} clés`);
          }
        } catch (e) {
          console.error('⚠️ Erreur de parsing initial:', e);
          // Si le parsing échoue, utiliser tel quel
          donnees = client.donnees_completes;
        }
        
        // TRAITEMENT RECURSIF: Extraire variables de tous les niveaux
        const extractVariablesRecursively = (obj: any, prefix = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}_${key}` : key;
            
            // Si c'est un objet non-null, récursivement extraire ses propriétés
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
              // Ajouter l'objet entier comme variable (sera stringifié)
              addVariable(fullKey, value);
              // Et récursivement traiter ses propriétés
              extractVariablesRecursively(value, fullKey);
            } else {
              // Ajouter la valeur scalaire comme variable
              addVariable(fullKey, value);
            }
          });
        };
        
        // Appliquer l'extraction récursive
        extractVariablesRecursively(donnees);
        
        // CAS SPÉCIAL: Double imbrication de donnees_completes
        if (typeof donnees === 'object' && donnees !== null && donnees.donnees_completes) {
          console.log('🔄 Détection de double imbrication dans donnees_completes');
          try {
            let sousDonnees;
            // Tenter de parser cette sous-propriété si c'est une chaîne JSON
            if (typeof donnees.donnees_completes === 'string') {
              sousDonnees = JSON.parse(donnees.donnees_completes);
              console.log(`✅ Sous-JSON parsé avec succès: ${Object.keys(sousDonnees).length} clés`);
            } else if (typeof donnees.donnees_completes === 'object') {
              sousDonnees = donnees.donnees_completes;
              console.log(`ℹ️ sous-donnees_completes est déjà un objet: ${Object.keys(sousDonnees).length} clés`);
            }
            
            if (sousDonnees) {
              // Ajouter récursivement les sous-variables
              extractVariablesRecursively(sousDonnees);
            }
          } catch (e) {
            console.error('⚠️ Erreur lors du parsing du sous-objet donnees_completes:', e);
          }
        }
        
        console.log(`🔍 Total variables extraites de donnees_completes: ${Object.keys(variables).length - Object.keys(baseVariables).length}`);
      } catch (error) {
        console.error('❌ Erreur lors du traitement de donnees_completes:', error);
        logger.error('DOCUMENT_GENERATOR', 'parse_donnees_completes_error', 'Erreur parsing JSON', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }
    
    // Méthode 1: Utiliser les préfixes selon le type de document
    const prefix = type === 'compte-rendu' ? 'cr_' : type === 'vente' ? 'vente_' : 'onb_';
    console.log(`🔄 Extraction des variables avec préfixe '${prefix}'`);
    
    // Récupérer TOUTES les colonnes qui commencent par le bon préfixe
    Object.entries(client).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        // Enlever le préfixe et mettre en majuscules
        const varName = key.replace(prefix, '').toUpperCase();
        addVariable(varName, value);
      }
    });
    
    // Méthode 2: Compatibilité avec anciens noms de variables (pour les CSV sans préfixes)
    if (type === 'vente') {
      // Mappings pour la page de vente
      if (client.produit && !variables['PRODUIT']) addVariable('PRODUIT', client.produit);
      if (client.prix && !variables['PRIX']) addVariable('PRIX', client.prix);
      if (client.offre_speciale && !variables['OFFRE_SPECIALE']) addVariable('OFFRE_SPECIALE', client.offre_speciale);
      
      // Valeurs par défaut pour les variables courantes qui pourraient manquer
      if (!variables['FORMULE_RECOMMANDEE']) addVariable('FORMULE_RECOMMANDEE', 'Option Recommandée');
      if (!variables['FAQ_QUESTION_1']) addVariable('FAQ_QUESTION_1', 'Comment ce programme peut-il m\'aider ?');
    } else if (type === 'compte-rendu') {
      // Mappings pour le compte-rendu
      if (client.date_rencontre && !variables['DATE_RENCONTRE']) addVariable('DATE_RENCONTRE', client.date_rencontre);
      if (client.objectifs && !variables['OBJECTIFS']) addVariable('OBJECTIFS', client.objectifs);
      if (client.recommandations && !variables['RECOMMANDATIONS']) addVariable('RECOMMANDATIONS', client.recommandations);
    } else if (type === 'onboarding') {
      // Mappings pour l'onboarding
      if (client.etapes_onboarding && !variables['ETAPES']) addVariable('ETAPES', client.etapes_onboarding);
      if (client.conseils_onboarding && !variables['CONSEILS']) addVariable('CONSEILS', client.conseils_onboarding);
    }
    
    // Vérification finale des variables potentiellement manquantes dans le template
    const templateVariablesCheck = [
      'FORMULE_RECOMMANDEE', 'FAQ_QUESTION_1', 'FAQ_REPONSE_1', 
      'PRODUIT', 'PRIX', 'OFFRE_SPECIALE', 
      'PRENOM', 'NOM', 'EMAIL', 'TELEPHONE'
    ];
    
    templateVariablesCheck.forEach(varName => {
      if (!variables[varName]) {
        console.warn(`⚠️ Variable potentiellement manquante: ${varName}`);
      }
    });
    
    // Log des variables disponibles pour debug
    console.log('📊 RÉSUMÉ DES VARIABLES:');
    console.log(`📋 Nombre total de variables: ${Object.keys(variables).length}`);
    console.log('📋 Liste des variables disponibles:', Object.keys(variables).join(', '));
    
    logger.debug('DOCUMENT_GENERATOR', 'variables_prepared', `Variables préparées pour ${type}`, {
      client_email: client.email,
      document_type: type,
      variables_count: Object.keys(variables).length,
      variables: Object.keys(variables)
    });
    
    return variables;
  }
  
  console.log(`📝 Application du template de protection (${this.protectionTemplate.length} caractères)`);
  console.log(`✅ Template de protection chargé avec succès`);
    protectedHtml = protectedHtml.replace(/{{CLIENT_NAME}}/g, clientName);
    protectedHtml = protectedHtml.replace(/{{ACCESS_CODE}}/g, process.env.ACCESS_CODE || '7744');
    protectedHtml = protectedHtml.replace(/{{ENCODED_CONTENT}}/g, encodedContent);
    
    console.log(`✅ Document protégé avec succès (taille finale: ${protectedHtml.length} caractères)`);
    return protectedHtml;
  }
  
  /**
   * Génère un nom de fichier unique avec plus de précision pour éviter les conflits
   */
  static generateFileName(client: ClientData, type: DocumentType): string {
    const prenom = client.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nom = client.nom.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    console.log(`🔍 Génération d'un nom de fichier unique pour ${client.prenom} ${client.nom}, type: ${type}`);
    
    // Format: prenom_nom3_type_timestamp_randomSuffix.html
    const fileName = `${prenom}_${nom}_${type}_${timestamp}_${randomSuffix}.html`;
    console.log(`✅ Nom de fichier généré: ${fileName}`);
    return fileName;
  }
  
  /**
   * Génère tous les documents pour un client
   */
  static async generateAllDocuments(
    client: ClientData
  ): Promise<Record<DocumentType, { content: string; filename: string }>> {
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