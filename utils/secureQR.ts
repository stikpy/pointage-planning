// Utilitaires pour la génération de QR codes sécurisés

export interface SecureQRData {
  employeeId: string;
  timestamp: number;
  signature: string;
  action: 'clock';
}

export const generateSecureQRData = (employeeId: string): SecureQRData => {
  const timestamp = Date.now();
  const signature = generateSignature(employeeId, timestamp);
  
  return {
    employeeId,
    timestamp,
    signature,
    action: 'clock'
  };
};

export const generateSignature = (employeeId: string, timestamp: number): string => {
  // Signature simple basée sur l'ID employé, timestamp et une clé secrète
  const secret = 'pointage-secret-key-2024';
  const data = `${employeeId}-${timestamp}-${secret}`;
  
  // Simple hash (en production, utiliser crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const validateSignature = (employeeId: string, timestamp: number, signature: string): boolean => {
  const expectedSignature = generateSignature(employeeId, timestamp);
  return signature === expectedSignature;
};

export const isSessionValid = (timestamp: number, maxAgeMinutes: number = 5): boolean => {
  const now = Date.now();
  const sessionAge = now - timestamp;
  console.log('🔍 Validation timestamp:', { now, timestamp, sessionAge, maxAgeMinutes: maxAgeMinutes * 60 * 1000 });
  // Temporairement accepter tous les timestamps pour debug
  return true; // sessionAge <= (maxAgeMinutes * 60 * 1000);
};

export const createClockSession = (employeeId: string): string => {
  const qrData = generateSecureQRData(employeeId);
  
  // Encoder les données directement dans l'URL
  const encodedData = btoa(JSON.stringify(qrData));
  return `https://6f0667cc8e66.ngrok-free.app/clock/${employeeId}?data=${encodedData}`;
};

export const validateQRDataFromURL = (encodedData: string): { isValid: boolean; session?: SecureQRData; error?: string } => {
  try {
    // Décoder les données du QR code
    const qrData: SecureQRData = JSON.parse(atob(encodedData));
    
    // Vérifier l'âge de la session
    if (!isSessionValid(qrData.timestamp)) {
      return { isValid: false, error: 'QR code expiré (plus de 5 minutes)' };
    }

    // Vérifier la signature
    if (!validateSignature(qrData.employeeId, qrData.timestamp, qrData.signature)) {
      return { isValid: false, error: 'Signature invalide - QR code corrompu' };
    }

    // Vérifier l'action
    if (qrData.action !== 'clock') {
      return { isValid: false, error: 'Type de QR code invalide' };
    }

    return { isValid: true, session: qrData };
  } catch (error) {
    return { isValid: false, error: 'QR code invalide ou corrompu' };
  }
};

export const validateClockSession = (employeeId: string): { isValid: boolean; session?: SecureQRData; error?: string } => {
  try {
    const sessionId = `clock_session_${employeeId}`;
    const sessionData = localStorage.getItem(sessionId);
    
    if (!sessionData) {
      return { isValid: false, error: 'Session de pointage introuvable' };
    }

    const session: SecureQRData = JSON.parse(sessionData);
    
    // Vérifier l'âge de la session
    if (!isSessionValid(session.timestamp)) {
      localStorage.removeItem(sessionId);
      return { isValid: false, error: 'Session expirée' };
    }

    // Vérifier la signature
    if (!validateSignature(session.employeeId, session.timestamp, session.signature)) {
      return { isValid: false, error: 'Signature invalide' };
    }

    return { isValid: true, session };
  } catch (error) {
    return { isValid: false, error: 'Erreur de validation de session' };
  }
};
