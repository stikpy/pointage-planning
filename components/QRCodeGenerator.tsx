"use client";

import React, { useState, useEffect } from 'react';
import { Download, Copy, QrCode, User, Clock, Shield } from 'lucide-react';
import { Employee } from '../types';
import { createClockSession } from '../utils/secureQR';

interface QRCodeGeneratorProps {
  employee: Employee;
  onClose: () => void;
}

export default function QRCodeGenerator({ employee, onClose }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [employee]);

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      // Import dynamique de QRCode pour éviter les problèmes SSR
      const QRCode = (await import('qrcode')).default;
      
      // Créer les données du QR code sécurisées
      const qrData = createClockSession(employee.id);

      // Générer le QR code
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `qr-code-${employee.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const copyQRData = () => {
    const qrData = createClockSession(employee.id);
    
    navigator.clipboard.writeText(qrData);
    alert('Données du QR code copiées !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            QR Code de pointage
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <User className="w-4 h-4 mr-2 text-gray-600" />
            <span className="font-medium">{employee.name}</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            ID: {employee.id}
          </div>
        </div>

        <div className="flex justify-center mb-4">
          {isGenerating ? (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Génération du QR code...</p>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code de pointage" 
                className="max-w-full max-h-full"
              />
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Scannez ce QR code pour pointer rapidement
          </p>
          <div className="flex items-center justify-center text-xs text-blue-600">
            <Shield className="w-3 h-3 mr-1" />
            <span>QR code sécurisé - Valide 5 minutes</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={downloadQRCode}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </button>
          
          <button
            onClick={copyQRData}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copier
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>Conseil :</strong> Imprimez ce QR code et placez-le à un endroit visible 
            pour permettre aux employés de pointer facilement.
          </p>
        </div>
      </div>
    </div>
  );
}
