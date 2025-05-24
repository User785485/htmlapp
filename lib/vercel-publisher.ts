import { promises as fs } from 'fs';
import path from 'path';
import { DocumentType } from './types';
import { logger } from './logger';

/**
 * Classe pour publier des fichiers HTML sur Vercel
 * Les fichiers sont stockés dans le dossier public/documents/ et accessibles via URL
 */
export class VercelPublisher {
  private baseUrl: string;
  private documentsDir: string;
  private createdFolders: Set<string>;

  constructor() {
    console.log('💥💥💥 ATTENTION: VercelPublisher est maintenant utilisé! 💥💥💥');
    
    // Initialiser l'ensemble des dossiers créés
    this.createdFolders = new Set<string>();
    
    // Récupérer l'URL de base depuis les variables d'environnement ou utiliser une valeur par défaut
    this.baseUrl = process.env.SITE_BASE_URL || 'https://my-muqabala.fr';
    
    // Chemin vers le dossier documents dans public
    this.documentsDir = path.join(process.cwd(), 'public', 'documents');
    
    // Logs d'initialisation
    console.log('💥 VercelPublisher: Initialisation - NOUVELLE IMPLÉMENTATION');
    console.log(`💥 Version: 1.0.0 - Déployé le: ${new Date().toISOString()}`);
    console.log(`💥 URL de base: ${this.baseUrl}`);
    console.log(`💥 Dossier documents: ${this.documentsDir}`);
    console.log('💥 Process env NODE_ENV:', process.env.NODE_ENV);
    console.log('💥 Process env VERCEL:', process.env.VERCEL);
    console.log('💥 Process cwd:', process.cwd());
    
    logger.debug('VERCEL_PUBLISHER', 'init', 'Vercel Publisher initialisé', {
      baseUrl: this.baseUrl,
      documentsDir: this.documentsDir
    });
  }
  
  /**
   * Crée un dossier s'il n'existe pas déjà
   * @param folderPath Chemin du dossier à créer
   */
  async ensureDirectoryExists(folderPath: string): Promise<void> {
    // Si ce dossier a déjà été créé dans cette session, on évite de refaire l'appel
    if (this.createdFolders.has(folderPath)) {
      console.log(`🔍 VercelPublisher: Dossier ${folderPath} déjà créé dans cette session, on ignore`);
      return;
    }
    
    console.log(`🔍 VercelPublisher: Vérification/création du dossier: ${folderPath}`);
    
    try {
      // Vérifier si le dossier existe
      await fs.stat(folderPath);
      console.log(`✅ VercelPublisher: Dossier ${folderPath} existe déjà`);
      this.createdFolders.add(folderPath);
    } catch (error) {
      // Le dossier n'existe pas, on le crée
      console.log(`🔍 VercelPublisher: Dossier ${folderPath} n'existe pas, création en cours...`);
      
      try {
        // Créer le dossier et tous les dossiers parents nécessaires
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`✅ VercelPublisher: Dossier ${folderPath} créé avec succès`);
        this.createdFolders.add(folderPath);
      } catch (createError) {
        console.error(`❌ VercelPublisher: Erreur lors de la création du dossier ${folderPath}:`, createError);
        throw createError;
      }
    }
  }
  
  /**
   * Publie un fichier sur Vercel en l'écrivant dans le dossier public/documents
   * @param relativePath Chemin relatif du fichier dans le dossier documents
   * @param content Contenu du fichier
   * @returns URL publique du fichier publié
   */
  async publishFile(relativePath: string, content: string): Promise<string> {
    const startTime = Date.now();
    
    console.log(`🔍 VercelPublisher: Début de publication pour: ${relativePath}`);
    
    try {
      // Construire le chemin complet du fichier
      const fullPath = path.join(this.documentsDir, relativePath);
      
      // S'assurer que le dossier parent existe
      const dirPath = path.dirname(fullPath);
      await this.ensureDirectoryExists(dirPath);
      
      // Écrire le fichier
      console.log(`🔍 VercelPublisher: Écriture du fichier: ${fullPath}`);
      await fs.writeFile(fullPath, content, 'utf8');
      
      // Construire l'URL publique
      const publicUrl = `${this.baseUrl}/documents/${relativePath}`;
      console.log(`✅ VercelPublisher: Fichier ${relativePath} publié avec succès`);
      console.log(`🔗 VercelPublisher: URL publique générée: ${publicUrl}`);
      
      const duration = Date.now() - startTime;
      logger.info('VERCEL_PUBLISHER', 'publish_file', `Fichier ${relativePath} publié`, {
        path: relativePath,
        size: content.length,
        duration_ms: duration,
        url: publicUrl
      });
      
      return publicUrl;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('VERCEL_PUBLISHER', 'publish_file_error', `Erreur publication ${relativePath}`, {
        path: relativePath,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: duration
      });
      
      console.error(`❌ VercelPublisher: Erreur lors de la publication du fichier ${relativePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Publie tous les documents d'un client
   * @param clientEmail Email du client
   * @param documents Documents à publier par type
   * @returns URLs publiques des documents publiés
   */
  async publishClientDocuments(
    clientEmail: string,
    documents: Record<DocumentType, { content: string; filename: string }>
  ): Promise<Record<DocumentType, string>> {
    const startTime = Date.now();
    
    console.log(`🔍 VercelPublisher: Début de la publication des documents pour le client: ${clientEmail}`);
    console.log(`🔍 VercelPublisher: Types de documents à publier: ${Object.keys(documents).join(', ')}`);
    
    logger.info('VERCEL_PUBLISHER', 'publish_client_start', 'Publication des documents client', {
      client_email: clientEmail,
      documents_count: Object.keys(documents).length
    });
    
    const urls: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;
    
    for (const [type, doc] of Object.entries(documents)) {
      const relativePath = `${type}/${doc.filename}`;
      
      try {
        const url = await this.publishFile(relativePath, doc.content);
        urls[type] = url;
        successCount++;
        
        logger.info('VERCEL_PUBLISHER', 'document_published', `Document ${type} publié`, {
          client_email: clientEmail,
          type,
          path: relativePath,
          url
        });
      } catch (error) {
        errorCount++;
        logger.error('VERCEL_PUBLISHER', 'publish_document_error', `Erreur publication ${type}`, {
          client_email: clientEmail,
          type,
          path: relativePath,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('VERCEL_PUBLISHER', 'publish_client_complete', 'Publication client terminée', {
      client_email: clientEmail,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration
    });
    
    return urls as Record<DocumentType, string>;
  }
}
