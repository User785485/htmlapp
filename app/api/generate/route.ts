import { NextRequest, NextResponse } from 'next/server';
import { ClientData, GenerationResult, DocumentType } from '@/lib/types';
import { SupabaseService } from '@/lib/supabase-client';
import { DocumentGenerator } from '@/lib/document-generator';
import { SupabaseStoragePublisher } from '@/lib/supabase-storage-publisher';
// import { VercelPublisher } from '@/lib/vercel-publisher'; // Méthode précédente de publication
// import { GitHubPublisher } from '@/lib/github-publisher'; // Ancienne méthode de publication

// Initialiser les services
let templatesLoaded = false;

export async function POST(request: NextRequest) {
  console.log('API generate: Début de la requête');
  try {
    const { client }: { client: ClientData } = await request.json();
    console.log('API generate: Données client reçues', { email: client.email, prenom: client.prenom, nom: client.nom });
    
    // Charger les templates si ce n'est pas déjà fait
    if (!templatesLoaded) {
      console.log('API generate: Chargement des templates');
      try {
        await DocumentGenerator.loadTemplates();
        templatesLoaded = true;
        console.log('API generate: Templates chargés avec succès');
      } catch (templateError) {
        console.error('API generate: Erreur lors du chargement des templates', templateError);
        throw templateError;
      }
    }
    
    // Vérifier si le client existe déjà
    console.log('API generate: Vérification si le client existe dans Supabase', { email: client.email });
    let existingClient;
    try {
      existingClient = await SupabaseService.checkClientExists(client.email);
      console.log('API generate: Résultat de la vérification client', { exists: !!existingClient });
    } catch (supabaseError) {
      console.error('API generate: Erreur lors de la vérification du client dans Supabase', supabaseError);
      throw supabaseError;
    }
    
    const result: GenerationResult = {
      client_email: client.email,
      success: true,
      documents: {}
    };
    
    // Si le client existe, récupérer les URLs existantes
    if (existingClient) {
      console.log(`Client ${client.email} existe déjà`);
      
      if (existingClient.vente_url) {
        result.documents.vente = {
          url: existingClient.vente_url,
          generated: false
        };
      }
      
      if (existingClient.compte_rendu_url) {
        result.documents['compte-rendu'] = {
          url: existingClient.compte_rendu_url,
          generated: false
        };
      }
      
      if (existingClient.onboarding_url) {
        result.documents.onboarding = {
          url: existingClient.onboarding_url,
          generated: false
        };
      }
      
      // Si tous les documents existent déjà, retourner le résultat
      if (existingClient.vente_url && existingClient.compte_rendu_url && existingClient.onboarding_url) {
        return NextResponse.json(result);
      }
    }
    
    // Générer les documents manquants
    console.log('API generate: Détermination des documents à générer');
    const documentsToGenerate: DocumentType[] = [];
    if (!existingClient?.vente_url) documentsToGenerate.push('vente');
    if (!existingClient?.compte_rendu_url) documentsToGenerate.push('compte-rendu');
    if (!existingClient?.onboarding_url) documentsToGenerate.push('onboarding');
    
    console.log('API generate: Documents à générer', documentsToGenerate);
    
    const generatedDocuments: Record<string, { content: string; filename: string }> = {};
    
    try {
      for (const type of documentsToGenerate) {
        console.log(`API generate: Génération du document de type ${type}`);
        const content = DocumentGenerator.generateDocument(client, type);
        const filename = DocumentGenerator.generateFileName(client, type);
        generatedDocuments[type] = { content, filename };
        console.log(`API generate: Document ${type} généré avec succès`, { filename });
      }
    } catch (genError) {
      console.error('API generate: Erreur lors de la génération des documents', genError);
      throw genError;
    }
    
    // Publier sur Supabase Storage et servir via API Route
    console.log('💥💥💥 API generate: SOLUTION D\'URGENCE - FORCER LES URLs vers my-muqabala.fr 💥💥💥');
    console.log('🔴 LOGS DÉTAILLÉS POUR DÉBOGAGE 🔴');
    console.log('Process env:', { 
      SITE_BASE_URL: process.env.SITE_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    let publishedUrls: Record<DocumentType, string> = {} as Record<DocumentType, string>;
    try {
      // Utiliser Supabase pour stocker les documents
      console.log('🔴 DIAGNOSTIC: Initialisation de SupabaseStoragePublisher');
      const publisher = new SupabaseStoragePublisher();
      console.log('🔴 DIAGNOSTIC: SupabaseStoragePublisher initialisé avec succès');
      console.log('🌟🌟🌟 DIAGNOSTIC - FORCAGE des URLs vers my-muqabala.fr');
      console.log('🔴 Documents générés disponibles:', Object.keys(generatedDocuments));
      
      // Publier chaque document avec Supabase
      console.log('🔴 DÉBUT DE LA BOUCLE DE PUBLICATION DES DOCUMENTS');
      
      for (const [type, doc] of Object.entries(generatedDocuments)) {
        console.log(`🔴 DIAGNOSTIC - Publication du document de type: ${type}`);
        const docInfo = doc as { content: string; filename: string };
        const path = `${type}/${docInfo.filename}`;
        
        console.log(`🔴 DIAGNOSTIC - Chemin du fichier: ${path}`);
        console.log(`🔴 DIAGNOSTIC - Taille du contenu: ${docInfo.content.length} octets`);
        
        try {
          // Stocker dans Supabase Storage
          console.log(`🔴 DIAGNOSTIC - Tentative de publication dans Supabase: ${path}`);
          const supabaseUrl = await publisher.publishFile(path, docInfo.content);
          console.log(`🔴 DIAGNOSTIC - URL Supabase reçue: ${supabaseUrl}`);
          
          // FORCER l'URL vers my-muqabala.fr indépendamment de ce que retourne la méthode de publication
          const forcedUrl = `https://my-muqabala.fr/api/documents/${path}`;
          publishedUrls[type as DocumentType] = forcedUrl;
          
          console.log(`🔴 DIAGNOSTIC - URL FORCÉE pour ${type}: ${forcedUrl}`);
          console.log(`🔴 DIAGNOSTIC - Comparaison - URL Supabase: ${supabaseUrl} vs URL forcée: ${forcedUrl}`);
        } catch (error) {
          console.error(`🔴 ERREUR lors de la publication du document ${type}:`, error);
          // Continuer malgré l'erreur pour les autres documents
          continue;
        }
      }
      
      console.log('API generate: Publication réussie avec URLs FORCÉES vers my-muqabala.fr', publishedUrls);
    } catch (publishError) {
      console.error('API generate: Erreur lors de la publication des documents', publishError);
      throw publishError;
    }
    
    // Préparer les données pour Supabase
    console.log('API generate: Préparation des données pour Supabase');
    const now = new Date();
    
    console.log('API generate: Préparation des données sécurisées pour Supabase');
    
    // Structure de données pour Supabase - Toutes les colonnes existent maintenant dans la table
    console.log('API generate: Préparation des données pour Supabase avec toutes les colonnes');
    
    // Structure de données pour l'upsert (insertion ou mise à jour)
    const supabaseData = {
      client_email: client.email,
      client_phone: client.telephone,  // Cette colonne existe maintenant
      client_name: `${client.prenom} ${client.nom}`,
      raw_data: client,  // Stockage des données brutes du client
      
      // Ajouter toutes les URLs et dates de génération
      ...(publishedUrls.vente && {
        vente_url: publishedUrls.vente,
        vente_generated_at: now
      }),
      
      ...(publishedUrls['compte-rendu'] && {
        compte_rendu_url: publishedUrls['compte-rendu'],
        compte_rendu_generated_at: now
      }),
      
      ...(publishedUrls.onboarding && {
        onboarding_url: publishedUrls.onboarding,
        onboarding_generated_at: now
      })
    };
    
    // Logger les données préparées pour vérification
    console.log('API generate: Détails des données préparées', {
      email: supabaseData.client_email,
      hasVente: !!publishedUrls.vente,
      hasCompteRendu: !!publishedUrls['compte-rendu'],
      hasOnboarding: !!publishedUrls.onboarding,
      donnéesStocku00e9es: Object.keys(supabaseData).length
    });
    
    // Sauvegarder dans Supabase avec la méthode originale
    console.log('API generate: Sauvegarde des données dans Supabase');
    try {
      await SupabaseService.upsertClient(supabaseData);
      console.log('API generate: Sauvegarde Supabase réussie');
      
      // Loguer les détails de la sauvegarde pour débogage
      console.log('API generate: Détails des données sauvegardées', {
        email: supabaseData.client_email,
        venteUrl: supabaseData.vente_url,
        compteRenduUrl: supabaseData.compte_rendu_url,
        onboardingUrl: supabaseData.onboarding_url
      });
    } catch (saveError) {
      console.error('API generate: Erreur lors de la sauvegarde dans Supabase', saveError);
      throw saveError;
    }
    
    // Préparer le résultat
    for (const [type, url] of Object.entries(publishedUrls)) {
      result.documents[type as DocumentType] = {
        url,
        generated: true
      };
    }
    
    // Ajouter les URLs existantes au résultat
    if (existingClient) {
      if (existingClient.vente_url && !result.documents.vente) {
        result.documents.vente = {
          url: existingClient.vente_url,
          generated: false
        };
      }
      if (existingClient.compte_rendu_url && !result.documents['compte-rendu']) {
        result.documents['compte-rendu'] = {
          url: existingClient.compte_rendu_url,
          generated: false
        };
      }
      if (existingClient.onboarding_url && !result.documents.onboarding) {
        result.documents.onboarding = {
          url: existingClient.onboarding_url,
          generated: false
        };
      }
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API generate: Erreur principale:', error);
    let errorMessage = 'Erreur inconnue';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('API generate: Stack trace:', error.stack);
    }
    
    // Si l'erreur vient d'une réponse ou contient un message détaillé
    if (typeof error === 'object' && error !== null) {
      console.error('API generate: Détails de l\'erreur:', JSON.stringify(error));
    }
    
    return NextResponse.json(
      {
        client_email: '',
        success: false,
        documents: {},
        error: errorMessage
      },
      { status: 500 }
    );
  }
}