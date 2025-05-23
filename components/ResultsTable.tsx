'use client';

import React from 'react';
import { Download, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { GenerationResult } from '@/lib/types';
import { CSVParser } from '@/lib/csv-parser';

interface ResultsTableProps {
  results: GenerationResult[];
  onDownloadCSV: () => void;
}

export default function ResultsTable({ results, onDownloadCSV }: ResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Résultats de la génération
          </h3>
          <button
            onClick={onDownloadCSV}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page de Vente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compte-Rendu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Onboarding
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {result.client_email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.documents.vente ? (
                    <a
                      href={result.documents.vente.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      {result.documents.vente.generated ? (
                        <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      )}
                      Ouvrir
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.documents['compte-rendu'] ? (
                    <a
                      href={result.documents['compte-rendu'].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      {result.documents['compte-rendu'].generated ? (
                        <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      )}
                      Ouvrir
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.documents.onboarding ? (
                    <a
                      href={result.documents.onboarding.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      {result.documents.onboarding.generated ? (
                        <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      )}
                      Ouvrir
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.success ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Succès
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Erreur
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total : {results.length} clients traités • 
          Succès : {results.filter(r => r.success).length} • 
          Erreurs : {results.filter(r => !r.success).length}
        </p>
      </div>
    </div>
  );
}