"use client";

import React, { useState } from 'react';
import { Camera, Clock, Users, QrCode, Smartphone } from 'lucide-react';
import { Employee, Shift } from '../types';
import QRCodeScanner from './QRCodeScanner';

interface QuickClockInProps {
  employees: Employee[];
  currentShifts: Shift[];
  onClockIn: (employeeId: string) => void;
  onClockOut: (employeeId: string) => void;
}

export default function QuickClockIn({ 
  employees, 
  currentShifts, 
  onClockIn, 
  onClockOut 
}: QuickClockInProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleQuickClockIn = (employeeId: string) => {
    const currentShift = currentShifts.find(shift => 
      shift.employeeId === employeeId && !shift.end
    );

    if (currentShift) {
      onClockOut(employeeId);
    } else {
      onClockIn(employeeId);
    }
  };

  const getEmployeeStatus = (employeeId: string) => {
    const currentShift = currentShifts.find(shift => 
      shift.employeeId === employeeId && !shift.end
    );
    return currentShift ? 'present' : 'absent';
  };

  const presentEmployees = employees.filter(emp => 
    emp.isActive && getEmployeeStatus(emp.id) === 'present'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Clock className="w-6 h-6 mr-2" />
          Pointage Rapide
        </h2>
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Camera className="w-4 h-4 mr-2" />
          Scanner QR
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{presentEmployees.length}</p>
              <p className="text-sm text-blue-700">Présents</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-green-900">{employees.filter(emp => emp.isActive).length}</p>
              <p className="text-sm text-green-700">Total actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des employés pour pointage rapide */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 mb-3">Pointage manuel</h3>
        {employees.filter(emp => emp.isActive).map((employee) => {
          const isPresent = getEmployeeStatus(employee.id) === 'present';
          
          return (
            <div
              key={employee.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  isPresent ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">ID: {employee.id}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleQuickClockIn(employee.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isPresent
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPresent ? 'Pointer sortie' : 'Pointer entrée'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Instructions pour mobile */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
          <Smartphone className="w-4 h-4 mr-2" />
          Mode mobile
        </h3>
        <p className="text-sm text-yellow-800">
          Sur mobile, utilisez le scanner QR pour pointer rapidement. 
          Les QR codes sont optimisés pour les appareils mobiles.
        </p>
      </div>

      {/* Instructions QR Code */}
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          <QrCode className="w-4 h-4 mr-2" />
          Comment utiliser les QR codes
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Générez des QR codes pour chaque employé</li>
          <li>• Imprimez et placez-les aux postes de travail</li>
          <li>• Scannez avec la caméra pour pointer automatiquement</li>
          <li>• Fonctionne même hors ligne</li>
        </ul>
      </div>

      {showScanner && (
        <QRCodeScanner
          employees={employees}
          currentShifts={currentShifts}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
