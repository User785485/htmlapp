import { NextRequest, NextResponse } from 'next/server';
import { ClientData, GenerationResult, DocumentType } from '@/lib/types';
import { SupabaseService } from '@/lib/supabase-client';
import { DocumentGenerator } from '@/lib/document-generator';
import { GitHubPublisher } from '@/lib/github-publisher';

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
    
    // Publier sur GitHub
    console.log('API generate: Initialisation de la publication GitHub');
    let publishedUrls;
    try {
      const publisher = new GitHubPublisher();
      console.log('API generate: Tentative de publication des documents sur GitHub', { 
        email: client.email,
        documentCount: Object.keys(generatedDocuments).length
      });
      publishedUrls = await publisher.publishClientDocuments(
        client.email,
        generatedDocuments as Record<DocumentType, { content: string; filename: string }>
      );
      console.log('API generate: Publication GitHub réussie', publishedUrls);
    } catch (githubError) {
      console.error('API generate: Erreur lors de la publication sur GitHub', githubError);
      throw githubError;
    }
    
    // Préparer les données pour Supabase
    console.log('API generate: Préparation des données pour Supabase');
    const now = new Date();
    const supabaseData = {
      client_email: client.email,
      client_phone: client.telephone,
      client_name: `${client.prenom} ${client.nom}`,
      raw_data: client,
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
    
    // Sauvegarder dans Supabase
    console.log('API generate: Sauvegarde des données dans Supabase');
    try {
      await SupabaseService.upsertClient(supabaseData);
      console.log('API generate: Sauvegarde Supabase réussie');
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