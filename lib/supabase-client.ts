import { createClient } from '@supabase/supabase-js';
import { GeneratedDocument } from './types';
import { logger } from './logger';
import { extendSupabaseClient, SelectOptions, compatSelect, compatUpsert, UpsertOptions } from './supabase-compat';

// Utiliser les variables d'environnement ou des valeurs de secours pour le développement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prbidefjoqdrqwjeenxm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzY3NDEsImV4cCI6MjA2MzYxMjc0MX0.FaiiU8DTqnBVkNjG2L3wkE0MCsKnit_CNdGMmP0oRME';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAzNjc0MSwiZXhwIjoyMDYzNjEyNzQxfQ.K-f19FXAPH-z2qfRGMS2zOUmsVJ-iya6l0xfEwlVf44';

// Log pour débogage
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Défini' : 'Non défini');
console.log('Supabase Service Key:', supabaseServiceKey ? 'Défini' : 'Non défini');

// Patch pour la méthode select de Supabase
// Ceci permet de contourner les différences de signature entre les versions
interface ExtendedGlobalThis {
  supaPatchApplied?: boolean;
}

if (!(globalThis as ExtendedGlobalThis).supaPatchApplied) {
  // Patch la méthode select globalement pour le monkeypatch
  const originalSelect = Object.getPrototypeOf(createClient(supabaseUrl, supabaseAnonKey).from('test')).select;
  
  if (originalSelect) {
    Object.defineProperty(Object.getPrototypeOf(createClient(supabaseUrl, supabaseAnonKey).from('test')), 'select', {
      value: function(columns: string, options?: SelectOptions) {
        try {
          // Essayer d'abord avec les deux paramètres (nouvelle version)
          if (options) {
            return originalSelect.call(this, columns, options);
          } else {
            return originalSelect.call(this, columns);
          }
        } catch (e) {
          // Fall back à la version compatible
          logger.debug('SUPABASE', 'version_fallback', 'Utilisation du fallback pour select', { error: e instanceof Error ? e.message : String(e) });
          
          // Appeler select avec un seul paramètre
          let result = originalSelect.call(this, columns);
          
          // Appliquer manuellement les options
          if (options) {
            if (options.count) {
              result = result.count(options.count);
            }
            if (options.head) {
              result = result.limit(1);
            }
          }
          
          return result;
        }
      }
    });
  }
  
  (globalThis as ExtendedGlobalThis).supaPatchApplied = true;
}

// Client public pour le côté client
export const supabase = extendSupabaseClient(createClient(supabaseUrl, supabaseAnonKey));

// Client service pour le côté serveur (avec tous les droits)
export const supabaseAdmin = extendSupabaseClient(createClient(supabaseUrl, supabaseServiceKey));

export class SupabaseService {
  /**
   * Vérifie si un client existe déjà dans la base
   */
  static async checkClientExists(email: string): Promise<GeneratedDocument | null> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabaseAdmin
        .from('generated_documents')
        .select('*')
        .eq('client_email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      const duration = Date.now() - startTime;
      logger.logSupabase('check_exists', 'generated_documents', true, {
        client_email: email,
        found: !!data,
        duration_ms: duration,
      });
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('check_exists', 'generated_documents', false, {
        client_email: email,
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Crée ou met à jour un document client 
   * Utilise la structure avec colonnes spécifiques (vente_url, compte_rendu_url, etc.)
   */
  static async upsertClient(document: GeneratedDocument): Promise<GeneratedDocument> {
    const startTime = Date.now();
    
    console.log('SupabaseService: Début upsertClient', {
      email: document.client_email,
      champs: Object.keys(document)
    });
    
    try {
      // Utiliser la fonction compatUpsert avec un cast de type pour contourner les vérifications TypeScript
      const { data, error } = await compatUpsert(
        supabaseAdmin.from('generated_documents') as any,
        document,
        {
          onConflict: 'client_email',
          returning: 'representation'
        }
      )
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const duration = Date.now() - startTime;
      console.log('SupabaseService: upsertClient réussi', {
        client_email: document.client_email,
        has_vente: !!document.vente_url,
        has_compte_rendu: !!document.compte_rendu_url,
        has_onboarding: !!document.onboarding_url,
        duration_ms: duration
      });
      
      // Utiliser le logger pour conserver les logs
      logger.logSupabase('upsert', 'generated_documents', true, {
        client_email: document.client_email,
        has_vente: !!document.vente_url,
        has_compte_rendu: !!document.compte_rendu_url,
        has_onboarding: !!document.onboarding_url,
        duration_ms: duration,
      });
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('upsert', 'generated_documents', false, {
        client_email: document.client_email,
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Crée ou met à jour un document dans la structure générique avec document_type
   */
  static async upsertDocument(document: any): Promise<any> {
    const startTime = Date.now();
    const documentType = document.document_type || 'unknown';
    
    try {
      console.log(`SupabaseService: Insertion du document ${documentType} pour ${document.client_email}`);
      
      // Vérifier si le document existe déjà pour pouvoir le mettre à jour
      const { data: existingDocs, error: checkError } = await supabaseAdmin
        .from('generated_documents')
        .select('id')
        .eq('client_email', document.client_email)
        .eq('document_type', documentType);
      
      if (checkError) {
        console.error('SupabaseService: Erreur lors de la vérification du document', checkError);
        throw checkError;
      }
      
      let result;
      
      // Si le document existe, le mettre à jour, sinon l'insérer
      if (existingDocs && existingDocs.length > 0) {
        console.log(`SupabaseService: Mise à jour du document existant ${documentType} pour ${document.client_email}`);
        
        const { data, error } = await supabaseAdmin
          .from('generated_documents')
          .update(document)
          .eq('id', existingDocs[0].id)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        result = data;
      } else {
        console.log(`SupabaseService: Création d'un nouveau document ${documentType} pour ${document.client_email}`);
        
        const { data, error } = await supabaseAdmin
          .from('generated_documents')
          .insert(document)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        result = data;
      }
      
      const duration = Date.now() - startTime;
      logger.logSupabase('upsert_document', 'generated_documents', true, {
        client_email: document.client_email,
        document_type: documentType,
        duration_ms: duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('upsert_document', 'generated_documents', false, {
        client_email: document.client_email,
        document_type: documentType,
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Met à jour les URLs d'un client existant
   */
  static async updateClientUrls(
    email: string, 
    updates: Partial<GeneratedDocument>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabaseAdmin
        .from('generated_documents')
        .update(updates)
        .eq('client_email', email);
      
      if (error) {
        throw error;
      }
      
      const duration = Date.now() - startTime;
      logger.logSupabase('update_urls', 'generated_documents', true, {
        client_email: email,
        fields_updated: Object.keys(updates),
        has_vente: 'vente_url' in updates,
        has_compte_rendu: 'compte_rendu_url' in updates,
        has_onboarding: 'onboarding_url' in updates,
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('update_urls', 'generated_documents', false, {
        client_email: email,
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Récupère tous les documents générés
   */
  static async getAllDocuments(): Promise<GeneratedDocument[]> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabaseAdmin
        .from('generated_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const duration = Date.now() - startTime;
      logger.logSupabase('get_all', 'generated_documents', true, {
        count: data?.length || 0,
        duration_ms: duration,
      });
      
      return data || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('get_all', 'generated_documents', false, {
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
  
  /**
   * Récupère les statistiques
   */
  static async getStats() {
    const startTime = Date.now();
    
    try {
      const { count: totalClients } = await supabaseAdmin
        .from('generated_documents')
        .select('*', { count: 'exact', head: true });
      
      const { count: withVente } = await supabaseAdmin
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .not('vente_url', 'is', null);
      
      const { count: withCR } = await supabaseAdmin
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .not('compte_rendu_url', 'is', null);
      
      const { count: withOnboarding } = await supabaseAdmin
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .not('onboarding_url', 'is', null);
      
      const stats = {
        totalClients: totalClients || 0,
        documentsGenerated: {
          vente: withVente || 0,
          compteRendu: withCR || 0,
          onboarding: withOnboarding || 0
        }
      };
      
      const duration = Date.now() - startTime;
      logger.logSupabase('get_stats', 'generated_documents', true, {
        total_clients: totalClients || 0,
        with_vente: withVente || 0,
        with_compte_rendu: withCR || 0,
        with_onboarding: withOnboarding || 0,
        duration_ms: duration,
      });
      
      return stats;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logSupabase('get_stats', 'generated_documents', false, {
        error: error instanceof Error ? error.message : error,
        duration_ms: duration,
      });
      throw error;
    }
  }
}