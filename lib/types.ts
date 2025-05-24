// Types pour l'application HTML Personalizer V2

export interface ClientData {
  email: string;
  telephone: string;
  prenom: string;
  nom: string;
  
  // Variables pour page de vente
  produit?: string;
  prix?: string;
  offre_speciale?: string;
  
  // Variables pour compte-rendu
  date_rencontre?: string;
  objectifs?: string;
  recommandations?: string;
  
  // Variables pour onboarding
  etapes_onboarding?: string;
  conseils_onboarding?: string;
  
  // Autres variables possibles
  [key: string]: string | undefined;
}

export interface GeneratedDocument {
  id?: string;
  client_email: string;
  client_phone?: string; // Rendu optionnel car la colonne peut ne pas exister dans Supabase
  client_name: string;
  
  vente_url?: string;
  vente_generated_at?: Date;
  
  compte_rendu_url?: string;
  compte_rendu_generated_at?: Date;
  
  onboarding_url?: string;
  onboarding_generated_at?: Date;
  
  raw_data: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export type DocumentType = 'vente' | 'compte-rendu' | 'onboarding';

export interface GenerationResult {
  client_email: string;
  client?: ClientData;  // Ajout du champ client pour stocker les données client complètes
  success: boolean;
  documents: {
    vente?: { url: string; generated: boolean };
    'compte-rendu'?: { url: string; generated: boolean };
    onboarding?: { url: string; generated: boolean };
  };
  error?: string;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  success: number;
  errors: number;
  currentClient?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export interface CSVExportRow {
  email: string;
  telephone: string;
  donnees_completes: string;
  lien_compte_rendu: string;
  lien_page_vente: string;
  lien_onboarding: string;
}