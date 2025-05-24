/**
 * Module de compatibilité pour les différentes versions de Supabase
 * 
 * Ce module fournit des utilitaires pour gérer les différences d'API
 * entre les versions de Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

// Étendre le type PostgrestQueryBuilder pour inclure nos méthodes compatibles
declare module '@supabase/postgrest-js' {
  interface PostgrestQueryBuilder<Schema, Relation, RelationName, Relationships, T, J> {
    compatSelect: (columns: string, options?: SelectOptions) => PostgrestQueryBuilder<Schema, Relation, RelationName, Relationships, T, J>;
    compatUpsert: (documents: any | any[], options?: UpsertOptions) => PostgrestQueryBuilder<Schema, Relation, RelationName, Relationships, T, J>;
  }
}

/**
 * Options de sélection pour les requêtes Supabase
 */
export interface SelectOptions {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
}

/**
 * Options pour l'opération upsert
 */
export interface UpsertOptions {
  onConflict?: string;
  returning?: string;
  ignoreDuplicates?: boolean;
  count?: 'exact' | 'planned' | 'estimated';
}

/**
 * Exécute une requête select compatible avec différentes versions de Supabase
 * 
 * @param query La requête Supabase (table, de, from, etc.)
 * @param columns Les colonnes à sélectionner (ex: '*')
 * @param options Options de sélection (count, head, etc.)
 * @returns La requête avec select appliqué
 */
export function compatSelect(query: any, columns: string, options?: SelectOptions) {
  // Version plus récente de Supabase (deux paramètres)
  try {
    if (options) {
      return query.select(columns, options);
    } else {
      return query.select(columns);
    }
  } catch (e) {
    // Version plus ancienne de Supabase (un seul paramètre)
    try {
      // Appliquer d'abord select
      let result = query.select(columns);
      
      // Puis appliquer les options une par une si nécessaire
      if (options) {
        if (options.count) {
          result = result.count(options.count);
        }
        if (options.head) {
          result = result.limit(1);
        }
      }
      
      return result;
    } catch (e2) {
      console.error('Erreur de compatibilité Supabase:', e2);
      throw e2;
    }
  }
}

/**
 * Exécute une opération upsert compatible avec différentes versions de Supabase
 * 
 * @param query La requête Supabase (table, from, etc.)
 * @param documents Les documents à insérer/mettre à jour (un seul document ou un tableau)
 * @param options Options pour l'upsert (onConflict, returning, etc.)
 * @returns La requête avec upsert appliqué
 */
export function compatUpsert(query: any, documents: any | any[], options?: UpsertOptions) {
  // Convertir un seul document en tableau si nécessaire
  const docs = Array.isArray(documents) ? documents : [documents];
  
  // Tenter différentes approches selon la version de Supabase
  try {
    // Approche 1: Version plus récente avec options séparées
    if (options) {
      // Créer un nouvel objet d'options sans 'returning' si présent
      const sanitizedOptions: any = { ...options };
      if (sanitizedOptions.returning) {
        delete sanitizedOptions.returning;
      }
      
      // Appliquer l'upsert avec les options sanitizées
      let result = query.upsert(docs, sanitizedOptions);
      
      // Si returning était spécifié, ajouter un select
      if (options.returning) {
        result = result.select();
      }
      
      return result;
    } else {
      // Sans options
      return query.upsert(docs);
    }
  } catch (error) {
    // Approche 2: Ancienne version avec options intégrées
    try {
      // Format alternatif
      return query.upsert(docs, options);
    } catch (error2) {
      // Approche 3: Dernier recours, séparer l'insertion et la mise à jour
      if (process.env.NODE_ENV === 'development') {
        console.warn('Fallback pour upsert: utilisation d\'insert avec onConflict manuel', error2);
      }
      
      if (options?.onConflict) {
        return query.insert(docs).onConflict(options.onConflict);
      } else {
        return query.insert(docs);
      }
    }
  }
}

/**
 * Extension pour les clients Supabase
 */
export const extendSupabaseClient = (client: SupabaseClient) => {
  const originalFrom = client.from.bind(client);
  
  // Surcharge de la méthode from pour ajouter nos méthodes de compatibilité
  client.from = (table: string) => {
    const query = originalFrom(table);
    
    // Ajouter une méthode compatSelect
    (query as any).compatSelect = (columns: string, options?: SelectOptions) => {
      return compatSelect(query, columns, options);
    };
    
    // Ajouter une méthode compatUpsert
    (query as any).compatUpsert = (documents: any | any[], options?: UpsertOptions) => {
      return compatUpsert(query, documents, options);
    };
    
    return query;
  };
  
  return client;
};