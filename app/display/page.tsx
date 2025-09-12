"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { generateQRCode, encodeQRData } from '../../lib/qr-generator';

export default function DisplayPage() {
  const [qrData, setQrData] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    generateNewQR();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateNewQR();
          return 300; // 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsExpiring(timeLeft <= 60); // Alerte quand il reste moins d'1 minute
  }, [timeLeft]);

  const generateNewQR = () => {
    const newQRData = generateQRCode('general', 'clock');
    setQrData(newQRData);
    
    // Générer l'URL du QR code
    const encodedData = encodeQRData(newQRData);
    const qrUrl = `${window.location.origin}/clock/general?data=${encodedData}`;
    
    // Créer l'image QR code
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}`;
    setQrImageUrl(qrImageUrl);
    
    setTimeLeft(300); // 5 minutes
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center space-x-3">
            <QrCode className="h-10 w-10 text-blue-500" />
            <span>Pointage Équipe</span>
          </h1>
          <p className="text-xl text-gray-600">Scannez le QR code pour pointer</p>
        </div>

        {/* Timer */}
        <div className="mb-8">
          <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full text-lg font-bold ${
            isExpiring 
              ? 'bg-red-100 text-red-800 animate-pulse' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            <Clock className="h-6 w-6" />
            <span>QR Code valide: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* QR Code */}
        {qrImageUrl && (
          <div className="mb-8">
            <img 
              src={qrImageUrl} 
              alt="QR Code Pointage" 
              className="mx-auto border-8 border-gray-200 rounded-2xl shadow-lg"
              style={{ width: '400px', height: '400px' }}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📱 Comment pointer :</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">Scanner</h3>
                <p className="text-gray-600 text-sm">Ouvrez l'appareil photo et scannez le QR code</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-gray-800">Saisir PIN</h3>
                <p className="text-gray-600 text-sm">Entrez votre code PIN personnel</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">Photo</h3>
                <p className="text-gray-600 text-sm">Prenez une photo pour valider</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span>Système actif - Renouvellement automatique</span>
        </div>

        {/* Auto-refresh indicator */}
        {isExpiring && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>QR Code expire bientôt - Renouvellement en cours...</span>
          </div>
        )}
      </div>
    </div>
  );
}
