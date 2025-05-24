/**
 * Module de compatibilité pour les différentes versions de Supabase
 * 
 * Ce module fournit des utilitaires pour gérer les différences d'API
 * entre les versions de Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Options de sélection pour les requêtes Supabase
 */
export interface SelectOptions {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
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
    
    return query;
  };
  
  return client;
};
