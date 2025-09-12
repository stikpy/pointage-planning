"use client";

import React, { useState, useEffect } from 'react';
import { useRobustStorage } from '../hooks/useRobustStorage';
import { employeeUtils, shiftUtils, clockPhotoUtils } from '../lib/supabase-utils';
import { initialAppState } from '../data/mockData';

interface MigrationStatus {
  step: string;
  progress: number;
  total: number;
  error?: string;
}

export default function MigrationToSupabase() {
  const { data: localData } = useRobustStorage('shift-management-app', initialAppState);
  const [status, setStatus] = useState<MigrationStatus>({
    step: 'Prêt à migrer',
    progress: 0,
    total: 0
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const migrateData = async () => {
    setIsMigrating(true);
    setStatus({ step: 'Début de la migration...', progress: 0, total: 0 });

    try {
      const totalSteps = 3;
      let currentStep = 0;

      // Étape 1: Migration des employés
      setStatus({ 
        step: 'Migration des employés...', 
        progress: currentStep, 
        total: totalSteps 
      });
      
      for (const emp of localData.employees) {
        try {
          await employeeUtils.create({
            id: emp.id,
            name: emp.name,
            email: emp.email,
            position: emp.position,
            role: emp.role,
            is_active: emp.isActive,
            max_hours_per_day: emp.maxHoursPerDay,
            max_hours_per_week: emp.maxHoursPerWeek,
            min_break_minutes: emp.minBreakMinutes,
            pin_code: emp.pinCode,
            photo_url: emp.photo,
            work_schedule: emp.workSchedule || {
              startTime: '08:00',
              endTime: '18:00',
              days: [1,2,3,4,5]
            }
          });
        } catch (error) {
          console.warn(`Employé ${emp.name} déjà existant ou erreur:`, error);
        }
      }
      
      currentStep++;
      setStatus({ 
        step: 'Employés migrés, migration des créneaux...', 
        progress: currentStep, 
        total: totalSteps 
      });

      // Étape 2: Migration des créneaux
      for (const shift of localData.shifts) {
        try {
          await shiftUtils.create({
            employee_id: shift.employeeId,
            start_time: shift.start instanceof Date ? shift.start.toISOString() : new Date(shift.start).toISOString(),
            end_time: shift.end ? (shift.end instanceof Date ? shift.end.toISOString() : new Date(shift.end).toISOString()) : undefined,
            break_duration: shift.breakDuration || 0,
            status: shift.status || 'completed',
            notes: shift.notes
          });
        } catch (error) {
          console.warn(`Créneau ${shift.id} erreur:`, error);
        }
      }
      
      currentStep++;
      setStatus({ 
        step: 'Créneaux migrés, migration des photos...', 
        progress: currentStep, 
        total: totalSteps 
      });

      // Étape 3: Migration des photos (si elles existent)
      if (localData.clockPhotos && localData.clockPhotos.length > 0) {
        for (const photo of localData.clockPhotos) {
          try {
            await clockPhotoUtils.save({
              employee_id: photo.employeeId,
              photo_data: photo.photoData,
              photo_url: photo.photoUrl,
              timestamp: photo.timestamp,
              metadata: photo.metadata || {}
            });
          } catch (error) {
            console.warn(`Photo ${photo.id} erreur:`, error);
          }
        }
      }
      
      currentStep++;
      setStatus({ 
        step: 'Migration terminée avec succès !', 
        progress: currentStep, 
        total: totalSteps 
      });
      
      setMigrationComplete(true);
      
    } catch (error) {
      setStatus({ 
        step: 'Erreur lors de la migration', 
        progress: 0, 
        total: 0, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const resetMigration = () => {
    setStatus({ step: 'Prêt à migrer', progress: 0, total: 0 });
    setMigrationComplete(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Migration vers Supabase
          </h1>
          <p className="text-gray-600">
            Migrez vos données locales vers la base de données Supabase
          </p>
        </div>

        {/* Statistiques des données locales */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Données à migrer</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Employés:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                {localData.employees.length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Créneaux:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                {localData.shifts.length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Photos:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                {localData.clockPhotos?.length || 0}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dernière sauvegarde:</span>
              <span className="ml-2 text-gray-600">
                {localData.lastSave ? new Date(localData.lastSave).toLocaleString() : 'Jamais'}
              </span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {isMigrating && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{status.step}</span>
              <span>{status.progress}/{status.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(status.progress / status.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Messages d'erreur */}
        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600 text-xl mr-3">⚠️</div>
              <div>
                <h4 className="text-red-800 font-semibold">Erreur de migration</h4>
                <p className="text-red-700 text-sm mt-1">{status.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {migrationComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-green-600 text-xl mr-3">✅</div>
              <div>
                <h4 className="text-green-800 font-semibold">Migration réussie !</h4>
                <p className="text-green-700 text-sm mt-1">
                  Toutes vos données ont été migrées vers Supabase avec succès.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex space-x-4">
          {!migrationComplete && (
            <button
              onClick={migrateData}
              disabled={isMigrating}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isMigrating ? 'Migration en cours...' : 'Commencer la migration'}
            </button>
          )}
          
          {migrationComplete && (
            <button
              onClick={resetMigration}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
            >
              Migrer à nouveau
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Retour à l'application
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold text-gray-800 mb-2">Instructions :</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Assurez-vous que Supabase est configuré correctement</li>
            <li>La migration ne supprime pas vos données locales</li>
            <li>Les données existantes dans Supabase ne seront pas écrasées</li>
            <li>Vous pourrez continuer à utiliser l'application normalement après la migration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
