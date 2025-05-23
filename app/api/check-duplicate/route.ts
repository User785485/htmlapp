import { NextRequest, NextResponse } from 'next/server';
import { analyzeClientData } from '@/lib/csv-parser';
import { ClientData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du corps de la requête
    const body = await request.json();
    const { data } = body;
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Données client invalides ou manquantes' },
        { status: 400 }
      );
    }
    
    // Analyser les données pour détecter les doublons dans Supabase
    const analysis = await analyzeClientData(data as ClientData[]);
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse des doublons:', error);
    return NextResponse.json(
      { error: `Erreur lors de l\'analyse: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
