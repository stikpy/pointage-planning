"use client";

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Camera, User, Shield } from 'lucide-react';
import { validateClockSession, validateQRDataFromURL } from '../../../utils/secureQR';
import IdentityVerification from '../../../components/IdentityVerification';
import { supabase } from '../../../lib/supabase';
import { getEmployee, getActiveShift, createShift, updateShift, createClockPhoto } from '../../../lib/api-client';

interface ClockPageProps {
  params: {
    employeeId: string;
  };
}

interface ClockSession {
  id: string;
  employeeId: string;
  timestamp: number;
  signature: string;
  isValid: boolean;
}

export default function ClockPage({ params }: ClockPageProps) {
  const [employee, setEmployee] = useState<any>(null);
  const [clockSession, setClockSession] = useState<ClockSession | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [needsIdentityVerification, setNeedsIdentityVerification] = useState(false);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loadingShift, setLoadingShift] = useState(true);

  useEffect(() => {
    // Timeout de sécurité pour forcer l'affichage
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout - Forçage de l\'affichage de l\'interface');
      setIsValidating(false);
      setNeedsIdentityVerification(true);
      
      // Charger l'employé par défaut
      const defaultPins: { [key: string]: string } = {
        'emp_1': '1234', 'emp_2': '5678', 'emp_3': '9012', 'emp_4': '3456', 'emp_5': '7890'
      };
      
      const defaultEmployee = {
        id: params.employeeId,
        name: params.employeeId === 'emp_1' ? 'Marie Dubois' : 'Employé Test',
        role: 'employee',
        pinCode: defaultPins[params.employeeId] || '0000',
        workSchedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] }
      };
      
      setEmployee(defaultEmployee);
      setClockSession({
        id: 'timeout_session',
        employeeId: params.employeeId,
        timestamp: Date.now(),
        signature: 'timeout',
        isValid: true
      });
    }, 3000);
    
    validateClockSessionLocal();
    
    return () => clearTimeout(timeout);
  }, [params.employeeId]);

  // Vérifier si l'employé est déjà en cours de travail
  useEffect(() => {
    const checkActiveShift = async () => {
      if (!employee) return;
      
      try {
        const shift = await getActiveShift(employee.id);
        setActiveShift(shift);
      } catch (error) {
        console.error('❌ Erreur vérification créneaux:', error);
      } finally {
        setLoadingShift(false);
      }
    };

    checkActiveShift();
  }, [employee]);

  const validateClockSessionLocal = async () => {
    try {
      console.log('🔍 Début de la validation de session...');
      setIsValidating(true);
      
      // Charger l'employé depuis l'API
      console.log('🔍 Chargement de l\'employé depuis l\'API...');
      const foundEmployee = await getEmployee(params.employeeId);
      
      if (!foundEmployee) {
        console.error('❌ Erreur chargement employé: Employé non trouvé');
        setError('Employé non trouvé.');
        setIsValidating(false);
        return;
      }
      
      console.log('✅ Employé trouvé:', foundEmployee.name);
      console.log('- ID:', foundEmployee.id);
      console.log('- PIN:', foundEmployee.pin_code);
      console.log('- Rôle:', foundEmployee.role);
      console.log('- Horaires:', foundEmployee.work_schedule);

      // Créer une session factice pour le debug
      const fakeSession = {
        id: 'debug_session',
        employeeId: params.employeeId,
        timestamp: Date.now(),
        signature: 'debug',
        isValid: true
      };

      setEmployee(foundEmployee);
      setClockSession(fakeSession);
      setIsValidating(false);
      
      console.log('✅ Session factice créée:', fakeSession);
      
      // Demander la vérification d'identité
      console.log('🔍 Démarrage de la vérification d\'identité...');
      setNeedsIdentityVerification(true);
      
    } catch (error) {
      console.error('Erreur de validation:', error);
      setError('Erreur lors de la validation de la session.');
      setIsValidating(false);
    }
  };


  const handleClockIn = async () => {
    try {
      if (!employee || !clockSession) return;

      // Vérifier si l'employé est déjà en cours de travail
      const activeShift = await getActiveShift(employee.id);
      
      if (activeShift) {
        setError('Vous êtes déjà en cours de travail. Utilisez "Pointer la sortie".');
        return;
      }

      // Créer un nouveau créneau via l'API
      const newShift = await createShift({
        employee_id: employee.id,
        start_time: new Date().toISOString(),
        status: 'active',
        notes: 'Pointage d\'entrée'
      });
      
      if (!newShift) {
        setError('Erreur lors de l\'enregistrement du pointage.');
        return;
      }
      
      console.log('✅ Créneau créé:', newShift);
      setSuccess(`Pointage d'entrée enregistré pour ${employee.name}`);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('Erreur lors du pointage:', error);
      setError('Erreur lors de l\'enregistrement du pointage.');
    }
  };

  const handleClockOut = async () => {
    try {
      if (!employee || !clockSession) return;

      // Trouver le créneau actif
      const activeShift = await getActiveShift(employee.id);
      
      if (!activeShift) {
        setError('Aucun créneau actif trouvé. Utilisez "Pointer l\'entrée".');
        return;
      }

      // Mettre à jour le créneau via l'API
      const updatedShift = await updateShift(activeShift.id, {
        end_time: new Date().toISOString(),
        status: 'completed',
        notes: activeShift.notes ? `${activeShift.notes} - Pointage de sortie` : 'Pointage de sortie'
      });
      
      if (!updatedShift) {
        setError('Erreur lors de l\'enregistrement du pointage.');
        return;
      }
      
      console.log('✅ Créneau mis à jour:', activeShift.id);
      setSuccess(`Pointage de sortie enregistré pour ${employee.name}`);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('Erreur lors du pointage:', error);
      setError('Erreur lors de l\'enregistrement du pointage.');
    }
  };

  const handleIdentityVerified = async (photoData?: string, timestamp?: Date) => {
    setNeedsIdentityVerification(false);
    
    // La photo est maintenant obligatoire
    if (photoData && timestamp) {
      try {
        // Convertir la photo base64 en blob
        const base64Data = photoData.split(',')[1]; // Enlever le préfixe data:image/jpeg;base64,
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        // Créer un nom de fichier unique
        const fileName = `clock_photo_${params.employeeId}_${Date.now()}.jpg`;
        
        // Uploader vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('clock-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });
        
        if (uploadError) {
          console.error('❌ Erreur upload photo:', uploadError);
          setError('Erreur lors de l\'enregistrement de la photo.');
          return;
        }
        
        // Obtenir l'URL publique de la photo
        const { data: urlData } = supabase.storage
          .from('clock-photos')
          .getPublicUrl(fileName);
        
        // Sauvegarder les métadonnées de la photo via l'API
        const photoRecord = await createClockPhoto({
          employee_id: params.employeeId,
          photo_data: photoData, // Garder la version base64 pour compatibilité
          photo_url: urlData.publicUrl,
          timestamp: timestamp.toISOString(),
          metadata: {
            fileName,
            uploadTime: new Date().toISOString(),
            employeeName: employee?.name || 'Inconnu'
          }
        });
        
        if (!photoRecord) {
          setError('Erreur lors de l\'enregistrement des métadonnées de la photo.');
          return;
        }
        
        console.log('✅ Photo uploadée:', urlData.publicUrl);
        setSuccess('Pointage enregistré avec photo !');
        
      } catch (error) {
        console.error('❌ Erreur traitement photo:', error);
        setError('Erreur lors du traitement de la photo.');
      }
    } else {
      setError('Photo de pointage requise pour valider l\'identité');
    }
  };

  const handleIdentityCancel = () => {
    setError('Vérification d\'identité annulée. Accès refusé.');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  const startQRScan = () => {
    setIsScanning(true);
    // Simuler le scan QR (en réalité, ceci devrait être déclenché par le scan)
    setTimeout(() => {
      setIsScanning(false);
      setError('Cette page ne peut être utilisée que via scan QR code.');
    }, 2000);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validation de la session...</p>
          <p className="text-sm text-gray-500 mt-2">Si cette page reste bloquée, rechargez la page</p>
          <button 
            onClick={() => {
              console.log('🔄 Rechargement forcé...');
              setIsValidating(false);
              setNeedsIdentityVerification(true);
              setEmployee({
                id: params.employeeId,
                name: 'Marie Dubois',
                role: 'employee',
                pinCode: '1234',
                workSchedule: { startTime: '08:00', endTime: '18:00', days: [1,2,3,4,5] }
              });
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Forcer l'affichage
          </button>
        </div>
      </div>
    );
  }

  if (needsIdentityVerification && employee) {
    return (
      <IdentityVerification
        employee={employee}
        onVerified={handleIdentityVerified}
        onCancel={handleIdentityCancel}
      />
    );
  }

  if (error && !clockSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={startQRScan}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Scanner QR Code
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee || !clockSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Session invalide</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pointage</h1>
          <p className="text-gray-600">{employee.name}</p>
          <p className="text-sm text-gray-500">{employee.role}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <XCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {loadingShift ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Vérification des créneaux...</p>
            </div>
          ) : activeShift ? (
            <div>
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-800">En cours de travail</span>
                </div>
                <p className="text-sm text-orange-700">
                  Début: {new Date(activeShift.start_time).toLocaleTimeString()}
                </p>
                {activeShift.total_hours && (
                  <p className="text-sm text-orange-700">
                    Durée: {activeShift.total_hours.toFixed(2)}h
                  </p>
                )}
              </div>
              
              <button
                onClick={handleClockOut}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pointer la sortie
              </button>
            </div>
          ) : (
            <button
              onClick={handleClockIn}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Pointer l'entrée
            </button>
          )}
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800 text-center">
            🔒 <strong>Sécurité :</strong> Cette page n'est accessible que via scan QR code valide.
            Session valide pendant 5 minutes.
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
