"use client";

import React, { useState } from 'react';
import { Bug, CheckCircle, XCircle } from 'lucide-react';

interface PINDebugProps {
  employees: any[];
}

export default function PINDebug({ employees }: PINDebugProps) {
  const [testPin, setTestPin] = useState('');
  const [testEmployee, setTestEmployee] = useState('');
  const [result, setResult] = useState('');

  const testPIN = () => {
    const employee = employees.find(emp => emp.id === testEmployee);
    
    if (!employee) {
      setResult('❌ Employé non trouvé');
      return;
    }

    console.log('Test PIN Debug:');
    console.log('- Employé sélectionné:', employee.name);
    console.log('- Code PIN attendu:', employee.pinCode);
    console.log('- Code PIN saisi:', testPin);
    console.log('- Comparaison:', testPin === employee.pinCode);
    console.log('- Type PIN attendu:', typeof employee.pinCode);
    console.log('- Type PIN saisi:', typeof testPin);

    if (testPin === employee.pinCode) {
      setResult('✅ Code PIN correct !');
    } else {
      setResult(`❌ Code PIN incorrect. Attendu: "${employee.pinCode}", Saisi: "${testPin}"`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bug className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-bold text-gray-900">Debug des codes PIN</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un employé
          </label>
          <select
            value={testEmployee}
            onChange={(e) => setTestEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choisir un employé...</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - PIN: {employee.pinCode || 'Non défini'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code PIN à tester
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={testPin}
            onChange={(e) => setTestPin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Saisissez le code PIN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
            autoComplete="off"
          />
        </div>

        <button
          onClick={testPIN}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tester le code PIN
        </button>

        {result && (
          <div className={`p-3 rounded-md flex items-center ${
            result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {result.includes('✅') ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            <span>{result}</span>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-semibold text-gray-900 mb-2">Informations des employés :</h3>
          <div className="space-y-2 text-sm">
            {employees.map(employee => (
              <div key={employee.id} className="flex justify-between">
                <span>{employee.name}</span>
                <span className="font-mono">{employee.pinCode || 'Non défini'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
