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
    console.log(`CSVParser: Génération CSV pour ${rows.length} lignes`);
    
    if (rows.length === 0) {
      console.warn('CSVParser: ATTENTION! Génération d\'un CSV vide');
      return '';
    }
    
    // Vérifier le contenu des données
    console.log('CSVParser: Première ligne à exporter:', rows[0]);
    
    // Vérifier si on a des données vides ou manquantes
    const emailsVides = rows.filter(r => !r.email).length;
    const telephoneVides = rows.filter(r => !r.telephone).length;
    const donneesVides = rows.filter(r => !r.donnees_completes || r.donnees_completes === '{}').length;
    const liensCRVides = rows.filter(r => !r.lien_compte_rendu).length;
    const liensVenteVides = rows.filter(r => !r.lien_page_vente).length;
    const liensOnboardingVides = rows.filter(r => !r.lien_onboarding).length;
    
    console.log('CSVParser: Statistiques des données manquantes:', {
      emailsVides, 
      telephoneVides, 
      donneesVides,
      liensCRVides,
      liensVenteVides,
      liensOnboardingVides
    });
    
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
    
    console.log(`CSVParser: CSV généré (${csv.length} caractères)`);
    if (csv.length < 100) {
      console.log('CSVParser: Contenu CSV complet (très court):', csv);
    } else {
      console.log('CSVParser: Début du CSV généré:', csv.substring(0, 100) + '...');
    }
    
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

  /**
   * Télécharge un fichier CSV
   */
  static downloadCSV(content: string, filename: string = 'export.csv'): void {
    console.log(`CSVParser: Début du téléchargement CSV '${filename}'`);
    console.log(`CSVParser: Taille du contenu CSV: ${content.length} caractères`);
    
    if (!content || content.length === 0) {
      console.error('CSVParser: ERREUR - Tentative de téléchargement d\'un CSV vide');
      alert('Erreur: Le CSV est vide, impossible de télécharger un fichier vide.');
      return;
    }
    
    // Vérifier si le CSV contient des données valides (au moins un header et une ligne)
    const lignes = content.split('\n');
    console.log(`CSVParser: Le CSV contient ${lignes.length} lignes`);
    
    if (lignes.length < 2) {
      console.warn('CSVParser: ATTENTION - Le CSV ne contient que le header, pas de données');
    }
    
    try {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      console.log(`CSVParser: Blob créé avec succès, taille: ${blob.size} octets`);
      
      const link = document.createElement('a');
      
      // Support pour IE 10+
      const nav = navigator as any;
      if (nav.msSaveBlob) {
        console.log('CSVParser: Utilisation de msSaveBlob pour IE');
        nav.msSaveBlob(blob, filename);
      } else {
        console.log('CSVParser: Utilisation de URL.createObjectURL pour les navigateurs modernes');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      console.log(`CSVParser: Téléchargement CSV '${filename}' terminé avec succès`);
    } catch (error) {
      console.error('CSVParser: ERREUR lors du téléchargement CSV:', error);
      alert(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}