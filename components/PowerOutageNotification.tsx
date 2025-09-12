"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff, Download, Upload, CheckCircle, X } from 'lucide-react';

interface PowerOutageNotificationProps {
  isOnline: boolean;
  lastSave: Date | null;
  dataIntegrity: boolean;
  recoveryNeeded: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onDismiss: () => void;
}

export default function PowerOutageNotification({
  isOnline,
  lastSave,
  dataIntegrity,
  recoveryNeeded,
  onExport,
  onImport,
  onDismiss
}: PowerOutageNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    // Afficher la notification si :
    // - Hors ligne
    // - Récupération nécessaire
    // - Intégrité des données compromise
    // - Dernière sauvegarde ancienne (> 5 minutes)
    const shouldShow = !isOnline || 
                      recoveryNeeded || 
                      !dataIntegrity || 
                      (lastSave && (Date.now() - lastSave.getTime()) > 5 * 60 * 1000);
    
    setShowNotification(Boolean(shouldShow));
  }, [isOnline, recoveryNeeded, dataIntegrity, lastSave]);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onImport(new File([content], file.name));
        setShowImportModal(false);
      };
      reader.readAsText(file);
    }
  };

  const getNotificationType = () => {
    if (!isOnline) return 'offline';
    if (recoveryNeeded) return 'recovery';
    if (!dataIntegrity) return 'integrity';
    return 'warning';
  };

  const getNotificationContent = () => {
    const type = getNotificationType();
    
    switch (type) {
      case 'offline':
        return {
          icon: <WifiOff className="w-5 h-5" />,
          title: 'Mode hors ligne',
          message: 'Vous travaillez hors ligne. Les données seront sauvegardées localement.',
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'recovery':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Récupération des données',
          message: 'Une fermeture inattendue a été détectée. Vos données ont été récupérées.',
          color: 'bg-orange-100 border-orange-300 text-orange-800',
          iconColor: 'text-orange-600'
        };
      case 'integrity':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Intégrité des données',
          message: 'Problème détecté avec les données. Exportez vos données pour sécurité.',
          color: 'bg-red-100 border-red-300 text-red-800',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Sauvegarde ancienne',
          message: 'Dernière sauvegarde il y a plus de 5 minutes. Sauvegardez vos données.',
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  if (!showNotification) return null;

  const content = getNotificationContent();

  return (
    <>
      {/* Notification principale */}
      <div className={`fixed top-4 right-4 z-50 max-w-md ${content.color} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${content.iconColor}`}>
            {content.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">{content.title}</h3>
            <p className="text-sm mt-1">{content.message}</p>
            
            {lastSave && (
              <p className="text-xs mt-2 opacity-75">
                Dernière sauvegarde: {lastSave.toLocaleString('fr-FR')}
              </p>
            )}
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" />
                Exporter
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
              >
                <Upload className="w-3 h-3 mr-1" />
                Importer
              </button>
              
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'export */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Exporter les données</h3>
            <p className="text-sm text-gray-600 mb-4">
              Téléchargez une sauvegarde de vos données pour les protéger contre les coupures de courant.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const data = onExport();
                  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sauvegarde-pointage-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setShowExportModal(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Télécharger
              </button>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Importer les données</h3>
            <p className="text-sm text-gray-600 mb-4">
              Restaurez vos données depuis un fichier de sauvegarde.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Glissez-déposez votre fichier de sauvegarde ici
              </p>
              
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="import-file"
              />
              
              <label
                htmlFor="import-file"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choisir un fichier
              </label>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
