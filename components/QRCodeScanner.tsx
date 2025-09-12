"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { Employee, Shift } from '../types';
import { validateClockSession } from '../utils/secureQR';

interface QRCodeScannerProps {
  employees: Employee[];
  onClockIn: (employeeId: string) => void;
  onClockOut: (employeeId: string) => void;
  onClose: () => void;
  currentShifts: Shift[];
}

export default function QRCodeScanner({ 
  employees, 
  onClockIn, 
  onClockOut, 
  onClose, 
  currentShifts 
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setSuccess('');
      setIsScanning(true);
      
      // Démarrer la détection de QR codes directement
      await detectQRCode();
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      console.error('Erreur caméra:', err);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && (videoRef.current as any).qrScanner) {
      (videoRef.current as any).qrScanner.stop();
      (videoRef.current as any).qrScanner.destroy();
      (videoRef.current as any).qrScanner = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const detectQRCode = async () => {
    if (!videoRef.current) return;

    try {
      // Import dynamique de QrScanner pour éviter les problèmes SSR
      const QrScanner = (await import('qr-scanner')).default;
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          try {
            processQRData(result.data);
            qrScanner.stop();
          } catch (error) {
            setError('QR code invalide - format non reconnu');
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScanner.start();
      
      // Stocker la référence pour pouvoir l'arrêter
      (videoRef.current as any).qrScanner = qrScanner;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du scanner QR:', error);
      setError('Impossible d\'initialiser le scanner QR');
    }
  };

  const handleManualInput = () => {
    const qrData = prompt('Collez les données du QR code (format: http://192.168.1.107:3000/clock/ID):');
    if (qrData) {
      processQRData(qrData);
    }
  };

  const processQRData = (data: string) => {
    // Vérifier le format URL sécurisée
    if (!data.startsWith('http://192.168.1.107:3000/clock/')) {
      setError('QR code invalide - format non reconnu');
      return;
    }

    // Extraire l'ID employé de l'URL
    const urlParts = data.split('/');
    const employeeId = urlParts[urlParts.length - 1].split('?')[0];
    
    if (!employeeId) {
      setError('QR code invalide - ID employé manquant');
      return;
    }

    // Vérifier la session de pointage
    const sessionValidation = validateClockSession(employeeId);
    if (!sessionValidation.isValid) {
      setError(`Session invalide: ${sessionValidation.error}`);
      return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      setError('Employé non trouvé');
      return;
    }

    setScannedData({ 
      type: 'employee_clock',
      employeeId,
      employeeName: employee.name,
      employee 
    });

    // Vérifier si l'employé est déjà en cours de travail
    const currentShift = currentShifts.find(shift => 
      shift.employeeId === employee.id && !shift.end
    );

    if (currentShift) {
      // L'employé est déjà en cours de travail, proposer de pointer la sortie
      onClockOut(employee.id);
      setSuccess(`${employee.name} a pointé la sortie`);
    } else {
      // L'employé n'est pas en cours de travail, pointer l'entrée
      onClockIn(employee.id);
      setSuccess(`${employee.name} a pointé l'entrée`);
    }

    // Arrêter le scan après un pointage réussi
    setTimeout(() => {
      stopScanning();
      onClose();
    }, 2000);
  };

  const getEmployeeStatus = (employeeId: string) => {
    const currentShift = currentShifts.find(shift => 
      shift.employeeId === employeeId && !shift.end
    );
    return currentShift ? 'present' : 'absent';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scanner QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isScanning ? (
          <div className="text-center">
            <div className="w-64 h-64 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            
            <p className="text-gray-600 mb-4">
              Appuyez sur "Démarrer le scan" pour pointer avec la caméra
            </p>
            
            <div className="space-y-2">
              <button
                onClick={startScanning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Démarrer le scan
              </button>
              
              <button
                onClick={handleManualInput}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Saisie manuelle
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-4 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg"></div>
            </div>
            
            <p className="text-gray-600 mb-4">
              Pointez la caméra vers le QR code
            </p>
            
            <button
              onClick={stopScanning}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Arrêter le scan
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        )}

        {scannedData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Données scannées :</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Employé :</strong> {scannedData.employee?.name}</p>
              <p><strong>ID :</strong> {scannedData.employeeId}</p>
              <p><strong>Statut :</strong> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  getEmployeeStatus(scannedData.employeeId) === 'present' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getEmployeeStatus(scannedData.employeeId) === 'present' ? 'Présent' : 'Absent'}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-xs text-yellow-800">
            💡 <strong>Conseil :</strong> Assurez-vous que le QR code est bien éclairé et centré dans le cadre.
          </p>
        </div>

        <div className="mt-2 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center text-xs text-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            <span><strong>Sécurité :</strong> QR code valide 5 minutes - Scan requis pour pointage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
