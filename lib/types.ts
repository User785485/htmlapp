// Types pour l'application HTML Personalizer V2

export interface ClientData {
  email: string;
  telephone: string;
  prenom: string;
  nom: string;
  
  // Variables pour page de vente (anciennes)
  produit?: string;
  prix?: string;
  offre_speciale?: string;
  
  // Variables pour compte-rendu (anciennes)
  date_rencontre?: string;
  objectifs?: string;
  recommandations?: string;
  
  // Variables pour onboarding (anciennes)
  etapes_onboarding?: string;
  conseils_onboarding?: string;
  
  // Variables spécifiques à Love Transformation
  places_disponibles?: string;
  message_bienvenue_spirituel?: string;
  pont_emotionnel_introduction?: string;
  paragraphe_connexion_1?: string;
  numero_whatsapp?: string;
  date_debut_programme?: string;
  
  // Variables de tarification
  mensualite_3x?: string;
  mensualite_6x?: string;
  prix_unique?: string;
  economie_3x?: string;
  economie_unique?: string;
  formule_recommandee?: string;
  
  // Points avant/après transformation
  point_avant_1?: string;
  point_avant_2?: string;
  point_avant_3?: string;
  point_avant_4?: string;
  point_avant_5?: string;
  point_apres_1?: string;
  point_apres_2?: string;
  point_apres_3?: string;
  point_apres_4?: string;
  point_apres_5?: string;
  
  // Modules de formation
  module_1_point_empathie?: string;
  module_1_objectif_personnel?: string;
  module_1_benefice_cle?: string;
  module_2_point_empathie?: string;
  module_2_objectif_personnel?: string;
  module_2_benefice_cle?: string;
  module_3_point_empathie?: string;
  module_3_objectif_personnel?: string;
  module_3_benefice_cle?: string;
  module_4_point_empathie?: string;
  module_4_objectif_personnel?: string;
  module_4_benefice_cle?: string;
  module_5_point_empathie?: string;
  module_5_objectif_personnel?: string;
  module_5_benefice_cle?: string;
  module_6_point_empathie?: string;
  module_6_objectif_personnel?: string;
  module_6_benefice_cle?: string;
  module_7_point_empathie?: string;
  module_7_objectif_personnel?: string;
  module_7_benefice_cle?: string;
  
  // Témoignages
  prenom_temoignage_1?: string;
  profession_temoignage_1?: string;
  age_temoignage_1?: string;
  emoji_profession_1?: string;
  temoignage_court_1?: string;
  temoignage_1_transformation_alignee?: string;
  prenom_temoignage_3?: string;
  profession_temoignage_3?: string;
  age_temoignage_3?: string;
  emoji_profession_3?: string;
  temoignage_court_3?: string;
  temoignage_3_transformation_alignee?: string;
  
  // FAQ
  faq_question_1?: string;
  faq_reponse_1?: string;
  faq_question_2?: string;
  faq_reponse_2?: string;
  faq_question_3?: string;
  faq_reponse_3?: string;
  faq_question_4?: string;
  faq_reponse_4?: string;
  faq_question_5?: string;
  faq_reponse_5?: string;
  faq_objection_principale?: string;
  faq_reponse_objection_principale?: string;
  
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