import { NextRequest, NextResponse } from 'next/server';
import { parseCSVString, validateAndNormalizeData } from '@/lib/csv-parser';
import { ClientData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Obtenir le contenu du fichier CSV
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier CSV fourni' },
        { status: 400 }
      );
    }
    
    // Vérifier que c'est bien un fichier CSV
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Le fichier doit être au format CSV' },
        { status: 400 }
      );
    }
    
    // Lire le contenu du fichier
    const csvContent = await file.text();
    
    // Parser le CSV
    const clientData = await parseCSVString(csvContent);
    
    // Retourner les données normalisées
    return NextResponse.json({
      success: true,
      data: clientData,
      totalRows: clientData.length
    });
    
  } catch (error) {
    console.error('Erreur lors du traitement du CSV:', error);
    return NextResponse.json(
      { error: `Erreur lors du traitement du CSV: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
