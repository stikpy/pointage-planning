"use client";

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { Employee } from '../types';

interface EmployeePINManagerProps {
  employees: Employee[];
  onUpdateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
}

export default function EmployeePINManager({ employees, onUpdateEmployee }: EmployeePINManagerProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newPinCode, setNewPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [showPinCode, setShowPinCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSavePinCode = () => {
    if (!selectedEmployee) return;

    // Validation
    if (!newPinCode.trim()) {
      setError('Veuillez saisir un code PIN');
      return;
    }

    if (newPinCode.length < 4) {
      setError('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }

    if (newPinCode !== confirmPinCode) {
      setError('Les codes PIN ne correspondent pas');
      return;
    }

    // Vérifier que le code PIN n'est pas déjà utilisé
    const isPinAlreadyUsed = employees.some(emp => 
      emp.id !== selectedEmployee.id && emp.pinCode === newPinCode
    );

    if (isPinAlreadyUsed) {
      setError('Ce code PIN est déjà utilisé par un autre employé');
      return;
    }

    // Sauvegarder
    onUpdateEmployee(selectedEmployee.id, { pinCode: newPinCode });
    
    setSuccess('Code PIN mis à jour avec succès');
    setNewPinCode('');
    setConfirmPinCode('');
    setError('');

    // Effacer le message de succès après 3 secondes
    setTimeout(() => setSuccess(''), 3000);
  };

  const generateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPinCode(randomPin);
    setConfirmPinCode(randomPin);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Gestion des codes PIN</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un employé
        </label>
        <select
          value={selectedEmployee?.id || ''}
          onChange={(e) => {
            const employee = employees.find(emp => emp.id === e.target.value);
            setSelectedEmployee(employee || null);
            setNewPinCode('');
            setConfirmPinCode('');
            setError('');
            setSuccess('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choisir un employé...</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name} - {employee.position}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Informations employé</h3>
            <p><strong>Nom :</strong> {selectedEmployee.name}</p>
            <p><strong>Poste :</strong> {selectedEmployee.position}</p>
            <p><strong>Code PIN actuel :</strong> {selectedEmployee.pinCode ? '••••' : 'Non défini'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau code PIN
              </label>
              <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPinCode}
                onChange={(e) => setNewPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4 chiffres minimum"
                maxLength={10}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                autoComplete="off"
              />
                <button
                  type="button"
                  onClick={() => setShowPinCode(!showPinCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le code PIN
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPinCode}
                onChange={(e) => setConfirmPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Répéter le code PIN"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={generateRandomPin}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Générer aléatoire
            </button>
            
            <button
              onClick={handleSavePinCode}
              disabled={!newPinCode || !confirmPinCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Sécurité des codes PIN :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Chaque employé doit avoir un code PIN unique</li>
              <li>Les codes PIN sont utilisés pour vérifier l'identité lors du pointage</li>
              <li>Ne partagez jamais les codes PIN avec d'autres personnes</li>
              <li>Changez régulièrement les codes PIN pour maintenir la sécurité</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
