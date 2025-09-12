"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, Download, Clock } from 'lucide-react';

// Helper type for TS when using facingMode exact/ideal
type ConstrainDOMString = string | { exact?: string; ideal?: string };
type ConstrainFacingMode = string | { exact?: string; ideal?: string };

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, timestamp: Date) => void;
  onCancel: () => void;
  employeeName: string;
}

export default function PhotoCapture({ onPhotoTaken, onCancel, employeeName }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{name: string, isMobile: boolean, isIOS: boolean, isAndroid: boolean}>({
    name: 'Unknown',
    isMobile: false,
    isIOS: false,
    isAndroid: false
  });
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Détecter le navigateur et le système d'exploitation
  const detectBrowser = useCallback(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    let browserName = 'Unknown';
    if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Edge')) browserName = 'Edge';
    
    return { name: browserName, isMobile, isIOS, isAndroid };
  }, []);

  // Obtenir l'URL des paramètres de caméra appropriée
  const getCameraSettingsURL = useCallback(() => {
    const { isMobile, isIOS, isAndroid, name } = browserInfo;
    
    if (isIOS) {
      return 'App-prefs:Privacy&path=CAMERA';
    } else if (isAndroid) {
      if (name === 'Chrome') {
        return 'chrome://settings/content/camera';
      } else {
        return 'android.settings.APPLICATION_DETAILS_SETTINGS';
      }
    } else {
      // Desktop
      if (name === 'Chrome') {
        return 'chrome://settings/content/camera';
      } else if (name === 'Safari') {
        return 'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera';
      } else if (name === 'Firefox') {
        return 'about:preferences#privacy';
      } else {
        return 'chrome://settings/content/camera';
      }
    }
  }, [browserInfo]);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsCapturing(true);
      // iOS/Safari exige un contexte sécurisé (HTTPS ou localhost)
      if (!window.isSecureContext) {
        setIsCapturing(false);
        setError("Contexte non sécurisé (HTTP). Utilisez une URL en HTTPS (ex: via ngrok, Cloudflare Tunnel) ou 'localhost'. Les IP locales (192.168.x.x) sont refusées par iOS.");
        return;
      }

      // Vérifier la disponibilité de l'API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de caméra non supportée');
      }

      // Contraintes avec préférence pour la caméra frontale (selfie)
      const preferredConstraints: MediaStreamConstraints = {
        video: {
          // L'ordre des préférences aide différents navigateurs
          facingMode: { exact: 'user' } as ConstrainFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const fallbackUserOptional: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'user' } as ConstrainFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const fallbackEnvironment: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' } as ConstrainFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      let stream: MediaStream | null = null;
      try {
        // iOS/Safari peut échouer sur exact → on essaie, puis on tombe en repli
        stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      } catch (_) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(fallbackUserOptional);
        } catch (_) {
          stream = await navigator.mediaDevices.getUserMedia(fallbackEnvironment);
        }
      }

      streamRef.current = stream!;
      if (videoRef.current) {
        // iOS: empêcher le passage en plein écran
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true; // facilite l'autoplay sur certains UA
        videoRef.current.srcObject = stream!;
        await videoRef.current.play();
      }

      // Si on a pu démarrer, plus besoin d'exiger un geste utilisateur
      setNeedsUserGesture(false);
    } catch (err: any) {
      console.error("Erreur d'accès à la caméra:", err);

      let errorMessage = "Impossible d'accéder à la caméra.";
      const name = err?.name;
      const msg = err?.message;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        errorMessage = "Permission caméra refusée. Autorisez l'accès dans votre navigateur.";
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        errorMessage = "Aucune caméra compatible trouvée sur cet appareil.";
      } else if (name === 'NotSupportedError') {
        errorMessage = "Votre navigateur ne supporte pas l'accès à la caméra.";
      } else if (name === 'NotReadableError') {
        errorMessage = "La caméra est utilisée par une autre application.";
      }
      // Ajout infos debug
      if (name || msg) {
        errorMessage += ` (\n${name ?? 'Erreur inconnue'}: ${msg ?? ''})`;
      }

      setError(errorMessage);
      setIsCapturing(false);
    }
  }, []);

  const requestCameraAccess = useCallback(async () => {
    // Certains navigateurs (iOS Safari) exigent un geste utilisateur avant getUserMedia
    await startCamera();
  }, [startCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image de la vidéo sur le canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Ajouter l'horodatage et les informations
    const timestamp = new Date();
    const timeString = timestamp.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Style pour le texte
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${employeeName}`, 20, canvas.height - 50);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Pointage: ${timeString}`, 20, canvas.height - 20);

    // Ajouter un filigrane de sécurité
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('POINTAGE SÉCURISÉ', canvas.width - 20, canvas.height - 20);

    // Convertir en base64
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoData);
    stopCamera();
  }, [employeeName, stopCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto) {
      setError('Veuillez d\'abord prendre une photo');
      return;
    }
    
    setIsProcessing(true);
    const timestamp = new Date();
    
    // Simuler un délai de traitement
    setTimeout(() => {
      onPhotoTaken(capturedPhoto, timestamp);
      setIsProcessing(false);
    }, 1000);
  }, [capturedPhoto, onPhotoTaken]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const downloadPhoto = useCallback(() => {
    if (!capturedPhoto) return;
    
    const link = document.createElement('a');
    link.download = `pointage_${employeeName}_${new Date().toISOString().split('T')[0]}.jpg`;
    link.href = capturedPhoto;
    link.click();
  }, [capturedPhoto, employeeName]);

  React.useEffect(() => {
    const info = detectBrowser();
    setBrowserInfo(info);

    // Vérifier le contexte sécurisé d'abord
    if (!window.isSecureContext && info.isIOS) {
      setError("Contexte non sécurisé (HTTP). Utilisez une URL en HTTPS (ex: via ngrok, Cloudflare Tunnel) ou 'localhost'. Les IP locales (192.168.x.x) sont refusées par iOS.");
      return;
    }

    // Démarrer automatiquement sur Desktop uniquement
    if (!info.isMobile) {
      startCamera();
    } else {
      // Sur mobile (iOS/Android), on attend un geste utilisateur pour afficher l'invite de permission
      setNeedsUserGesture(true);
    }

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, detectBrowser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Prise de photo de pointage</h1>
          <p className="text-gray-600">Positionnez-vous devant la caméra pour confirmer votre identité</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <X className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-2">Erreur d'accès à la caméra</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <div className="text-xs text-red-600 space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <p className="font-semibold text-yellow-800 mb-2">🔧 Solution automatique :</p>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{browserInfo.name}</strong> sur {browserInfo.isMobile ? 'Mobile' : 'Desktop'}
                        {browserInfo.isIOS && ' (iOS)'}
                        {browserInfo.isAndroid && ' (Android)'}
                      </span>
                      <button
                        onClick={() => {
                          const url = getCameraSettingsURL();
                          try {
                            window.open(url, '_blank');
                          } catch (e) {
                            // Fallback si l'URL ne fonctionne pas
                            alert(`Ouvrez manuellement : ${url}`);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-semibold"
                      >
                        Ouvrir les paramètres
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold">📋 Instructions manuelles :</p>
                    {browserInfo.isIOS && (
                      <p>• <strong>iOS :</strong> Réglages → Safari → Caméra → Autoriser</p>
                    )}
                    {browserInfo.isAndroid && (
                      <p>• <strong>Android :</strong> Paramètres → Site → Caméra → Autoriser</p>
                    )}
                    {browserInfo.isIOS && (
                      <p>• <strong>iOS (PWA/Safari) :</strong> Le site doit être en HTTPS et la demande d’accès doit suivre un geste (tap). Utilisez le bouton « Activer la caméra » ci-dessus.</p>
                    )}
                    <p>• <strong>Général :</strong> Le site doit être en <strong>HTTPS</strong> ou en <strong>localhost</strong>. Les IP locales en HTTP (ex: 192.168.x.x) ne fonctionnent pas sur iOS.</p>
                  </div>
                  
                  <p className="text-yellow-600">⚠️ <strong>Important :</strong> HTTPS requis pour la caméra</p>
                </div>
                <button
                  onClick={startCamera}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Réessayer l'accès à la caméra
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          {!capturedPhoto ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              />
              {needsUserGesture && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <button
                    onClick={requestCameraAccess}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-semibold"
                  >
                    Activer la caméra (autoriser l’accès)
                  </button>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                  {isCapturing ? 'Positionnez-vous dans le cadre' : (needsUserGesture ? 'Appuyez sur "Activer la caméra" pour autoriser l’accès' : 'Démarrage de la caméra...')}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Photo de pointage"
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm flex items-center">
                <Check className="w-3 h-3 mr-1" />
                Capturé
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {!capturedPhoto ? (
            <>
              <button
                onClick={capturePhoto}
                disabled={!isCapturing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                Prendre la photo
              </button>
              
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={confirmPhoto}
                disabled={isProcessing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmer
                  </>
                )}
              </button>
              
              <button
                onClick={retakePhoto}
                disabled={isProcessing}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reprendre
              </button>
              
              <button
                onClick={downloadPhoto}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </button>
            </>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <Clock className="w-4 h-4 mr-2" />
            <span><strong>Horodatage automatique :</strong> La photo inclut automatiquement la date, l'heure et votre nom</span>
          </div>
        </div>

        {/* Canvas caché pour le traitement d'image */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
