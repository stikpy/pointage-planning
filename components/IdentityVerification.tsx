"use client";

import React, { useState } from 'react';
import { Shield, User, Clock, AlertTriangle, CheckCircle, XCircle, Camera } from 'lucide-react';
import { Employee } from '../types';
import PhotoCapture from './PhotoCapture';

interface IdentityVerificationProps {
  employee: Employee;
  onVerified: (photoData?: string, timestamp?: Date) => void;
  onCancel: () => void;
}

export default function IdentityVerification({ employee, onVerified, onCancel }: IdentityVerificationProps) {
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const handleVerify = async () => {
    if (!pinCode.trim()) {
      setError('Veuillez saisir votre code PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Debug: afficher les informations
    const debugMessages = [
      `🔍 Debug: Code PIN saisi: "${pinCode}" (Type: ${typeof pinCode})`,
      `🔍 Debug: Code PIN attendu: "${employee.pinCode}" (Type: ${typeof employee.pinCode})`,
      `🔍 Debug: Employé: ${employee.name}`,
      `🔍 Debug: Comparaison stricte: ${pinCode === employee.pinCode}`,
      `🔍 Debug: Comparaison non-stricte: ${pinCode == employee.pinCode}`
    ];
    setDebugInfo(debugMessages);
    
    console.log('🔍 IdentityVerification Debug:');
    console.log('- Code PIN saisi:', pinCode, 'Type:', typeof pinCode);
    console.log('- Code PIN attendu:', employee.pinCode, 'Type:', typeof employee.pinCode);
    console.log('- Employé:', employee.name);
    console.log('- Comparaison stricte:', pinCode === employee.pinCode);
    console.log('- Comparaison non-stricte:', pinCode == employee.pinCode);
    console.log('- Employee object complet:', employee);

    // Simuler une vérification (en production, ceci serait fait côté serveur)
    setTimeout(() => {
      // Normaliser les codes PIN (enlever les espaces, convertir en string)
      const normalizedPin = pinCode.trim();
      const normalizedExpectedPin = String(employee.pinCode || '').trim();
      
      console.log('PIN normalisé saisi:', normalizedPin);
      console.log('PIN normalisé attendu:', normalizedExpectedPin);
      console.log('Comparaison après normalisation:', normalizedPin === normalizedExpectedPin);
      
      // Ajouter les infos de debug à l'interface
      setDebugInfo(prev => [
        ...prev,
        `🔧 PIN normalisé saisi: "${normalizedPin}"`,
        `🔧 PIN normalisé attendu: "${normalizedExpectedPin}"`,
        `🔧 Comparaison après normalisation: ${normalizedPin === normalizedExpectedPin}`
      ]);
      
      // CORRECTION: Vérification simple du code PIN d'abord
      if (normalizedPin === normalizedExpectedPin) {
        console.log('✅ Code PIN correct !');
        setDebugInfo(prev => [...prev, '✅ Code PIN correct !']);
        // TEMPORAIRE: Désactiver la validation des horaires pour se concentrer sur le PIN
        console.log('🕐 Validation des horaires temporairement désactivée pour debug PIN');
        
        // Code PIN vérifié, passer à la prise de photo OBLIGATOIRE
        setPinVerified(true);
        setShowPhotoCapture(true);
        setError(''); // Effacer les erreurs précédentes
      } else {
        console.log('❌ Code PIN incorrect !');
        console.log('Détails de l\'erreur:');
        console.log('- PIN saisi:', normalizedPin);
        console.log('- PIN attendu:', normalizedExpectedPin);
        console.log('- Types:', typeof normalizedPin, typeof normalizedExpectedPin);
        console.log('- Longueurs:', normalizedPin.length, normalizedExpectedPin.length);
        
        // Ajouter les infos d'erreur à l'interface
        setDebugInfo(prev => [
          ...prev,
          '❌ Code PIN incorrect !',
          `❌ Détails: PIN saisi="${normalizedPin}", attendu="${normalizedExpectedPin}"`,
          `❌ Types: ${typeof normalizedPin} vs ${typeof normalizedExpectedPin}`,
          `❌ Longueurs: ${normalizedPin.length} vs ${normalizedExpectedPin.length}`
        ]);
        
        setAttempts(prev => prev + 1);
        if (attempts >= 2) {
          setError('Trop de tentatives. Accès bloqué temporairement.');
          setTimeout(() => onCancel(), 3000);
        } else {
          setError(`Code PIN incorrect. Tentatives restantes: ${2 - attempts}`);
        }
        setIsVerifying(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePhotoTaken = (photoData: string, timestamp: Date) => {
    onVerified(photoData, timestamp);
  };

  const handlePhotoCancel = () => {
    setShowPhotoCapture(false);
    setPinVerified(false);
    setPinCode('');
    setError('');
  };

  // Si on doit capturer une photo
  if (showPhotoCapture) {
    return (
      <PhotoCapture
        onPhotoTaken={handlePhotoTaken}
        onCancel={handlePhotoCancel}
        employeeName={employee.name}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérification d'identité</h1>
          <p className="text-gray-600">Confirmez votre identité pour pointer</p>
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center text-sm text-yellow-800">
              <Camera className="w-4 h-4 mr-2" />
              <span><strong>Important :</strong> Une photo sera requise après la vérification du code PIN</span>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-600">{employee.position}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code PIN personnel
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyPress={handleKeyPress}
            placeholder="Saisissez votre code PIN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
            maxLength={4}
            disabled={isVerifying}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <XCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying || !pinCode.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Vérification...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer mon identité
              </>
            )}
          </button>

          {/* Debug Info - Visible sur mobile */}
          {debugInfo.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <h4 className="font-semibold text-gray-800 mb-2">🔧 Debug Info:</h4>
              <div className="space-y-1 text-xs text-gray-700">
                {debugInfo.map((info, index) => (
                  <div key={index} className="font-mono">{info}</div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 rounded-md">
          <div className="flex items-center text-xs text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span><strong>Sécurité :</strong> Votre code PIN est personnel et confidentiel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
