"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Shield,
  Clock,
  User,
  MapPin,
  Battery,
  Signal
} from 'lucide-react';
import { BadgeType, User as UserType } from '../types';
import { useAuth } from '../lib/auth';

interface NFCBadge {
  id: string;
  employeeId: string;
  badgeType: BadgeType;
  encryptedData: string;
  expiresAt: Date;
  permissions: string[];
}

interface NFCStatus {
  isSupported: boolean;
  isEnabled: boolean;
  isScanning: boolean;
  lastScan?: Date;
  error?: string;
}

interface NFCManagerProps {
  onBadgeScanned: (badge: NFCBadge) => void;
  onError: (error: string) => void;
}

export default function NFCManager({ onBadgeScanned, onError }: NFCManagerProps) {
  const { user } = useAuth();
  const [nfcStatus, setNfcStatus] = useState<NFCStatus>({
    isSupported: false,
    isEnabled: false,
    isScanning: false
  });
  const [scannedBadges, setScannedBadges] = useState<NFCBadge[]>([]);
  const [deviceInfo, setDeviceInfo] = useState({
    batteryLevel: 100,
    isOnline: true,
    location: null as { lat: number; lng: number } | null
  });

  useEffect(() => {
    checkNFCSupport();
    setupDeviceInfo();
  }, []);

  const checkNFCSupport = useCallback(() => {
    // Vérifier le support NFC
    const isSupported = 'NDEFReader' in window;
    
    if (!isSupported) {
      setNfcStatus(prev => ({
        ...prev,
        isSupported: false,
        error: 'NFC non supporté sur cet appareil'
      }));
      return;
    }

    // Vérifier les permissions
    navigator.permissions.query({ name: 'nfc' as PermissionName }).then((result) => {
      setNfcStatus(prev => ({
        ...prev,
        isSupported: true,
        isEnabled: result.state === 'granted',
        error: result.state === 'denied' ? 'Permission NFC refusée' : undefined
      }));
    }).catch(() => {
      setNfcStatus(prev => ({
        ...prev,
        isSupported: true,
        isEnabled: false,
        error: 'Impossible de vérifier les permissions NFC'
      }));
    });
  }, []);

  const setupDeviceInfo = useCallback(() => {
    // Batterie
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100)
        }));
        
        battery.addEventListener('levelchange', () => {
          setDeviceInfo(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100)
          }));
        });
      });
    }

    // Connexion
    const updateOnlineStatus = () => {
      setDeviceInfo(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Géolocalisation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceInfo(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.log('Géolocalisation refusée:', error);
        }
      );
    }
  }, []);

  const requestNFCPermission = useCallback(async () => {
    try {
      // Demander la permission NFC
      const permission = await navigator.permissions.query({ name: 'nfc' as PermissionName });
      
      if (permission.state === 'granted') {
        setNfcStatus(prev => ({
          ...prev,
          isEnabled: true,
          error: undefined
        }));
        return true;
      } else if (permission.state === 'prompt') {
        // Essayer d'initialiser NFC pour déclencher la demande
        const reader = new (window as any).NDEFReader();
        await reader.scan();
        setNfcStatus(prev => ({
          ...prev,
          isEnabled: true,
          error: undefined
        }));
        return true;
      } else {
        setNfcStatus(prev => ({
          ...prev,
          isEnabled: false,
          error: 'Permission NFC refusée'
        }));
        return false;
      }
    } catch (error: any) {
      setNfcStatus(prev => ({
        ...prev,
        isEnabled: false,
        error: `Erreur permission NFC: ${error.message}`
      }));
      return false;
    }
  }, []);

  const startNFCScan = useCallback(async () => {
    if (!nfcStatus.isSupported || !nfcStatus.isEnabled) {
      const hasPermission = await requestNFCPermission();
      if (!hasPermission) return;
    }

    try {
      const reader = new (window as any).NDEFReader();
      
      setNfcStatus(prev => ({
        ...prev,
        isScanning: true,
        error: undefined
      }));

      // Écouter les messages NFC
      reader.addEventListener('reading', (event: any) => {
        const message = event.message;
        const records = message.records;
        
        records.forEach((record: any) => {
          if (record.recordType === 'text') {
            try {
              const textDecoder = new TextDecoder();
              const badgeData = JSON.parse(textDecoder.decode(record.data));
              
              // Valider les données du badge
              const badge: NFCBadge = {
                id: badgeData.id,
                employeeId: badgeData.employeeId,
                badgeType: BadgeType.NFC,
                encryptedData: badgeData.encryptedData,
                expiresAt: new Date(badgeData.expiresAt),
                permissions: badgeData.permissions || []
              };

              // Vérifier l'expiration
              if (badge.expiresAt < new Date()) {
                onError('Badge NFC expiré');
                return;
              }

              // Vérifier les permissions
              if (!badge.permissions.includes('clock_in') && !badge.permissions.includes('clock_out')) {
                onError('Badge NFC sans permissions de pointage');
                return;
              }

              setScannedBadges(prev => [badge, ...prev.slice(0, 9)]); // Garder les 10 derniers
              onBadgeScanned(badge);
              
              setNfcStatus(prev => ({
                ...prev,
                lastScan: new Date()
              }));

            } catch (error) {
              onError('Données NFC invalides');
            }
          }
        });
      });

      // Gérer les erreurs
      reader.addEventListener('readingerror', (event: any) => {
        setNfcStatus(prev => ({
          ...prev,
          isScanning: false,
          error: `Erreur lecture NFC: ${event.error.message}`
        }));
      });

      await reader.scan();
      
    } catch (error: any) {
      setNfcStatus(prev => ({
        ...prev,
        isScanning: false,
        error: `Erreur NFC: ${error.message}`
      }));
      onError(`Erreur NFC: ${error.message}`);
    }
  }, [nfcStatus.isSupported, nfcStatus.isEnabled, onBadgeScanned, onError]);

  const stopNFCScan = useCallback(() => {
    setNfcStatus(prev => ({
      ...prev,
      isScanning: false
    }));
  }, []);

  const generateTestBadge = useCallback(() => {
    // Générer un badge de test pour le développement
    const testBadge: NFCBadge = {
      id: `test-badge-${Date.now()}`,
      employeeId: user?.id || 'test-user',
      badgeType: BadgeType.NFC,
      encryptedData: btoa(JSON.stringify({
        employeeId: user?.id,
        timestamp: Date.now(),
        permissions: ['clock_in', 'clock_out']
      })),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      permissions: ['clock_in', 'clock_out']
    };

    setScannedBadges(prev => [testBadge, ...prev.slice(0, 9)]);
    onBadgeScanned(testBadge);
  }, [user?.id, onBadgeScanned]);

  const getStatusColor = () => {
    if (!nfcStatus.isSupported) return 'text-red-500';
    if (!nfcStatus.isEnabled) return 'text-yellow-500';
    if (nfcStatus.isScanning) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!nfcStatus.isSupported) return XCircle;
    if (!nfcStatus.isEnabled) return AlertTriangle;
    if (nfcStatus.isScanning) return Smartphone;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Gestionnaire NFC
          </h2>
          <p className="text-gray-600">Scan de badges NFC pour le pointage</p>
        </div>
        
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <StatusIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {!nfcStatus.isSupported ? 'Non supporté' :
             !nfcStatus.isEnabled ? 'Désactivé' :
             nfcStatus.isScanning ? 'Scan en cours' : 'Prêt'}
          </span>
        </div>
      </div>

      {/* Informations de l'appareil */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Battery className="w-6 h-6 text-gray-600 mx-auto mb-1" />
          <div className="text-sm font-medium">{deviceInfo.batteryLevel}%</div>
          <div className="text-xs text-gray-500">Batterie</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          {deviceInfo.isOnline ? (
            <Wifi className="w-6 h-6 text-green-600 mx-auto mb-1" />
          ) : (
            <WifiOff className="w-6 h-6 text-red-600 mx-auto mb-1" />
          )}
          <div className="text-sm font-medium">
            {deviceInfo.isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          <div className="text-xs text-gray-500">Connexion</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          {deviceInfo.location ? (
            <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          ) : (
            <XCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          )}
          <div className="text-sm font-medium">
            {deviceInfo.location ? 'OK' : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">GPS</div>
        </div>
      </div>

      {/* Contrôles NFC */}
      <div className="space-y-4 mb-6">
        {!nfcStatus.isSupported ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">NFC non supporté</p>
                <p className="text-xs text-red-700">
                  Votre appareil ne supporte pas la technologie NFC
                </p>
              </div>
            </div>
          </div>
        ) : !nfcStatus.isEnabled ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">NFC désactivé</p>
                <p className="text-xs text-yellow-700">
                  Activez NFC dans les paramètres de votre appareil
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={startNFCScan}
              disabled={nfcStatus.isScanning}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {nfcStatus.isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scan en cours...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Démarrer le scan
                </>
              )}
            </button>
            
            {nfcStatus.isScanning && (
              <button
                onClick={stopNFCScan}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Arrêter
              </button>
            )}
          </div>
        )}

        {/* Badge de test pour le développement */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={generateTestBadge}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Générer badge de test
          </button>
        )}
      </div>

      {/* Historique des scans */}
      {scannedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Badges scannés récemment</h3>
          <div className="space-y-2">
            {scannedBadges.slice(0, 5).map((badge, index) => (
              <div key={badge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Badge {badge.employeeId}
                    </p>
                    <p className="text-xs text-gray-600">
                      Expire: {badge.expiresAt.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    badge.expiresAt > new Date() ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {badge.permissions.length} permission(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernière erreur */}
      {nfcStatus.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{nfcStatus.error}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Instructions d'utilisation</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Assurez-vous que NFC est activé sur votre appareil</li>
          <li>• Approchez le badge NFC du capteur de votre téléphone</li>
          <li>• Le badge doit être valide et non expiré</li>
          <li>• Les permissions de pointage sont vérifiées automatiquement</li>
        </ul>
      </div>
    </div>
  );
}