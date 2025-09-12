"use client";

import React, { useState } from 'react';
import { QrCode, Download, Users, Clock, Settings } from 'lucide-react';
import { Employee } from '../types';
import QRCodeGenerator from './QRCodeGenerator';

interface QRCodeManagerProps {
  employees: Employee[];
  onGenerateAll: () => void;
  onDownloadAll: () => void;
}

export default function QRCodeManager({ employees, onGenerateAll, onDownloadAll }: QRCodeManagerProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowGenerator(true);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    setSelectedEmployee(null);
  };

  const generateAllQRCodes = () => {
    // Générer tous les QR codes en une fois
    employees.forEach((employee, index) => {
      setTimeout(() => {
        const qrData = {
          type: 'employee_clock',
          employeeId: employee.id,
          employeeName: employee.name,
          timestamp: Date.now(),
          version: '1.0'
        };

        // Créer un lien de téléchargement automatique
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Ici, vous pourriez utiliser une bibliothèque QR pour générer l'image
          // Pour l'instant, on crée un fichier texte avec les données
          const blob = new Blob([JSON.stringify(qrData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qr-data-${employee.name.replace(/\s+/g, '-').toLowerCase()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, index * 1000); // Délai d'1 seconde entre chaque génération
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <QrCode className="w-6 h-6 mr-2" />
          Gestion des QR Codes
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={generateAllQRCodes}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Générer tous
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-500">ID: {employee.id}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                employee.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {employee.role === 'manager' ? 'Manager' : 'Employé'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                employee.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <button
              onClick={() => handleEmployeeSelect(employee)}
              disabled={!employee.isActive}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Générer QR Code
            </button>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun employé trouvé</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Instructions d'utilisation
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cliquez sur "Générer QR Code" pour créer un QR code individuel</li>
          <li>• Utilisez "Générer tous" pour créer tous les QR codes en une fois</li>
          <li>• Imprimez les QR codes et placez-les aux postes de travail</li>
          <li>• Les employés peuvent scanner ces QR codes pour pointer rapidement</li>
        </ul>
      </div>

      {showGenerator && selectedEmployee && (
        <QRCodeGenerator
          employee={selectedEmployee}
          onClose={handleCloseGenerator}
        />
      )}
    </div>
  );
}
