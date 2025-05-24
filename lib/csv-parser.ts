import Papa from 'papaparse';
import { ClientData, CSVExportRow } from './types';

/**
 * Parse une chaîne CSV et retourne les données clients
 */
export function parseCSVString(csvString: string): Promise<ClientData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('Erreurs de parsing CSV:', results.errors);
          reject(new Error('Erreur lors du parsing du CSV'));
          return;
        }
        
        // Validation et nettoyage des données
        const clients = results.data
          .filter((row: any) => row.email && row.email.trim() !== '')
          .map((row: any) => {
            return {
              email: row.email?.trim().toLowerCase() || '',
              telephone: row.telephone?.trim() || '',
              prenom: row.prenom?.trim() || '',
              nom: row.nom?.trim() || '',
              
              // Variables pour vente
              produit: row.produit?.trim() || '',
              prix: row.prix?.trim() || '',
              offre_speciale: row.offre_speciale?.trim() || '',
              
              // Variables pour compte-rendu
              date_rencontre: row.date_rencontre?.trim() || '',
              objectifs: row.objectifs?.trim() || '',
              recommandations: row.recommandations?.trim() || '',
              
              // Variables pour onboarding
              etapes_onboarding: row.etapes_onboarding?.trim() || '',
              conseils_onboarding: row.conseils_onboarding?.trim() || '',
              
              // Conserver toutes les autres colonnes
              ...Object.keys(row).reduce((acc: any, key: string) => {
                if (!['email', 'telephone', 'prenom', 'nom', 'produit', 'prix', 
                      'offre_speciale', 'date_rencontre', 'objectifs', 'recommandations',
                      'etapes_onboarding', 'conseils_onboarding'].includes(key)) {
                  acc[key] = row[key]?.trim() || '';
                }
                return acc;
              }, {})
            };
          });
        
        resolve(clients);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

/**
 * Analyse les données des clients pour détecter les doublons et les regrouper
 */
export function analyzeClientData(clients: ClientData[]): { 
  duplicates: { [key: string]: ClientData[] },
  uniqueCount: number,
  totalCount: number
} {
  const emails = new Map<string, ClientData[]>();
  
  // Regrouper par email
  clients.forEach(client => {
    const email = client.email.toLowerCase();
    if (!emails.has(email)) {
      emails.set(email, []);
    }
    emails.get(email)!.push(client);
  });
  
  // Identifier les doublons
  const duplicates: { [key: string]: ClientData[] } = {};
  let uniqueCount = 0;
  
  emails.forEach((clientsGroup, email) => {
    if (clientsGroup.length > 1) {
      duplicates[email] = clientsGroup;
    } else {
      uniqueCount++;
    }
  });
  
  return {
    duplicates,
    uniqueCount,
    totalCount: clients.length
  };
}

export class CSVParser {
  /**
   * Parse un fichier CSV et retourne les données clients
   */
  static async parseCSV(file: File): Promise<ClientData[]> {
    console.log('Début du parsing CSV...', { filename: file.name, size: file.size, type: file.type });
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          console.error('Erreur Papa.parse:', error);
          reject(error);
        },
        complete: (results) => {
          console.log('Résultats du parsing:', { 
            rowCount: results.data.length,
            errorCount: results.errors.length,
            sampleRow: results.data.length > 0 ? results.data[0] : null,
            meta: results.meta
          });
          
          if (results.errors.length > 0) {
            console.error('Erreurs détaillées de parsing CSV:', JSON.stringify(results.errors));
            reject(new Error('Erreur lors du parsing du CSV'));
            return;
          }
          
          // Validation et nettoyage des données
          const clients = results.data
            .filter((row: any) => row.email && row.email.trim() !== '')
            .map((row: any) => this.cleanClientData(row));
          
          resolve(clients);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Nettoie }lide les données d'un client
   */
  private static cleanClientData(row: any): ClientData {
    return {
      email: row.email?.trim().toLowerCase() || '',
      telephone: row.telephone?.trim() || '',
      prenom: row.prenom?.trim() || '',
      nom: row.nom?.trim() || '',
      
      // Variables pour vente
      produit: row.produit?.trim() || '',
      prix: row.prix?.trim() || '',
      offre_speciale: row.offre_speciale?.trim() || '',
      
      // Variables pour compte-rendu
      date_rencontre: row.date_rencontre?.trim() || '',
      objectifs: row.objectifs?.trim() || '',
      recommandations: row.recommandations?.trim() || '',
      
      // Variables pour onboarding
      etapes_onboarding: row.etapes_onboarding?.trim() || '',
      conseils_onboarding: row.conseils_onboarding?.trim() || '',
      
      // Conserver toutes les autres colonnes
      ...Object.keys(row).reduce((acc: any, key: string) => {
        if (!['email', 'telephone', 'prenom', 'nom', 'produit', 'prix', 
              'offre_speciale', 'date_rencontre', 'objectifs', 'recommandations',
              'etapes_onboarding', 'conseils_onboarding'].includes(key)) {
          acc[key] = row[key]?.trim() || '';
        }
        return acc;
      }, {})
    };
  }
  
  /**
   * Génère un CSV d'export avec les liens
   */
  static generateExportCSV(rows: CSVExportRow[]): string {
    const csv = Papa.unparse(rows, {
      header: true,
      columns: [
        'email',
        'telephone', 
        'donnees_completes',
        'lien_compte_rendu',
        'lien_page_vente',
        'lien_onboarding'
      ]
    });
    
    return csv;
  }
  
  /**
   * Valide la structure du CSV et renvoie les erreurs
   */
  static validateCSVStructure(data: any[]): { valid: boolean; errors: string[] } {
    console.log('Validating CSV structure...');
    const errors: string[] = [];
    const requiredColumns = ['email', 'telephone', 'prenom'];
    
    if (data.length === 0) {
      errors.push('Le fichier CSV est vide');
      return { valid: false, errors };
    }
    
    // Vérifier les colonnes requises
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
    }
    
    // Vérifier les emails valides
    const invalidEmails = data
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !this.isValidEmail(row.email))
      .map(({ index }) => index + 2); // +2 car ligne 1 = headers
    
    if (invalidEmails.length > 0) {
      errors.push(`Emails invalides aux lignes: ${invalidEmails.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valide un email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}