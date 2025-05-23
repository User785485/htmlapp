import { NextRequest, NextResponse } from 'next/server';
import { ClientData, GenerationResult, DocumentType } from '@/lib/types';
import { SupabaseService } from '@/lib/supabase-client';
import { DocumentGenerator } from '@/lib/document-generator';
import { GitHubPublisher } from '@/lib/github-publisher';

// Initialiser les services
let templatesLoaded = false;

export async function POST(request: NextRequest) {
  try {
    const { client }: { client: ClientData } = await request.json();
    
    // Charger les templates si ce n'est pas déjà fait
    if (!templatesLoaded) {
      await DocumentGenerator.loadTemplates();
      templatesLoaded = true;
    }
    
    // Vérifier si le client existe déjà
    const existingClient = await SupabaseService.checkClientExists(client.email);
    
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
    const documentsToGenerate: DocumentType[] = [];
    if (!existingClient?.vente_url) documentsToGenerate.push('vente');
    if (!existingClient?.compte_rendu_url) documentsToGenerate.push('compte-rendu');
    if (!existingClient?.onboarding_url) documentsToGenerate.push('onboarding');
    
    const generatedDocuments: Record<string, { content: string; filename: string }> = {};
    
    for (const type of documentsToGenerate) {
      const content = DocumentGenerator.generateDocument(client, type);
      const filename = DocumentGenerator.generateFileName(client, type);
      generatedDocuments[type] = { content, filename };
    }
    
    // Publier sur GitHub
    const publisher = new GitHubPublisher();
    const publishedUrls = await publisher.publishClientDocuments(
      client.email,
      generatedDocuments as Record<DocumentType, { content: string; filename: string }>
    );
    
    // Préparer les données pour Supabase
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
    await SupabaseService.upsertClient(supabaseData);
    
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
    console.error('Erreur génération:', error);
    return NextResponse.json(
      {
        client_email: '',
        success: false,
        documents: {},
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}