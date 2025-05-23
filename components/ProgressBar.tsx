'use client';

import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ProcessingStatus } from '@/lib/types';

interface ProgressBarProps {
  status: ProcessingStatus;
}

export default function ProgressBar({ status }: ProgressBarProps) {
  const percentage = status.total > 0 
    ? Math.round((status.processed / status.total) * 100) 
    : 0;

  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Traitement en cours
        </h3>
        <span className="text-sm text-gray-600">
          {status.processed} / {status.total} clients
        </span>
      </div>

      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Succès: {status.success}</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Erreurs: {status.errors}</span>
          </div>
        </div>
        <span className="font-medium text-gray-700">{percentage}%</span>
      </div>

      {status.currentClient && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Traitement de : {status.currentClient}</span>
        </div>
      )}

      {status.status === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Traitement terminé avec succès !
            </p>
          </div>
        </div>
      )}

      {status.status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              Une erreur est survenue pendant le traitement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}