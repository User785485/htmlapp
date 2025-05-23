'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkError, useNetworkStatusIndicator } from '@/lib/hooks/useNetworkError';
import { logger } from '@/lib/logger';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export default function UploadZone({ onFileUpload, isProcessing }: UploadZoneProps) {
  // Utiliser le hook pour détecter les problèmes réseau
  const { networkStatus } = useNetworkError();
  
  // Activer l'indicateur visuel de statut réseau
  useNetworkStatusIndicator();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      logger.info('UPLOAD', 'file_dropped', 'Fichier déposé dans la zone de téléchargement', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        network_status: networkStatus.isOnline ? 'online' : 'offline',
      });
      
      onFileUpload(file);
    }
  }, [onFileUpload, networkStatus.isOnline]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    // Désactiver la zone de drop si hors ligne ou en cours de traitement
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isProcessing || !networkStatus.isOnline,
  });

  return (
    <div className="w-full">
      {/* Afficher un avertissement si connexion lente */}
      {networkStatus.isSlowConnection && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Connexion lente détectée
              </p>
              <p className="text-xs text-yellow-600">
                Le téléchargement pourrait prendre plus de temps
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing || !networkStatus.isOnline ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {!networkStatus.isOnline ? (
            <>
              <WifiOff className="w-16 h-16 text-gray-400" />
              <p className="text-lg font-medium text-gray-700">
                Connexion internet requise
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Veuillez vous reconnecter pour télécharger un fichier
              </p>
            </>
          ) : isDragActive ? (
            <>
              <FileText className="w-16 h-16 text-blue-500" />
              <p className="text-lg font-medium text-blue-600">
                Déposez le fichier CSV ici
              </p>
            </>
          ) : (
          
            <>
              <Upload className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Glissez-déposez votre fichier CSV ici
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  ou cliquez pour sélectionner
                </p>
              </div>
            </>
          )}
          
        </div>
      </div>

      {fileRejections.length > 0 && (
      
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Erreur lors de l'upload
              </p>
              <p className="text-sm text-red-600 mt-1">
                Veuillez sélectionner un fichier CSV valide
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Format attendu du CSV :
        </h3>
        <p className="text-xs text-gray-600 font-mono">
          email,telephone,prenom,nom,produit,prix,date_rencontre,objectifs,...
        </p>
      </div>
    </div>
  );
}