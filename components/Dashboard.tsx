'use client';

import React, { useState } from 'react';
import { FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';
import UploadZone from './UploadZone';
import ProgressBar from './ProgressBar';
import ResultsTable from './ResultsTable';
import { ClientData, ProcessingStatus, GenerationResult, CSVExportRow } from '@/lib/types';
import { CSVParser } from '@/lib/csv-parser';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    status: 'idle'
  });
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setValidationErrors([]);
    
    try {
      // Parser le CSV
      const parsedClients = await CSVParser.parseCSV(uploadedFile);
      
      // Valider la structure
      const validation = CSVParser.validateCSVStructure(parsedClients);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      setClients(parsedClients);
    } catch (error) {
      console.error('Erreur parsing CSV:', error);
      setValidationErrors(['Erreur lors de la lecture du fichier CSV']);
    }
  };

  const handleGenerate = async () => {
    if (clients.length === 0) return;

    setProcessingStatus({
      total: clients.length,
      processed: 0,
      success: 0,
      errors: 0,
      status: 'processing'
    });

    const newResults: GenerationResult[] = [];

    // Traiter par batch
    const batchSize = 10;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      
      // Traiter le batch en parallèle
      const batchPromises = batch.map(async (client) => {
        setProcessingStatus(prev => ({
          ...prev,
          currentClient: client.email
        }));

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client })
          });

          const result = await response.json();
          
          // IMPORTANT: Attacher les données client complètes au résultat
          result.client = client;
          
          console.log('Résultat avec client attaché:', { 
            email: result.client_email, 
            success: result.success, 
            client_attached: !!result.client
          });
          
          if (result.success) {
            setProcessingStatus(prev => ({
              ...prev,
              processed: prev.processed + 1,
              success: prev.success + 1
            }));
          } else {
            setProcessingStatus(prev => ({
              ...prev,
              processed: prev.processed + 1,
              errors: prev.errors + 1
            }));
          }

          newResults.push(result);
        } catch (error) {
          console.error(`Erreur pour ${client.email}:`, error);
          setProcessingStatus(prev => ({
            ...prev,
            processed: prev.processed + 1,
            errors: prev.errors + 1
          }));
          
          // Même en cas d'erreur, inclure les données client complètes
          newResults.push({
            client_email: client.email,
            client: client, // Attacher les données client complètes
            success: false,
            documents: {},
            error: 'Erreur de traitement'
          });
          
          console.log('Résultat d\'erreur avec client attaché:', { 
            email: client.email, 
            client_attached: true
          });
        }
      });

      await Promise.all(batchPromises);
    }

    setResults(newResults);
    setProcessingStatus(prev => ({
      ...prev,
      status: 'completed',
      currentClient: undefined
    }));
  };

  const handleDownloadCSV = async () => {
    console.log('Début de l\'export CSV');
    console.log('Results disponibles:', results.length);
    console.log('Premier résultat:', {
      email: results[0]?.client_email,
      has_client_data: !!results[0]?.client,
      documents: Object.keys(results[0]?.documents || {})
    });
    
    try {
      // Vérifier que les résultats contiennent bien les données client
      if (results.length > 0 && !results[0].client) {
        console.warn('ATTENTION: Les données client ne semblent pas attachées aux résultats');
      }
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Réponse de l\'API export:', {
        success: !!responseData.csv,
        csvLength: responseData.csv?.length || 0
      });
      
      if (!responseData.csv) {
        throw new Error('Aucune donnée CSV retournée par l\'API');
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `export_${timestamp}.csv`;
      CSVParser.downloadCSV(responseData.csv, filename);
      console.log(`CSV téléchargé avec succès: ${filename}`);
    } catch (error) {
      console.error('Erreur export CSV:', error);
      // Typer correctement l'erreur pour accéder à message
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de l'export CSV: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HTML Personalizer V2
          </h1>
          <p className="mt-2 text-gray-600">
            Générez et publiez des documents personnalisés avec protection par mot de passe
          </p>
        </div>

        <div className="space-y-6">
          {/* Zone d'upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. Importer le fichier CSV
            </h2>
            <UploadZone 
              onFileUpload={handleFileUpload}
              isProcessing={processingStatus.status === 'processing'}
            />
          </div>

          {/* Erreurs de validation */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Erreurs de validation
                  </p>
                  <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Résumé du fichier */}
          {clients.length > 0 && validationErrors.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Résumé du fichier
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
                    <p className="text-sm text-gray-600">Clients à traiter</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{clients.length * 3}</p>
                    <p className="text-sm text-gray-600">Documents à générer</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">Prêt</p>
                    <p className="text-sm text-gray-600">À lancer</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={processingStatus.status === 'processing'}
                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingStatus.status === 'processing' ? 'Traitement en cours...' : 'Lancer la génération'}
              </button>
            </div>
          )}

          {/* Barre de progression */}
          {processingStatus.status !== 'idle' && (
            <ProgressBar status={processingStatus} />
          )}

          {/* Tableau des résultats */}
          {results.length > 0 && (
            <ResultsTable 
              results={results}
              onDownloadCSV={handleDownloadCSV}
            />
          )}
        </div>
      </div>
    </div>
  );
}