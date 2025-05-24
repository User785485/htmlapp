import { NextRequest, NextResponse } from 'next/server';
import { GenerationResult, CSVExportRow } from '@/lib/types';
import { SupabaseService } from '@/lib/supabase-client';
import { CSVParser } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  console.log('\n==== DéBUT API EXPORT (POST) ====');
  try {
    console.log('API Export: Réception de la requête');
    const requestData = await request.json();
    const { results }: { results: GenerationResult[] } = requestData;
    
    console.log('API Export: Détails complets de la requête', {
      requestSize: JSON.stringify(requestData).length,
      hasResults: !!results,
      resultsCount: results?.length || 0,
      sampleEmail: results?.[0]?.client_email,
      hasClientData: !!results?.[0]?.client,
      clientDataType: results?.[0]?.client ? typeof results[0].client : 'undefined',
      availableClientProperties: results?.[0]?.client ? Object.keys(results[0].client) : []
    });
    
    // Méthode 1: Utiliser les données client attachées aux résultats
    let csvRows: CSVExportRow[] = [];
    
    if (results?.[0]?.client) {
      console.log('API Export: Utilisation des données client attachées aux résultats');
      
      // Si les données client sont attachées, les utiliser directement
      csvRows = results.map(result => ({
        email: result.client_email,
        telephone: result.client?.telephone || '',
        donnees_completes: JSON.stringify(result.client || {}),
        lien_compte_rendu: result.documents['compte-rendu']?.url || '',
        lien_page_vente: result.documents.vente?.url || '',
        lien_onboarding: result.documents.onboarding?.url || ''
      }));
    } else {
      console.log('API Export: Les données client ne sont pas attachées, récupération depuis Supabase');
      
      // Méthode 2: Récupérer depuis Supabase (fallback)
      console.log('API Export: Tentative de récupération des données depuis Supabase');
      try {
        const allDocuments = await SupabaseService.getAllDocuments();
        console.log(`API Export: ${allDocuments.length} documents récupérés depuis Supabase`);
        
        if (allDocuments.length > 0) {
          console.log('API Export: Exemple de document Supabase:', {
            email: allDocuments[0].client_email,
            hasPhone: !!allDocuments[0].client_phone,
            hasRawData: !!allDocuments[0].raw_data,
            rawDataType: allDocuments[0].raw_data ? typeof allDocuments[0].raw_data : 'undefined',
            hasUrls: {
              vente: !!allDocuments[0].vente_url,
              compte_rendu: !!allDocuments[0].compte_rendu_url,
              onboarding: !!allDocuments[0].onboarding_url
            }
          });
        } else {
          console.warn('API Export: ATTENTION! Aucun document trouvé dans Supabase');
        }
        
        // Créer un map pour un accès rapide
        const documentsMap = new Map(
          allDocuments.map(doc => [doc.client_email, doc])
        );
        
        // Vérifier si les emails correspondent entre les résultats et Supabase
        const emailsNotFound = results.filter(r => !documentsMap.has(r.client_email)).length;
        if (emailsNotFound > 0) {
          console.warn(`API Export: ATTENTION! ${emailsNotFound} emails dans les résultats ne sont pas trouvés dans Supabase`);
        }
        
        // Préparer les lignes du CSV
        csvRows = results.map(result => {
          const dbDoc = documentsMap.get(result.client_email);
          
          if (!dbDoc && result.client_email) {
            console.warn(`API Export: Email non trouvé dans Supabase: ${result.client_email}`);
          }
          
          const row = {
            email: result.client_email,
            telephone: dbDoc?.client_phone || '',
            donnees_completes: JSON.stringify(dbDoc?.raw_data || {}),
            lien_compte_rendu: result.documents['compte-rendu']?.url || dbDoc?.compte_rendu_url || '',
            lien_page_vente: result.documents.vente?.url || dbDoc?.vente_url || '',
            lien_onboarding: result.documents.onboarding?.url || dbDoc?.onboarding_url || ''
          };
          
          return row;
        });
      } catch (supabaseError) {
        console.error('API Export: Erreur lors de la récupération depuis Supabase', supabaseError);
        // Créer un CSV minimal avec les données disponibles dans les résultats
        csvRows = results.map(result => ({
          email: result.client_email,
          telephone: '',
          donnees_completes: '{}',
          lien_compte_rendu: result.documents['compte-rendu']?.url || '',
          lien_page_vente: result.documents.vente?.url || '',
          lien_onboarding: result.documents.onboarding?.url || ''
        }));
      }
    }
    
    // Logs des lignes CSV préparées
    console.log(`API Export: ${csvRows.length} lignes CSV préparées`);
    console.log('API Export: Exemple de première ligne CSV:', csvRows[0]);
    
    // Vérifier si les données essentielles sont présentes
    const lignesManquantes = csvRows.filter(row => !row.email).length;
    if (lignesManquantes > 0) {
      console.warn(`API Export: ATTENTION! ${lignesManquantes} lignes ont un email manquant`);
    }
    
    const lignesSansLien = csvRows.filter(row => 
      !row.lien_compte_rendu && !row.lien_page_vente && !row.lien_onboarding
    ).length;
    if (lignesSansLien > 0) {
      console.warn(`API Export: ATTENTION! ${lignesSansLien} lignes n'ont aucun lien de document`);
    }
    
    // Générer le CSV
    console.log('API Export: Génération du CSV');
    const csv = CSVParser.generateExportCSV(csvRows);
    console.log(`API Export: CSV généré avec succès (${csv.length} caractères)`);
    console.log('==== FIN API EXPORT (POST) ====\n');
    
    return NextResponse.json({ csv });
    
  } catch (error) {
    console.error('API Export: ERREUR CRITIQUE', error);
    console.error('==== FIN API EXPORT (ERREUR) ====\n');
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