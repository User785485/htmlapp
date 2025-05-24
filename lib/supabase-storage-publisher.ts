import { createClient } from '@supabase/supabase-js';
import { DocumentType } from './types';
import { logger } from './logger';

/**
 * Classe pour publier des fichiers HTML dans Supabase Storage
 * et les exposer via une API Next.js
 */
export class SupabaseStoragePublisher {
  private supabase;
  private bucketName: string;
  private baseUrl: string;
  
  constructor() {
    console.log('\ud83d\udca5 SupabaseStoragePublisher: Initialisation');
    
    // Utiliser les variables d'environnement ou des valeurs par défaut
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prbidefjoqdrqwjeenxm.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAzNjc0MSwiZXhwIjoyMDYzNjEyNzQxfQ.K-f19FXAPH-z2qfRGMS2zOUmsVJ-iya6l0xfEwlVf44';
    this.bucketName = 'documents';
    
    // URL de base pour les documents (API route) - FORCu00c9E pour u00e9viter les problu00e8mes
    this.baseUrl = 'https://my-muqabala.fr';
    console.log('🔴🔴🔴 IMPORTANT: URL de base FORCu00c9E u00e0 https://my-muqabala.fr');
    
    // Initialiser le client Supabase avec la clé de service pour avoir les permissions d'upload
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Logs détaillés pour le débogage
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: URL Supabase = ${supabaseUrl}`);
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Bucket = ${this.bucketName}`);
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: URL de base = ${this.baseUrl}`);
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Service Key définie = ${!!supabaseServiceKey}`);
    
    logger.debug('SUPABASE_STORAGE_PUBLISHER', 'init', 'Supabase Storage Publisher initialisé', {
      supabaseUrl,
      bucketName: this.bucketName,
      baseUrl: this.baseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }
  
  /**
   * S'assure que le bucket existe, le crée si nécessaire
   */
  private async ensureBucketExists(): Promise<void> {
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Vérification du bucket ${this.bucketName}`);
    
    try {
      // Vérifier si le bucket existe
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`\u274c SupabaseStoragePublisher: Erreur lors de la vérification des buckets:`, listError);
        throw listError;
      }
      
      // Vérifier si notre bucket existe dans la liste
      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log(`\ud83d\udca5 SupabaseStoragePublisher: Bucket ${this.bucketName} n'existe pas, création...`);
        
        // Créer le bucket avec accès public
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true, // Tous les fichiers seront publics par défaut
        });
        
        if (createError) {
          console.error(`\u274c SupabaseStoragePublisher: Erreur lors de la création du bucket:`, createError);
          throw createError;
        }
        
        console.log(`\u2705 SupabaseStoragePublisher: Bucket ${this.bucketName} créé avec succès`);
      } else {
        console.log(`\u2705 SupabaseStoragePublisher: Bucket ${this.bucketName} existe déjà`);
      }
      
      // Mettre à jour la politique d'accès public
      await this.updateBucketPolicy();
      
    } catch (error) {
      console.error(`\u274c SupabaseStoragePublisher: Erreur critique avec le bucket:`, error);
      logger.error('SUPABASE_STORAGE_PUBLISHER', 'bucket_error', 'Erreur lors de la vérification/création du bucket', {
        bucketName: this.bucketName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Met à jour la politique d'accès du bucket pour permettre l'accès public
   */
  private async updateBucketPolicy(): Promise<void> {
    console.log(`💥 SupabaseStoragePublisher: Mise à jour de la politique d'accès au bucket`);
    
    try {
      // Dans les versions récentes de Supabase, les buckets créés avec public: true sont déjà accessibles publiquement
      // Cette méthode est principalement pour la compatibilité et le logging
      
      // Vérifier que la politique d'accès est correcte
      const { data: policyData, error: policyError } = await this.supabase.storage.getBucket(this.bucketName);
      
      if (policyError) {
        console.error(`❌ SupabaseStoragePublisher: Erreur lors de la vérification de la politique:`, policyError);
        // Continuer malgré l'erreur
      } else {
        // Afficher les informations sur le bucket pour débogage
        console.log(`💥 SupabaseStoragePublisher: Détails du bucket:`, {
          name: policyData?.name,
          public: policyData?.public,
          created_at: policyData?.created_at
        });
      }
      
      console.log(`✅ SupabaseStoragePublisher: Politique d'accès vérifiée`);
    } catch (error) {
      console.error(`❌ SupabaseStoragePublisher: Erreur lors de la mise à jour de la politique:`, error);
      // On continue même si cette étape échoue, ce n'est pas critique
    }
  }
  
  /**
   * Publie un fichier dans Supabase Storage
   * @param path Chemin du fichier dans le bucket
   * @param content Contenu du fichier HTML
   * @returns URL publique du fichier via l'API Next.js
   */
  async publishFile(path: string, content: string): Promise<string> {
    const startTime = Date.now();
    
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Début de publication pour: ${path}`);
    
    try {
      // S'assurer que le bucket existe
      await this.ensureBucketExists();
      
      // Préparer le chemin pour le stockage
      const sanitizedPath = path.startsWith('/') ? path.substring(1) : path;
      
      console.log(`\ud83d\udca5 SupabaseStoragePublisher: Upload du fichier: ${sanitizedPath}`);
      
      // Uploader le fichier
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(sanitizedPath, content, {
          contentType: 'text/html',
          upsert: true // Remplacer si le fichier existe déjà
        });
      
      if (error) {
        console.error(`\u274c SupabaseStoragePublisher: Erreur lors de l'upload:`, error);
        throw error;
      }
      
      // Vérifier si le fichier a bien été uploadé
      if (!data) {
        console.error(`\u274c SupabaseStoragePublisher: Upload réussi mais aucune donnée retournée`);
        throw new Error('Aucune donnée retournée après l\'upload');
      }
      
      console.log(`\u2705 SupabaseStoragePublisher: Fichier ${sanitizedPath} uploadé avec succès`);
      
      // Construire l'URL de l'API Next.js
      const apiUrl = `${this.baseUrl}/api/documents/${sanitizedPath}`;
      console.log(`\ud83d\udd17 SupabaseStoragePublisher: URL API générée: ${apiUrl}`);
      
      // Construire également l'URL Supabase directe (pour débogage)
      const { data: publicUrlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(sanitizedPath);
      console.log(`\ud83d\udd17 SupabaseStoragePublisher: URL Supabase directe: ${publicUrlData?.publicUrl || 'Non disponible'}`);
      
      const duration = Date.now() - startTime;
      logger.info('SUPABASE_STORAGE_PUBLISHER', 'publish_file', `Fichier ${sanitizedPath} publié`, {
        path: sanitizedPath,
        size: content.length,
        duration_ms: duration,
        apiUrl,
        supabaseUrl: publicUrlData?.publicUrl
      });
      
      return apiUrl;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('SUPABASE_STORAGE_PUBLISHER', 'publish_file_error', `Erreur publication ${path}`, {
        path,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: duration
      });
      
      console.error(`\u274c SupabaseStoragePublisher: Erreur lors de la publication du fichier ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Publie tous les documents d'un client
   * @param clientEmail Email du client
   * @param documents Documents à publier par type
   * @returns URLs publiques des documents publiés via l'API Next.js
   */
  async publishClientDocuments(
    clientEmail: string,
    documents: Record<DocumentType, { content: string; filename: string }>
  ): Promise<Record<DocumentType, string>> {
    const startTime = Date.now();
    
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Début de la publication des documents pour: ${clientEmail}`);
    console.log(`\ud83d\udca5 SupabaseStoragePublisher: Types de documents à publier: ${Object.keys(documents).join(', ')}`);
    
    logger.info('SUPABASE_STORAGE_PUBLISHER', 'publish_client_start', 'Publication des documents client', {
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
        
        logger.info('SUPABASE_STORAGE_PUBLISHER', 'document_published', `Document ${type} publié`, {
          client_email: clientEmail,
          type,
          path: relativePath,
          url
        });
      } catch (error) {
        errorCount++;
        logger.error('SUPABASE_STORAGE_PUBLISHER', 'publish_document_error', `Erreur publication ${type}`, {
          client_email: clientEmail,
          type,
          path: relativePath,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('SUPABASE_STORAGE_PUBLISHER', 'publish_client_complete', 'Publication client terminée', {
      client_email: clientEmail,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration
    });
    
    return urls as Record<DocumentType, string>;
  }
}
