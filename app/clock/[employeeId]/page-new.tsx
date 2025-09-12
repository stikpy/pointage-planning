"use client";

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Camera, User, Shield, ArrowLeft } from 'lucide-react';
import { validateQRCode, decodeQRData } from '../../../lib/qr-generator';
import IdentityVerification from '../../../components/IdentityVerification';
import PlanningDisplay from '../../../components/PlanningDisplay';
import PhotoCapture from '../../../components/PhotoCapture';
import { getEmployee, getActiveShift, createShift, updateShift, createClockPhoto } from '../../../lib/api-client';

interface ClockPageProps {
  params: {
    employeeId: string;
  };
}

interface Employee {
  id: string;
  name: string;
  role: string;
  pin_code: string;
  work_schedule: {
    days: number[];
    startTime: string;
    endTime: string;
  };
}

interface Shift {
  id: number;
  employee_id: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed';
  shift_type?: 'morning' | 'evening';
  break_start?: string;
  break_end?: string;
}

export default function ClockPage({ params }: ClockPageProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  const [needsIdentityVerification, setNeedsIdentityVerification] = useState(false);
  const [needsPhotoCapture, setNeedsPhotoCapture] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      console.log('🔍 Début de la validation de session...');
      
      // Récupérer les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      
      if (!dataParam) {
        setError('QR code invalide ou expiré');
        setLoading(false);
        return;
      }

      // Décoder et valider les données QR
      const qrData = decodeQRData(dataParam);
      if (!qrData || !validateQRCode(qrData)) {
        setError('QR code invalide ou expiré');
        setLoading(false);
        return;
      }

      console.log('✅ QR code valide:', qrData);

      // Charger l'employé
      console.log('🔍 Chargement de l\'employé depuis l\'API...');
      const employeeData = await getEmployee(params.employeeId);
      
      if (!employeeData) {
        setError('Employé non trouvé');
        setLoading(false);
        return;
      }

      console.log('✅ Employé trouvé:', employeeData);
      setEmployee(employeeData);

      // Charger le shift actif
      const shiftData = await getActiveShift(params.employeeId);
      setActiveShift(shiftData);

      setSessionValid(true);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erreur validation session:', error);
      setError('Erreur lors de la validation de la session');
      setLoading(false);
    }
  };

  const handleActionSelect = async (action: 'arrival' | 'morning_break' | 'evening_break' | 'departure') => {
    if (!employee) return;

    setSelectedAction(action);
    setNeedsIdentityVerification(true);
  };

  const handleIdentityVerified = async (photoData?: string, timestamp?: Date) => {
    if (!employee || !selectedAction) return;

    setNeedsIdentityVerification(false);
    setNeedsPhotoCapture(true);
  };

  const handlePhotoTaken = async (photoData: string) => {
    if (!employee || !selectedAction) return;

    try {
      setNeedsPhotoCapture(false);

      // Upload de la photo
      const fileName = `clock_photo_${employee.id}_${Date.now()}.jpg`;
      const base64Data = photoData.split(',')[1];
      
      const response = await fetch('/api/clock-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          imageData: base64Data
        })
      });

      if (!response.ok) {
        throw new Error('Erreur upload photo');
      }

      const uploadResult = await response.json();
      const photoUrl = `https://ztgqzlrvrgnvilkipznr.supabase.co/storage/v1/object/public/clock-photos/${fileName}`;

      // Traiter l'action selon le type
      await processAction(selectedAction, photoUrl, photoData);

    } catch (error) {
      console.error('❌ Erreur traitement photo:', error);
      setError('Erreur lors du traitement de la photo');
    }
  };

  const processAction = async (action: string, photoUrl: string, photoData: string) => {
    if (!employee) return;

    try {
      const now = new Date();
      const timestamp = now.toISOString();

      // Créer l'enregistrement de photo
      await createClockPhoto({
        employee_id: employee.id,
        photo_url: photoUrl,
        photo_data: photoData,
        timestamp,
        metadata: {
          action,
          timestamp: now.toISOString(),
          employeeName: employee.name
        }
      });

      // Traiter l'action selon le type
      switch (action) {
        case 'arrival':
          await handleArrival(timestamp);
          break;
        case 'morning_break':
        case 'evening_break':
          await handleBreak(action, timestamp);
          break;
        case 'departure':
          await handleDeparture(timestamp);
          break;
      }

      setSuccess(`Action "${getActionLabel(action)}" enregistrée avec succès !`);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur traitement action:', error);
      setError('Erreur lors de l\'enregistrement de l\'action');
    }
  };

  const handleArrival = async (timestamp: string) => {
    if (!employee) return;

    const shiftData = {
      employee_id: employee.id,
      start_time: timestamp,
      status: 'active',
      shift_type: new Date().getHours() < 12 ? 'morning' : 'evening'
    };

    const newShift = await createShift(shiftData);
    setActiveShift(newShift);
  };

  const handleBreak = async (action: string, timestamp: string) => {
    if (!activeShift) return;

    const updates: any = {};
    
    if (action === 'morning_break') {
      updates.break_start = timestamp;
    } else if (action === 'evening_break') {
      updates.break_end = timestamp;
    }

    const updatedShift = await updateShift(activeShift.id, updates);
    setActiveShift(updatedShift);
  };

  const handleDeparture = async (timestamp: string) => {
    if (!activeShift) return;

    const updates = {
      end_time: timestamp,
      status: 'completed' as const
    };

    const updatedShift = await updateShift(activeShift.id, updates);
    setActiveShift(updatedShift);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'arrival': return 'Arrivée';
      case 'morning_break': return 'Pause déjeuner';
      case 'evening_break': return 'Pause soir';
      case 'departure': return 'Départ';
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validation de la session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      </div>
    );
  }

  if (!sessionValid || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Session Invalide</h1>
          <p className="text-gray-600 mb-6">Veuillez scanner un QR code valide</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <span>Pointage</span>
            </h1>
            <div className="text-sm text-gray-500">
              Session valide
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {employee.name}
            </div>
            <div className="text-sm text-gray-600">
              {employee.role}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Interface principale */}
        {!needsIdentityVerification && !needsPhotoCapture && (
        <PlanningDisplay
          employeeName={employee.name}
          workSchedule={employee.work_schedule}
          currentShift={activeShift}
          onActionSelect={handleActionSelect}
        />
        )}

        {/* Vérification d'identité */}
        {needsIdentityVerification && (
          <IdentityVerification
            employee={employee}
            onVerified={handleIdentityVerified}
            onCancel={() => setNeedsIdentityVerification(false)}
          />
        )}

        {/* Capture de photo */}
        {needsPhotoCapture && (
          <PhotoCapture
            onPhotoTaken={handlePhotoTaken}
            onCancel={() => setNeedsPhotoCapture(false)}
            action={selectedAction}
          />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>🔒 Cette page n'est accessible que via scan QR code valide</p>
          <p>⏰ Session valide pendant 5 minutes</p>
        </div>
      </div>
    </div>
  );
}
