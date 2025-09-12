"use client";

import React, { useState } from 'react';
import { QrCode, Camera, Download, Copy, CheckCircle } from 'lucide-react';
import { Employee } from '../types';

interface QRCodeDemoProps {
  employees: Employee[];
  onClockIn: (employeeId: string) => void;
  onClockOut: (employeeId: string) => void;
}

export default function QRCodeDemo({ employees, onClockIn, onClockOut }: QRCodeDemoProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const generateQRCode = async (employee: Employee) => {
    try {
      setIsGenerating(true);
      
      // Import dynamique de QRCode
      const QRCode = (await import('qrcode')).default;
      
      const qrData = {
        type: 'employee_clock',
        employeeId: employee.id,
        employeeName: employee.name,
        timestamp: Date.now(),
        version: '1.0'
      };

      const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(dataUrl);
      setSelectedEmployee(employee);
    } catch (error) {
      console.error('Erreur génération QR:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScanQR = () => {
    const qrData = prompt('Collez les données du QR code (JSON):');
    if (qrData) {
      try {
        const data = JSON.parse(qrData);
        setScannedData(data);
        
        const employee = employees.find(emp => emp.id === data.employeeId);
        if (employee) {
          // Simuler le pointage
          const isPresent = Math.random() > 0.5; // Simulation
          if (isPresent) {
            onClockOut(employee.id);
            alert(`${employee.name} a pointé la sortie`);
          } else {
            onClockIn(employee.id);
            alert(`${employee.name} a pointé l'entrée`);
          }
        }
      } catch (error) {
        alert('Format de données invalide');
      }
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl && selectedEmployee) {
      const link = document.createElement('a');
      link.download = `qr-code-${selectedEmployee.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const copyQRData = () => {
    if (selectedEmployee) {
      const qrData = {
        type: 'employee_clock',
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      alert('Données du QR code copiées !');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <QrCode className="w-6 h-6 mr-2" />
        Démonstration QR Codes
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Génération QR Code */}
        <div>
          <h3 className="text-lg font-medium mb-4">Générer un QR Code</h3>
          
          <div className="space-y-3 mb-4">
            {employees.filter(emp => emp.isActive).map((employee) => (
              <button
                key={employee.id}
                onClick={() => generateQRCode(employee)}
                disabled={isGenerating}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-gray-500">ID: {employee.id}</p>
                  </div>
                  <QrCode className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>

          {qrCodeDataUrl && selectedEmployee && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">QR Code généré pour {selectedEmployee.name}</h4>
              <div className="text-center mb-4">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="mx-auto max-w-full h-auto"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </button>
                <button
                  onClick={copyQRData}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scanner QR Code */}
        <div>
          <h3 className="text-lg font-medium mb-4">Scanner un QR Code</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleScanQR}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center"
            >
              <Camera className="w-6 h-6 mr-2" />
              Scanner QR Code (Saisie manuelle)
            </button>

            {scannedData && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  QR Code scanné avec succès
                </h4>
                <div className="text-sm text-green-800">
                  <p><strong>Employé:</strong> {scannedData.employeeName}</p>
                  <p><strong>ID:</strong> {scannedData.employeeId}</p>
                  <p><strong>Type:</strong> {scannedData.type}</p>
                  <p><strong>Timestamp:</strong> {new Date(scannedData.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>1. Générez un QR code pour un employé</li>
                <li>2. Copiez les données JSON</li>
                <li>3. Cliquez sur "Scanner QR Code"</li>
                <li>4. Collez les données dans la boîte de dialogue</li>
                <li>5. Le pointage sera effectué automatiquement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
