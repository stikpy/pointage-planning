import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { 
  saveAppState, 
  loadAppState, 
  setupAutoSave, 
  getPersistenceStats,
  detectUnexpectedShutdown,
  exportData,
  importData
} from '../utils/persistenceUtils';

interface UseRobustStorageReturn {
  data: AppState;
  setData: (data: AppState) => void;
  isOnline: boolean;
  lastSave: Date | null;
  dataIntegrity: boolean;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  forceSave: () => boolean;
  recoveryNeeded: boolean;
}

export function useRobustStorage(
  key: string, 
  initialValue: AppState
): UseRobustStorageReturn {
  const [data, setDataState] = useState<AppState>(() => 
    loadAppState(initialValue)
  );
  
  const [isOnline, setIsOnline] = useState(true);
  const [recoveryNeeded, setRecoveryNeeded] = useState(false);
  const autoSaveCleanupRef = useRef<(() => void) | null>(null);
  const lastSaveRef = useRef<Date | null>(null);

  // Détecter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Connexion rétablie');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Connexion perdue - mode hors ligne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Détecter les fermetures inattendues
  useEffect(() => {
    const wasUnexpectedShutdown = detectUnexpectedShutdown();
    if (wasUnexpectedShutdown) {
      setRecoveryNeeded(true);
      console.warn('⚠️ Fermeture inattendue détectée - récupération des données');
    }
  }, []);

  // Fonction de sauvegarde robuste
  const setData = useCallback((newData: AppState) => {
    setDataState(newData);
    
    // Sauvegarder immédiatement
    const success = saveAppState(newData);
    if (success) {
      lastSaveRef.current = new Date();
    }
  }, []);

  // Sauvegarde forcée
  const forceSave = useCallback((): boolean => {
    const success = saveAppState(data);
    if (success) {
      lastSaveRef.current = new Date();
      console.log('💾 Sauvegarde forcée réussie');
    }
    return success;
  }, [data]);

  // Configuration de la sauvegarde automatique
  useEffect(() => {
    if (autoSaveCleanupRef.current) {
      autoSaveCleanupRef.current();
    }

    autoSaveCleanupRef.current = setupAutoSave(data, setData, 30000); // 30 secondes

    return () => {
      if (autoSaveCleanupRef.current) {
        autoSaveCleanupRef.current();
      }
    };
  }, [data, setData]);

  // Sauvegarde avant fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('💾 Sauvegarde d\'urgence avant fermeture...');
      saveAppState(data);
      
      // Si hors ligne, empêcher la fermeture pour donner le temps de sauvegarder
      if (!isOnline) {
        event.preventDefault();
        event.returnValue = 'Données non sauvegardées. Voulez-vous vraiment quitter ?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, isOnline]);

  // Fonction d'export
  const exportDataFn = useCallback((): string => {
    return exportData(data);
  }, [data]);

  // Fonction d'import
  const importDataFn = useCallback((jsonData: string): boolean => {
    const imported = importData(jsonData);
    if (imported) {
      setData(imported);
      setRecoveryNeeded(false);
      console.log('✅ Données importées avec succès');
      return true;
    }
    return false;
  }, [setData]);

  // Obtenir les statistiques de persistance
  const stats = getPersistenceStats();

  return {
    data,
    setData,
    isOnline,
    lastSave: stats.lastSave,
    dataIntegrity: stats.dataIntegrity,
    exportData: exportDataFn,
    importData: importDataFn,
    forceSave,
    recoveryNeeded
  };
}
