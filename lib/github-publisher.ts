import { Octokit } from '@octokit/rest';
import { DocumentType } from './types';
import { logger } from './logger';

export class GitHubPublisher {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseUrl: string;
  
  constructor() {
    // Vérification du token GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    console.log('🔍 DEBUG: Vérification du token GitHub');
    console.log('🔍 ENV GITHUB_TOKEN défini:', !!githubToken);
    console.log('🔍 ENV GITHUB_OWNER:', process.env.GITHUB_OWNER);
    console.log('🔍 ENV GITHUB_REPO:', process.env.GITHUB_REPO);
    console.log('🔍 ENV GITHUB_BRANCH:', process.env.GITHUB_BRANCH);
    
    if (!githubToken) {
      console.error('⚠️ ERREUR CRITIQUE: Token GitHub manquant!');
      logger.error('GITHUB_PUBLISHER', 'missing_token', 'Token GitHub manquant', {
        error: 'GITHUB_TOKEN nest pas défini dans les variables denvironnement'
      });
    } else if (githubToken.includes('votre_nouveau_token_github') || githubToken.includes('ghp_')) {
      // Vérifie si le token commence par ghp_ pour détecter un token valide
      if (githubToken.includes('votre_nouveau_token_github')) {
        console.error('⚠️ ERREUR CRITIQUE: Token GitHub est toujours la valeur par défaut!');
        logger.error('GITHUB_PUBLISHER', 'default_token', 'Token GitHub est la valeur par défaut', {
          error: 'GITHUB_TOKEN contient la valeur placeholder votre_nouveau_token_github'
        });
      } else {
        console.log('✅ Token GitHub semble être au bon format (commence par ghp_)');
      }
    } else {
      console.warn('⚠️ AVERTISSEMENT: Format du token GitHub inhabituel, vérifiez qu\'il s\'agit d\'un token valide');
    }
    
    this.octokit = new Octokit({
      auth: githubToken,
    });
    
    this.owner = process.env.GITHUB_OWNER || 'User785485';
    this.repo = process.env.GITHUB_REPO || 'soulful-connections-new';
    this.branch = process.env.GITHUB_BRANCH || 'main';
    this.baseUrl = process.env.SITE_BASE_URL || 
      `https://${this.owner}.github.io/${this.repo}`;
      
    logger.debug('GITHUB_PUBLISHER', 'init', 'GitHub Publisher initialisé', {
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      baseUrl: this.baseUrl,
      has_token: !!githubToken,
      token_length: githubToken ? githubToken.length : 0
    });
  }
  
  /**
   * Publie un fichier sur GitHub avec gestion des conflits
   * @param path Chemin du fichier
   * @param content Contenu du fichier
   * @param message Message de commit
   * @param retryCount Compteur de tentatives en cas de conflit (usage interne)
   * @returns URL publique du fichier publié
   */
  async publishFile(
    path: string, 
    content: string, 
    message: string,
    retryCount: number = 0
  ): Promise<string> {
    const startTime = Date.now();
    const maxRetries = 3; // Nombre maximum de tentatives en cas de conflit
    
    console.log(`🔍 Début de publication sur GitHub pour: ${path}${retryCount > 0 ? ` (tentative ${retryCount+1}/${maxRetries+1})` : ''}`);
    
    try {
      logger.debug('GITHUB_PUBLISHER', 'publish_file_start', `Publication de ${path}`, {
        path,
        content_size: content.length,
        message,
        retry_count: retryCount,
      });
      
      // Vérifier si le fichier existe déjà
      let sha: string | undefined;
      try {
        console.log(`🔍 Vérification si le fichier existe déjà: ${path}`);
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
        });
        
        if ('sha' in data) {
          sha = data.sha;
          console.log(`✅ Fichier existant trouvé avec SHA: ${sha}`);
          logger.debug('GITHUB_PUBLISHER', 'file_exists', 'Fichier existant trouvé', {
            path,
            sha,
          });
        }
      } catch (error: any) {
        // Le fichier n'existe pas, c'est OK
        console.log(`🔍 Statut de l'erreur lors de la vérification: ${error.status}`);
        console.error(`🔍 Détails de l'erreur:`, JSON.stringify(error, null, 2));
        
        if (error.status !== 404) {
          console.error(`❌ Erreur lors de la vérification du fichier: ${error.message}`);
          throw error;
        }
        console.log(`🔍 Fichier n'existe pas encore, création d'un nouveau fichier: ${path}`);
        logger.debug('GITHUB_PUBLISHER', 'file_not_exists', 'Nouveau fichier', { path });
      }
      
      // Créer ou mettre à jour le fichier
      console.log(`🔍 Tentative de création/mise à jour du fichier: ${path}`);
      console.log(`🔍 Paramètres: owner=${this.owner}, repo=${this.repo}, branch=${this.branch}`);
      
      let fileData: any;
      try {
        const response = await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          branch: this.branch,
          sha, // Si le fichier existe, on doit fournir le SHA
        });
        
        fileData = response.data;
        console.log(`✅ Fichier ${path} publié avec succès`);
      } catch (apiError: any) {
        console.error(`❌ ERREUR API GITHUB: ${apiError.message}`);
        console.error(`❌ Status: ${apiError.status}`);
        console.error(`❌ Détails:`, JSON.stringify(apiError?.response?.data || {}, null, 2));
        
        // Traitement spécial pour les erreurs de conflit (409)
        if (apiError.status === 409 && retryCount < 3) {
          console.log(`🔄 Erreur de conflit 409 détectée, tentative de résolution...`);
          
          // Générer un nouveau nom de fichier avec un suffix aléatoire pour éviter le conflit
          const pathParts = path.split('/');
          const fileName = pathParts.pop();
          const fileNameParts = fileName?.split('.') || ['file', 'html'];
          const extension = fileNameParts.pop();
          const baseName = fileNameParts.join('.');
          const newFileName = `${baseName}_retry${retryCount + 1}.${extension}`;
          const newPath = [...pathParts, newFileName].join('/');
          
          console.log(`🔄 Nouvel essai avec un nom de fichier modifié: ${newPath}`);
          
          // Réessayer avec un nouveau nom de fichier
          return this.publishFile(newPath, content, message, retryCount + 1);
        }
        
        throw apiError;
      }
      
      // Retourner l'URL publique
      const publicUrl = `${this.baseUrl}/${path}`;
      console.log(`🔗 URL publique générée: ${publicUrl}`);
      
      const duration = Date.now() - startTime;
      logger.logGitHub('publish_file', path, true, {
        sha: fileData?.content?.sha || 'unknown',
        size: content.length,
        duration_ms: duration,
        url: publicUrl,
      });
      
      console.log(`✅ Publication terminée en ${duration}ms`);
      return publicUrl;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.logGitHub('publish_file', path, false, {
        error: error.message,
        status: error.status,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Publie tous les documents d'un client
   */
  async publishClientDocuments(
    clientEmail: string,
    documents: Record<DocumentType, { content: string; filename: string }>
  ): Promise<Record<DocumentType, string>> {
    const startTime = Date.now();
    
    console.log(`🔍 Début de la publication des documents pour le client: ${clientEmail}`);
    console.log(`🔍 Types de documents à publier: ${Object.keys(documents).join(', ')}`);
    
    logger.info('GITHUB_PUBLISHER', 'publish_client_start', 'Publication des documents client', {
      client_email: clientEmail,
      documents_count: Object.keys(documents).length,
    });
    
    const urls: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;
    
    for (const [type, doc] of Object.entries(documents)) {
      const path = `protected-pages/${type}/${doc.filename}`;
      const message = `Ajout document ${type} pour ${clientEmail}`;
      
      try {
        const url = await this.publishFile(path, doc.content, message);
        urls[type] = url;
        successCount++;
        
        logger.info('GITHUB_PUBLISHER', 'document_published', `Document ${type} publié`, {
          client_email: clientEmail,
          type,
          path,
          url,
        });
      } catch (error) {
        errorCount++;
        logger.error('GITHUB_PUBLISHER', 'publish_document_error', `Erreur publication ${type}`, {
          client_email: clientEmail,
          type,
          path,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('GITHUB_PUBLISHER', 'publish_client_complete', 'Publication client terminée', {
      client_email: clientEmail,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration,
    });
    
    return urls as Record<DocumentType, string>;
  }
  
  /**
   * Met à jour la page d'index
   */
  async updateIndexPage(stats: {
    totalClients: number;
    totalDocuments: number;
    lastUpdate: string;
  }): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('GITHUB_PUBLISHER', 'update_index_start', 'Mise à jour page index', { stats });
      
      const indexContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pages Protégées - Soulful Connections</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 32px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #666;
            font-size: 16px;
        }
        
        .info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 12px;
            margin-top: 30px;
            text-align: center;
        }
        
        .info p {
            color: #333;
            line-height: 1.6;
        }
        
        .lock-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="lock-icon" style="text-align: center;">🔒</div>
        <h1>Pages Protégées</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.totalClients}</div>
                <div class="stat-label">Clients</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-number">${stats.totalDocuments}</div>
                <div class="stat-label">Documents</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-number">7744</div>
                <div class="stat-label">Code d'accès</div>
            </div>
        </div>
        
        <div class="info">
            <p>
                <strong>Accès protégé</strong><br>
                Toutes les pages nécessitent un code d'accès pour être consultées.<br>
                Dernière mise à jour : ${stats.lastUpdate}
            </p>
        </div>
    </div>
</body>
</html>
      `;
      
      await this.publishFile(
        'protected-pages/index.html',
        indexContent,
        'Mise à jour page d\'index'
      );
      
      const duration = Date.now() - startTime;
      logger.info('GITHUB_PUBLISHER', 'update_index_success', 'Page index mise à jour', {
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('GITHUB_PUBLISHER', 'update_index_error', 'Erreur mise à jour index', {
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Vérifie la connexion GitHub
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      logger.debug('GITHUB_PUBLISHER', 'test_connection_start', 'Test de connexion GitHub');
      
      const { data } = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      
      const duration = Date.now() - startTime;
      logger.info('GITHUB_PUBLISHER', 'test_connection_success', 'Connexion GitHub OK', {
        repo_name: data.name,
        repo_id: data.id,
        default_branch: data.default_branch,
        duration_ms: duration,
      });
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('GITHUB_PUBLISHER', 'test_connection_error', 'Erreur connexion GitHub', {
        error: error.message,
        status: error.status,
        duration_ms: duration,
      });
      return false;
    }
  }
}