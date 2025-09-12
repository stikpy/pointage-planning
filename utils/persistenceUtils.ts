import { AppState, Shift } from '../types';

// Configuration de la persistance
const STORAGE_KEYS = {
  APP_STATE: 'shift-management-app',
  BACKUP: 'shift-management-backup',
  LAST_SAVE: 'shift-management-last-save',
  RECOVERY_DATA: 'shift-management-recovery'
} as const;

// Interface pour les données de récupération
interface RecoveryData {
  timestamp: number;
  data: AppState;
  checksum: string;
}

// Interface pour les statistiques de persistance
interface PersistenceStats {
  lastSave: Date | null;
  backupCount: number;
  recoveryCount: number;
  dataIntegrity: boolean;
}

/**
 * Calcule un checksum simple pour vérifier l'intégrité des données
 */
function calculateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Sauvegarde les données avec vérification d'intégrité
 */
export function saveAppState(data: AppState): boolean {
  // Vérifier si nous sommes côté client
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const timestamp = Date.now();
    const checksum = calculateChecksum(data);
    
    // Sauvegarde principale
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, timestamp.toString());
    
    // Sauvegarde de récupération
    const recoveryData: RecoveryData = {
      timestamp,
      data,
      checksum
    };
    localStorage.setItem(STORAGE_KEYS.RECOVERY_DATA, JSON.stringify(recoveryData));
    
    // Sauvegarde de secours (rotation)
    const backupData = {
      timestamp,
      data,
      checksum,
      version: '1.0'
    };
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupData));
    
    console.log('✅ Données sauvegardées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    return false;
  }
}

/**
 * Charge les données avec vérification d'intégrité
 */
export function loadAppState(initialState: AppState): AppState {
  // Vérifier si nous sommes côté client
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    // Essayer de charger les données principales
    const mainData = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (mainData) {
      const parsed = JSON.parse(mainData);
      const checksum = calculateChecksum(parsed);
      
      // Vérifier l'intégrité avec les données de récupération
      const recoveryData = localStorage.getItem(STORAGE_KEYS.RECOVERY_DATA);
      if (recoveryData) {
        const recovery = JSON.parse(recoveryData) as RecoveryData;
        if (recovery.checksum === checksum) {
          console.log('✅ Données chargées avec intégrité vérifiée');
          return parsed;
        } else {
          console.warn('⚠️ Intégrité des données compromise, tentative de récupération...');
          return attemptRecovery(initialState);
        }
      }
      
      return parsed;
    }
    
    // Si pas de données principales, essayer la récupération
    return attemptRecovery(initialState);
  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    return attemptRecovery(initialState);
  }
}

/**
 * Tente de récupérer les données depuis les sauvegardes
 */
function attemptRecovery(initialState: AppState): AppState {
  // Vérifier si nous sommes côté client
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    // Essayer les données de récupération
    const recoveryData = localStorage.getItem(STORAGE_KEYS.RECOVERY_DATA);
    if (recoveryData) {
      const recovery = JSON.parse(recoveryData) as RecoveryData;
      const checksum = calculateChecksum(recovery.data);
      
      if (recovery.checksum === checksum) {
        console.log('✅ Récupération réussie depuis les données de récupération');
        return recovery.data;
      }
    }
    
    // Essayer la sauvegarde de secours
    const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
    if (backupData) {
      const backup = JSON.parse(backupData);
      const checksum = calculateChecksum(backup.data);
      
      if (backup.checksum === checksum) {
        console.log('✅ Récupération réussie depuis la sauvegarde de secours');
        return backup.data;
      }
    }
    
    console.warn('⚠️ Aucune récupération possible, utilisation des données initiales');
    return initialState;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error);
    return initialState;
  }
}

/**
 * Sauvegarde automatique périodique
 */
export function setupAutoSave(
  data: AppState, 
  saveFunction: (data: AppState) => void,
  intervalMs: number = 30000 // 30 secondes par défaut
): () => void {
  const intervalId = setInterval(() => {
    console.log('💾 Sauvegarde automatique...');
    saveFunction(data);
  }, intervalMs);
  
  // Sauvegarde avant fermeture de la page
  const handleBeforeUnload = () => {
    console.log('💾 Sauvegarde avant fermeture...');
    saveFunction(data);
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Fonction de nettoyage
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Exporte les données pour sauvegarde externe
 */
export function exportData(data: AppState): string {
  const exportData = {
    ...data,
    exportTimestamp: new Date().toISOString(),
    version: '1.0',
    checksum: calculateChecksum(data)
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Importe les données depuis un fichier exporté
 */
export function importData(jsonData: string): AppState | null {
  try {
    const imported = JSON.parse(jsonData);
    
    // Vérifier la structure de base
    if (!imported.shifts || !imported.employees) {
      throw new Error('Format de données invalide');
    }
    
    // Vérifier l'intégrité si un checksum est présent
    if (imported.checksum) {
      const calculatedChecksum = calculateChecksum(imported);
      if (calculatedChecksum !== imported.checksum) {
        throw new Error('Intégrité des données compromise');
      }
    }
    
    console.log('✅ Données importées avec succès');
    return imported as AppState;
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    return null;
  }
}

/**
 * Nettoie les anciennes sauvegardes
 */
export function cleanupOldBackups(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
  try {
    const now = Date.now();
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    
    if (lastSave) {
      const lastSaveTime = parseInt(lastSave);
      if (now - lastSaveTime > maxAgeMs) {
        // Nettoyer les anciennes sauvegardes
        localStorage.removeItem(STORAGE_KEYS.BACKUP);
        console.log('🧹 Anciennes sauvegardes nettoyées');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

/**
 * Obtient les statistiques de persistance
 */
export function getPersistenceStats(): PersistenceStats {
  try {
    if (typeof window === 'undefined') {
      return {
        lastSave: null,
        backupCount: 0,
        recoveryCount: 0,
        dataIntegrity: false
      };
    }
    
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    const recoveryData = localStorage.getItem(STORAGE_KEYS.RECOVERY_DATA);
    const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
    
    let dataIntegrity = false;
    if (recoveryData) {
      const recovery = JSON.parse(recoveryData) as RecoveryData;
      const checksum = calculateChecksum(recovery.data);
      dataIntegrity = recovery.checksum === checksum;
    }
    
    return {
      lastSave: lastSave ? new Date(parseInt(lastSave)) : null,
      backupCount: backupData ? 1 : 0,
      recoveryCount: recoveryData ? 1 : 0,
      dataIntegrity
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return {
      lastSave: null,
      backupCount: 0,
      recoveryCount: 0,
      dataIntegrity: false
    };
  }
}

/**
 * Détecte si l'application a été fermée de manière inattendue
 */
export function detectUnexpectedShutdown(): boolean {
  try {
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    if (!lastSave) return false;
    
    const lastSaveTime = parseInt(lastSave);
    const now = Date.now();
    const timeDiff = now - lastSaveTime;
    
    // Si plus de 5 minutes sans sauvegarde, considérer comme fermeture inattendue
    return timeDiff > 5 * 60 * 1000;
  } catch (error) {
    console.error('❌ Erreur lors de la détection:', error);
    return false;
  }
}
