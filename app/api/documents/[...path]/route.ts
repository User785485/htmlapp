import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Utiliser les variables d'environnement ou des valeurs par du00e9faut
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prbidefjoqdrqwjeenxm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzY3NDEsImV4cCI6MjA2MzYxMjc0MX0.FaiiU8DTqnBVkNjG2L3wkE0MCsKnit_CNdGMmP0oRME';
const bucketName = 'documents';

// Cru00e9er le client Supabase (avec la clu00e9 anon pour accu00e9der aux fichiers publics)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * API route qui sert les documents HTML depuis Supabase Storage
 * URL: /api/documents/[...path]
 * Exemple: /api/documents/vente/client-xyz.html
 */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  // Ru00e9cupu00e9rer le chemin complet depuis les paramu00e8tres
  const pathSegments = params.path || [];
  const fullPath = pathSegments.join('/');
  
  console.log(`\ud83d\udca5 API Documents: Requ\u00eate re\u00e7ue pour: ${fullPath}`);
  
  try {
    // Log pour du00e9bogage
    logger.info('API_DOCUMENTS', 'request', `Requ\u00eate pour ${fullPath}`, {
      path: fullPath,
      url: request.url,
      referrer: request.headers.get('referer') || 'none'
    });
    
    // Vu00e9rifier si le fichier existe dans Supabase Storage
    console.log(`\ud83d\udca5 API Documents: V\u00e9rification dans Supabase Storage: ${bucketName}/${fullPath}`);
    
    // Ru00e9cupu00e9rer le fichier depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(fullPath);
    
    if (error) {
      console.error(`\u274c API Documents: Erreur lors de la r\u00e9cup\u00e9ration du fichier:`, error);
      
      logger.error('API_DOCUMENTS', 'file_not_found', `Fichier non trouv\u00e9: ${fullPath}`, {
        path: fullPath,
        error: error.message
      });
      
      // Retourner une erreur 404 si le fichier n'est pas trouvu00e9
      return new NextResponse(`Document not found: ${fullPath}`, { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    if (!data) {
      console.error(`\u274c API Documents: Fichier non trouv\u00e9: ${fullPath}`);
      
      logger.error('API_DOCUMENTS', 'no_data', `Aucune donn\u00e9e re\u00e7ue pour: ${fullPath}`, {
        path: fullPath
      });
      
      // Retourner une erreur 404 si aucune donnu00e9e n'est reu00e7ue
      return new NextResponse(`Document not found: ${fullPath}`, { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    // Convertir le Blob en texte HTML
    const htmlContent = await data.text();
    
    console.log(`\u2705 API Documents: Fichier ${fullPath} servi avec succ\u00e8s (${htmlContent.length} octets)`);
    
    logger.info('API_DOCUMENTS', 'success', `Fichier servi: ${fullPath}`, {
      path: fullPath,
      size: htmlContent.length
    });
    
    // Retourner le contenu HTML avec les en-tu00eates appropriu00e9s
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache d'une heure
      }
    });
    
  } catch (error) {
    console.error(`\u274c API Documents: Erreur lors du traitement de la requ\u00eate:`, error);
    
    logger.error('API_DOCUMENTS', 'server_error', `Erreur serveur: ${fullPath}`, {
      path: fullPath,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Retourner une erreur 500 en cas d'erreur serveur
    return new NextResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

/**
 * Configuration des options pour cette API route
 */
export const dynamic = 'force-dynamic'; // Ne pas mettre en cache la route pour toujours avoir le contenu le plus ru00e9cent
