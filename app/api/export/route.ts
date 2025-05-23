import { NextRequest, NextResponse } from 'next/server';
import { GenerationResult, CSVExportRow } from '@/lib/types';
import { SupabaseService } from '@/lib/supabase-client';
import { CSVParser } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  try {
    const { results }: { results: GenerationResult[] } = await request.json();
    
    // Récupérer toutes les données depuis Supabase pour avoir les infos complètes
    const allDocuments = await SupabaseService.getAllDocuments();
    
    // Créer un map pour un accès rapide
    const documentsMap = new Map(
      allDocuments.map(doc => [doc.client_email, doc])
    );
    
    // Préparer les lignes du CSV
    const csvRows: CSVExportRow[] = results.map(result => {
      const dbDoc = documentsMap.get(result.client_email);
      
      return {
        email: result.client_email,
        telephone: dbDoc?.client_phone || '',
        donnees_completes: JSON.stringify(dbDoc?.raw_data || {}),
        lien_compte_rendu: result.documents['compte-rendu']?.url || dbDoc?.compte_rendu_url || '',
        lien_page_vente: result.documents.vente?.url || dbDoc?.vente_url || '',
        lien_onboarding: result.documents.onboarding?.url || dbDoc?.onboarding_url || ''
      };
    });
    
    // Générer le CSV
    const csv = CSVParser.generateExportCSV(csvRows);
    
    return NextResponse.json({ csv });
    
  } catch (error) {
    console.error('Erreur export CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du CSV' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Récupérer tous les documents depuis Supabase
    const allDocuments = await SupabaseService.getAllDocuments();
    
    // Préparer les lignes du CSV
    const csvRows: CSVExportRow[] = allDocuments.map(doc => ({
      email: doc.client_email,
      telephone: doc.client_phone || '',
      donnees_completes: JSON.stringify(doc.raw_data || {}),
      lien_compte_rendu: doc.compte_rendu_url || '',
      lien_page_vente: doc.vente_url || '',
      lien_onboarding: doc.onboarding_url || ''
    }));
    
    // Générer le CSV
    const csv = CSVParser.generateExportCSV(csvRows);
    
    // Retourner le CSV comme fichier téléchargeable
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Erreur export CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du CSV' },
      { status: 500 }
    );
  }
}