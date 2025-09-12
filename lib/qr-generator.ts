import { createHash } from 'crypto';

export interface QRCodeData {
  employeeId: string;
  timestamp: number;
  signature: string;
  action: 'clock' | 'break' | 'end_shift';
  expiresAt: number;
  shiftType?: 'morning' | 'evening';
}

export function generateQRCode(employeeId: string, action: 'clock' | 'break' | 'end_shift' = 'clock'): QRCodeData {
  const timestamp = Date.now();
  const expiresAt = timestamp + (5 * 60 * 1000); // 5 minutes d'expiration
  const secret = process.env.QR_SECRET || 'default-secret-key';
  
  // Déterminer le type de shift selon l'heure
  const now = new Date();
  const hour = now.getHours();
  const shiftType = hour < 12 ? 'morning' : 'evening';
  
  const data = `${employeeId}-${timestamp}-${action}-${shiftType}`;
  const signature = createHash('sha256')
    .update(data + secret)
    .digest('hex')
    .substring(0, 8);

  return {
    employeeId,
    timestamp,
    signature,
    action,
    expiresAt,
    shiftType
  };
}

export function validateQRCode(data: QRCodeData): boolean {
  const now = Date.now();
  
  // Vérifier l'expiration
  if (now > data.expiresAt) {
    return false;
  }
  
  // Vérifier la signature
  const secret = process.env.QR_SECRET || 'default-secret-key';
  const expectedData = `${data.employeeId}-${data.timestamp}-${data.action}-${data.shiftType}`;
  const expectedSignature = createHash('sha256')
    .update(expectedData + secret)
    .digest('hex')
    .substring(0, 8);
  
  return data.signature === expectedSignature;
}

export function encodeQRData(data: QRCodeData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeQRData(encodedData: string): QRCodeData | null {
  try {
    const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
