"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Camera, 
  MapPin, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Battery,
  Wifi,
  WifiOff,
  ArrowLeft,
  User,
  Calendar,
  Timer
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import NFCManager from '../../../components/NFCManager';
import PhotoCapture from '../../../components/PhotoCapture';
import Link from 'next/link';

interface ClockSession {
  id: string;
  employeeId: string;
  startTime?: Date;
  endTime?: Date;
  status: 'idle' | 'working' | 'break' | 'completed';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  photoUrl?: string;
  method: 'qr_code' | 'nfc' | 'manual' | 'biometric';
}

export default function MobileClockPage() {
  const { user } = useAuth();
  const [clockSession, setClockSession] = useState<ClockSession>({
    id: '',
    employeeId: user?.id || '',
    status: 'idle',
    method: 'manual'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showNFCManager, setShowNFCManager] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    batteryLevel: 100,
    isOnline: true,
    location: null as { lat: number; lng: number } | null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setupDeviceInfo();
    loadCurrentSession();
  }, []);

  const setupDeviceInfo = () => {
    // Batterie
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100)
        }));
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
  };

  const loadCurrentSession = async () => {
    try {
      // Simuler le chargement de la session actuelle
      // En production, appeler l'API
      const mockSession: ClockSession = {
        id: 'session-1',
        employeeId: user?.id || '',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        status: 'working',
        method: 'manual',
        location: deviceInfo.location || undefined
      };
      setClockSession(mockSession);
    } catch (error) {
      console.error('Erreur chargement session:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      setError('');
      
      // Vérifier la géolocalisation
      if (!deviceInfo.location) {
        setError('Géolocalisation requise pour le pointage');
        return;
      }

      // Vérifier la connexion
      if (!deviceInfo.isOnline) {
        setError('Connexion internet requise');
        return;
      }

      // Vérifier le niveau de batterie
      if (deviceInfo.batteryLevel < 10) {
        setError('Niveau de batterie trop faible');
        return;
      }

      // Démarrer la session
      const newSession: ClockSession = {
        id: `session-${Date.now()}`,
        employeeId: user?.id || '',
        startTime: new Date(),
        status: 'working',
        method: clockSession.method,
        location: deviceInfo.location
      };

      setClockSession(newSession);
      setSuccess('Pointage d\'entrée enregistré');
      
      // Rediriger vers la prise de photo
      setTimeout(() => {
        setShowPhotoCapture(true);
      }, 1000);

    } catch (error) {
      setError('Erreur lors du pointage d\'entrée');
    }
  };

  const handleClockOut = async () => {
    try {
      setError('');
      
      // Vérifier la géolocalisation
      if (!deviceInfo.location) {
        setError('Géolocalisation requise pour le pointage');
        return;
      }

      // Mettre à jour la session
      const updatedSession: ClockSession = {
        ...clockSession,
        endTime: new Date(),
        status: 'completed'
      };

      setClockSession(updatedSession);
      setSuccess('Pointage de sortie enregistré');
      
      // Rediriger vers la prise de photo
      setTimeout(() => {
        setShowPhotoCapture(true);
      }, 1000);

    } catch (error) {
      setError('Erreur lors du pointage de sortie');
    }
  };

  const handleBreakStart = async () => {
    try {
      setClockSession(prev => ({
        ...prev,
        status: 'break'
      }));
      setSuccess('Pause démarrée');
    } catch (error) {
      setError('Erreur lors du démarrage de la pause');
    }
  };

  const handleBreakEnd = async () => {
    try {
      setClockSession(prev => ({
        ...prev,
        status: 'working'
      }));
      setSuccess('Pause terminée');
    } catch (error) {
      setError('Erreur lors de la fin de la pause');
    }
  };

  const handleNFCScan = (badge: any) => {
    setClockSession(prev => ({
      ...prev,
      method: 'nfc'
    }));
    setSuccess('Badge NFC scanné avec succès');
    setShowNFCManager(false);
  };

  const handlePhotoTaken = (photoData: string, timestamp: Date) => {
    setClockSession(prev => ({
      ...prev,
      photoUrl: photoData
    }));
    setShowPhotoCapture(false);
    setSuccess('Photo de pointage enregistrée');
  };

  const getSessionDuration = () => {
    if (!clockSession.startTime) return '00:00:00';
    
    const now = clockSession.endTime || new Date();
    const duration = now.getTime() - clockSession.startTime.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working': return 'En travail';
      case 'break': return 'En pause';
      case 'completed': return 'Terminé';
      default: return 'Inactif';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/mobile" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pointage Mobile</h1>
                <p className="text-sm text-gray-600">{user?.profile.firstName} {user?.profile.lastName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(clockSession.status)}`}></div>
              <span className="text-sm font-medium text-gray-600">
                {getStatusText(clockSession.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Statut de la session */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session de pointage</h2>
            <p className="text-gray-600">Durée: {getSessionDuration()}</p>
          </div>

          {clockSession.startTime && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Début:</span>
                <span className="font-medium">
                  {clockSession.startTime.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              {clockSession.endTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fin:</span>
                  <span className="font-medium">
                    {clockSession.endTime.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Méthode:</span>
                <span className="font-medium capitalize">{clockSession.method}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions de pointage */}
        <div className="space-y-4">
          {clockSession.status === 'idle' ? (
            <button
              onClick={handleClockIn}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Clock className="w-5 h-5 mr-2" />
              Pointer l'entrée
            </button>
          ) : clockSession.status === 'working' ? (
            <div className="space-y-3">
              <button
                onClick={handleBreakStart}
                className="w-full py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center"
              >
                <Timer className="w-5 h-5 mr-2" />
                Démarrer la pause
              </button>
              
              <button
                onClick={handleClockOut}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Clock className="w-5 h-5 mr-2" />
                Pointer la sortie
              </button>
            </div>
          ) : clockSession.status === 'break' ? (
            <button
              onClick={handleBreakEnd}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Clock className="w-5 h-5 mr-2" />
              Terminer la pause
            </button>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session terminée</h3>
              <p className="text-gray-600">Votre pointage a été enregistré avec succès</p>
            </div>
          )}
        </div>

        {/* Méthodes alternatives */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de pointage</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowNFCManager(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Smartphone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium">Badge NFC</span>
            </button>
            
            <button
              onClick={() => setIsScanning(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium">QR Code</span>
            </button>
          </div>
        </div>

        {/* Informations de l'appareil */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">État de l'appareil</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Batterie:</span>
              <div className="flex items-center space-x-2">
                <Battery className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{deviceInfo.batteryLevel}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connexion:</span>
              <div className="flex items-center space-x-2">
                {deviceInfo.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">
                  {deviceInfo.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Localisation:</span>
              <div className="flex items-center space-x-2">
                {deviceInfo.location ? (
                  <MapPin className="w-4 h-4 text-blue-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium">
                  {deviceInfo.location ? 'OK' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          </div>
        )}
      </div>

      {/* Composants modaux */}
      {showNFCManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gestionnaire NFC</h3>
                <button
                  onClick={() => setShowNFCManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <NFCManager
                onBadgeScanned={handleNFCScan}
                onError={setError}
              />
            </div>
          </div>
        </div>
      )}

      {showPhotoCapture && (
        <PhotoCapture
          onPhotoTaken={handlePhotoTaken}
          onCancel={() => setShowPhotoCapture(false)}
          employeeName={`${user?.profile.firstName} ${user?.profile.lastName}`}
        />
      )}
    </div>
  );
}