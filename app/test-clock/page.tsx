"use client";

import React, { useState } from 'react';
import IdentityVerification from '../../components/IdentityVerification';

export default function TestClockPage() {
  const [showVerification, setShowVerification] = useState(false);
  
  const testEmployee = {
    id: 'emp_1',
    name: 'Marie Dubois',
    email: 'marie.dubois@restaurant.com',
    position: 'Chef de cuisine',
    role: 'employee',
    is_active: true,
    max_hours_per_day: 10,
    max_hours_per_week: 50,
    min_break_minutes: 30,
    pin_code: '1234',
    photo_url: null,
    work_schedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (showVerification) {
    return (
      <IdentityVerification
        employee={testEmployee}
        onVerified={(photoData, timestamp) => {
          console.log('Photo prise:', photoData, timestamp);
          alert('Pointage réussi !');
        }}
        onCancel={() => {
          setShowVerification(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test de Pointage</h1>
        <p className="text-gray-600 mb-6">Cliquez pour tester la vérification d'identité</p>
        
        <button
          onClick={() => setShowVerification(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tester la Vérification d'Identité
        </button>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>PIN de test : <strong>1234</strong></p>
          <p>Employé : Marie Dubois</p>
        </div>
      </div>
    </div>
  );
}
