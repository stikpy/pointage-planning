"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, Clock, RefreshCw, Download, Copy, CheckCircle } from 'lucide-react';
import { generateQRCode, encodeQRData } from '../../../lib/qr-generator';

export default function QRGeneratorPage() {
  const [qrData, setQrData] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

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

  const generateNewQR = () => {
    const newQRData = generateQRCode('general', 'clock');
    setQrData(newQRData);
    
    // Générer l'URL du QR code
    const encodedData = encodeQRData(newQRData);
    const qrUrl = `${window.location.origin}/clock/general?data=${encodedData}`;
    
    // Créer l'image QR code (utiliser un service externe ou bibliothèque)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
    setQrImageUrl(qrImageUrl);
    
    setTimeLeft(300); // 5 minutes
  };

  const copyQRUrl = async () => {
    if (qrData) {
      const encodedData = encodeQRData(qrData);
      const qrUrl = `${window.location.origin}/clock/general?data=${encodedData}`;
      
      try {
        await navigator.clipboard.writeText(qrUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erreur copie:', err);
      }
    }
  };

  const downloadQR = () => {
    if (qrImageUrl) {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `qr-code-${Date.now()}.png`;
      link.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                <QrCode className="h-8 w-8 text-blue-500" />
                <span>Générateur QR Code</span>
              </h1>
              <p className="text-gray-600 mt-2">Génération automatique de QR codes pour le pointage des équipes</p>
            </div>
            <button
              onClick={generateNewQR}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Nouveau QR</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">QR Code Actuel</h2>
              
              {/* Timer */}
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="font-bold">Expire dans: {formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code Image */}
              {qrImageUrl && (
                <div className="mb-6">
                  <img 
                    src={qrImageUrl} 
                    alt="QR Code" 
                    className="mx-auto border-4 border-gray-200 rounded-lg"
                    style={{ width: '300px', height: '300px' }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={copyQRUrl}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  <span>{copied ? 'Copié !' : 'Copier URL'}</span>
                </button>

                <button
                  onClick={downloadQR}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Télécharger QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Instructions d'Affichage</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📍 Où afficher :</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• En cuisine (tableau d'affichage)</li>
                  <li>• À l'accueil (écran ou impression)</li>
                  <li>• Dans les zones de pause</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">⏰ Renouvellement :</h3>
                <ul className="text-green-700 space-y-1 text-sm">
                  <li>• QR code valide 5 minutes</li>
                  <li>• Renouvellement automatique</li>
                  <li>• Notification avant expiration</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">📱 Utilisation :</h3>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• Scanner avec l'appareil photo</li>
                  <li>• Suivre les instructions à l'écran</li>
                  <li>• Prendre une photo de pointage</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Important :</h3>
                <ul className="text-red-700 space-y-1 text-sm">
                  <li>• QR code unique par session</li>
                  <li>• Ne pas partager l'URL</li>
                  <li>• Renouveler régulièrement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Details */}
        {qrData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Détails du QR Code</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-600">ID Employé:</span>
                <p className="text-gray-800">{qrData.employeeId}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Action:</span>
                <p className="text-gray-800">{qrData.action}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Type Shift:</span>
                <p className="text-gray-800">{qrData.shiftType || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Expire:</span>
                <p className="text-gray-800">{new Date(qrData.expiresAt).toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
