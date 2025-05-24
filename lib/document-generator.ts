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
    
    try {
      logger.info('DOCUMENT_GENERATOR', 'load_templates_start', 'Début du chargement des templates');
      
      // Charger le template de protection
      const protectionPath = path.join(process.cwd(), 'templates', 'protection.html');
      this.protectionTemplate = await fs.readFile(protectionPath, 'utf-8');
      logger.debug('DOCUMENT_GENERATOR', 'load_protection_template', 'Template de protection chargé', {
        path: protectionPath,
        size: this.protectionTemplate.length,
      });
      
      // Charger les templates de documents
      const templateTypes: DocumentType[] = ['vente', 'compte-rendu', 'onboarding'];
      
      for (const type of templateTypes) {
        const templatePath = path.join(process.cwd(), 'templates', type, 'template.html');
        try {
          const template = await fs.readFile(templatePath, 'utf-8');
          this.templates.set(type, template);
          
          logger.debug('DOCUMENT_GENERATOR', 'load_template', `Template ${type} chargé`, {
            type,
            path: templatePath,
            size: template.length,
          });
        } catch (error) {
          logger.error('DOCUMENT_GENERATOR', 'load_template_error', `Erreur chargement template ${type}`, {
            type,
            path: templatePath,
            error: error instanceof Error ? error.message : error,
          });
          throw error;
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('DOCUMENT_GENERATOR', 'load_templates_success', 'Templates chargés avec succès', {
        count: this.templates.size,
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('DOCUMENT_GENERATOR', 'load_templates_error', 'Erreur lors du chargement des templates', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Génère un document HTML personnalisé
   */
  static generateDocument(
    client: ClientData, 
    type: DocumentType
  ): string {
    const startTime = Date.now();
    
    try {
      logger.debug('DOCUMENT_GENERATOR', 'generate_start', `Génération document ${type}`, {
        client_email: client.email,
        document_type: type,
      });
      
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template non trouvé pour le type: ${type}`);
      }
      
      // Préparer les variables selon le type de document
      const variables = this.prepareVariables(client, type);
      
      // Remplacer les variables dans le template
      let html = template;
      let replacementCount = 0;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const matches = html.match(regex);
        if (matches) {
          replacementCount += matches.length;
        }
        html = html.replace(regex, value || '');
      });
      
      // Détecter les variables non remplacées (IMPORTANT pour le débogage)
      const unreplacedVariables = html.match(/{{[^}]+}}/g);
      if (unreplacedVariables && unreplacedVariables.length > 0) {
        console.error('⚠️ Variables non remplacées:', unreplacedVariables);
        logger.error('DOCUMENT_GENERATOR', 'unreplaced_variables', 'Variables non remplacées détectées', {
          client_email: client.email,
          document_type: type,
          unreplaced: unreplacedVariables,
        });
      }
      
      logger.debug('DOCUMENT_GENERATOR', 'variables_replaced', 'Variables remplacées', {
        client_email: client.email,
        document_type: type,
        variables_count: Object.keys(variables).length,
        replacements_count: replacementCount,
      });
      
      // Ajouter la protection par mot de passe
      const protectedHtml = this.addPasswordProtection(html, client.prenom);
      
      const duration = Date.now() - startTime;
      logger.info('DOCUMENT_GENERATOR', 'generate_success', `Document ${type} généré`, {
        client_email: client.email,
        document_type: type,
        duration_ms: duration,
        final_size: protectedHtml.length,
      });
      
      return protectedHtml;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('DOCUMENT_GENERATOR', 'generate_error', `Erreur génération ${type}`, {
        client_email: client.email,
        document_type: type,
        error: error instanceof Error ? error.message : error,
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
    
    // Pour TOUS les types de documents, on prend TOUTES les variables du CSV
    // Cela permet une flexibilité maximale
    const allVariables = {
      ...baseVariables,
      
      // On parcourt TOUTES les propriétés du client
      // et on les convertit en variables de template
      ...Object.entries(client).reduce((acc, [key, value]) => {
        // Convertir la clé en majuscules pour matcher les templates
        const templateKey = key.toUpperCase();
        acc[templateKey] = String(value || '');
        return acc;
      }, {} as Record<string, string>)
    };
    
    return allVariables;
  }
  
  /**
   * Ajoute la protection par mot de passe
   */
  private static addPasswordProtection(content: string, clientName: string): string {
    if (!this.protectionTemplate) {
      throw new Error('Template de protection non chargé');
    }
    
    // Encoder le contenu en base64 pour éviter les problèmes d'échappement
    const encodedContent = Buffer.from(content).toString('base64');
    
    // Remplacer les variables dans le template de protection
    let protectedHtml = this.protectionTemplate;
    protectedHtml = protectedHtml.replace(/{{CLIENT_NAME}}/g, clientName);
    protectedHtml = protectedHtml.replace(/{{ACCESS_CODE}}/g, process.env.ACCESS_CODE || '7744');
    protectedHtml = protectedHtml.replace(/{{ENCODED_CONTENT}}/g, encodedContent);
    
    return protectedHtml;
  }
  
  /**
   * Génère un nom de fichier unique
   */
  static generateFileName(client: ClientData, type: DocumentType): string {
    const prenom = client.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    return `${prenom}_${type}_${timestamp}.html`;
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