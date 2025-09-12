"use client";

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Dashboard from './Dashboard';
import ShiftForm from './ShiftForm';
import ShiftList from './ShiftList';
import EmployeeSelector from './EmployeeSelector';
import PowerOutageNotification from './PowerOutageNotification';
import QuickClockIn from './QuickClockIn';
import QRCodeManager from './QRCodeManager';
import QRCodeDemo from './QRCodeDemo';
import EmployeePINManager from './EmployeePINManager';
import PhotoGallery from './PhotoGallery';
import PINDebug from './PINDebug';
import { useEmployees, useShifts, useClockPhotos, useDatabaseInit } from '../hooks/useSupabase';
import { Employee, Shift, LaborWarning } from '../types';

export default function AppWithSupabase() {
  const { initialized, loading: dbLoading, error: dbError } = useDatabaseInit();
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees();
  const { shifts, loading: shiftsLoading, error: shiftsError } = useShifts();
  const { photos, loading: photosLoading, error: photosError } = useClockPhotos();
  
  const [view, setView] = useState<'login' | 'shifts' | 'dashboard' | 'analytics' | 'qr-codes' | 'pin-manager' | 'photo-gallery' | 'pin-debug'>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showNotification, setShowNotification] = useState(true);

  // Transformer les shifts de Supabase vers notre format
  const transformedShifts = shifts.map(shift => ({
    id: shift.id.toString(),
    start: new Date(shift.start_time),
    end: shift.end_time ? new Date(shift.end_time) : new Date(),
    breakMin: shift.break_duration || 0,
    warnings: [],
    employeeId: shift.employee_id,
    employeeName: employees.find(emp => emp.id === shift.employee_id)?.name || 'Inconnu',
    createdAt: new Date(shift.created_at),
    updatedAt: new Date(shift.updated_at)
  }));

  // Transformer les photos de Supabase vers notre format
  const transformedPhotos = photos.map(photo => ({
    id: photo.id.toString(),
    employeeId: photo.employee_id,
    employeeName: employees.find(emp => emp.id === photo.employee_id)?.name || 'Inconnu',
    photoData: photo.photo_data,
    photoUrl: photo.photo_url,
    clockType: 'in' as const,
    timestamp: new Date(photo.timestamp),
    shiftId: photo.shift_id?.toString()
  }));

  // Calculer les créneaux d'aujourd'hui
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayShifts = transformedShifts.filter(shift => {
    const startDate = new Date(shift.start);
    return startDate.toISOString().split('T')[0] === todayString;
  });

  // Calculer les employés présents
  const presentEmployees = employees.filter(emp => 
    emp.isActive && todayShifts.some(shift => shift.employeeId === emp.id)
  ).length;

  // Calculer les heures de la semaine
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekShifts = shifts.filter(shift => {
    const startDate = new Date(shift.start_time);
    return startDate >= weekStart && startDate <= weekEnd;
  });

  const totalWeekHours = weekShifts.reduce((total, shift) => {
    return total + (shift.total_hours || 0);
  }, 0);

  // Calculer les avertissements de travail
  const laborWarnings: LaborWarning[] = [];
  
  employees.forEach(emp => {
    const empShifts = transformedShifts.filter(shift => shift.employeeId === emp.id);
    const totalHours = empShifts.reduce((total, shift) => {
      const duration = (shift.end.getTime() - shift.start.getTime()) / (1000 * 60 * 60);
      return total + duration - (shift.breakMin / 60);
    }, 0);
    
    if (totalHours > emp.maxHoursPerWeek) {
      laborWarnings.push({
        employeeId: emp.id,
        employeeName: emp.name,
        type: 'max_hours_exceeded',
        message: `${emp.name} a dépassé ses heures maximales (${totalHours.toFixed(1)}h / ${emp.maxHoursPerWeek}h)`,
        code: 'MAX_HOURS_EXCEEDED'
      });
    }
  });

  // Gestion des erreurs
  const hasError = dbError || employeesError || shiftsError || photosError;
  const isLoading = dbLoading || employeesLoading || shiftsLoading || photosLoading;

  // Fonctions de gestion des employés
  const handleSelectEmployee = (employee: Employee) => {
    setCurrentUser(employee);
    setSelectedEmployee(employee);
    setView(employee.role === 'manager' ? 'dashboard' : 'shifts');
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    // Cette fonction sera implémentée dans le hook useEmployees
    console.log('Mise à jour employé:', id, updates);
  };

  const handleDownloadPhoto = (photo: any) => {
    // Cette fonction sera implémentée dans le hook useClockPhotos
    console.log('Téléchargement photo:', photo);
  };

  const handleGenerateAllQR = () => {
    console.log('Génération de tous les QR codes');
  };

  const handleDownloadAllQR = () => {
    console.log('Téléchargement de tous les QR codes');
  };

  // Fonctions de gestion des créneaux
  const handleAddShift = async (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
    // Cette fonction sera implémentée dans le hook useShifts
    console.log('Ajout créneau:', shift);
  };

  const handleShiftAdd = (shiftData: { start: Date; end: Date; breakMin: number; warnings: LaborWarning[] }) => {
    // Adapter les données pour handleAddShift
    const shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'> = {
      start: shiftData.start,
      end: shiftData.end,
      breakMin: shiftData.breakMin,
      warnings: shiftData.warnings,
      employeeId: selectedEmployee?.id,
      employeeName: selectedEmployee?.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    handleAddShift(shift);
  };

  const handleUpdateShift = async (id: number, updates: Partial<Shift>) => {
    // Cette fonction sera implémentée dans le hook useShifts
    console.log('Mise à jour créneau:', id, updates);
  };

  // Fonction d'export des données
  const handleExportData = () => {
    const data = {
      employees,
      shifts,
      photos,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointage-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fonction d'import des données
  const handleImportData = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Import des données:', data);
        // Ici, vous pourriez implémenter la logique d'import
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
      }
    };
    reader.readAsText(file);
  };

  // Rendu du contenu selon la vue
  const renderContent = () => {
    if (!initialized) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initialisation de la base de données...</p>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de connexion</h2>
            <p className="text-gray-600 mb-4">
              {dbError || employeesError || shiftsError || photosError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'login':
        return (
          <EmployeeSelector
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={handleSelectEmployee}
          />
        );
      
      case 'dashboard':
        return (
          <Dashboard
            employees={employees}
            shifts={transformedShifts}
            todayShifts={todayShifts}
            presentEmployees={presentEmployees}
            weeklyHours={totalWeekHours}
            onNavigateToQR={() => setView('qr-codes')}
          />
        );
      
      case 'shifts':
        return (
          <div className="space-y-6">
            <ShiftForm
              onShiftAdd={handleShiftAdd}
            />
            <ShiftList
              shifts={transformedShifts}
              onShiftDelete={(id) => console.log('Suppression créneau:', id)}
            />
          </div>
        );
      
      case 'qr-codes':
        return (
          <QRCodeManager 
            employees={employees} 
            onGenerateAll={handleGenerateAllQR}
            onDownloadAll={handleDownloadAllQR}
          />
        );
      
      case 'pin-manager':
        return (
          <EmployeePINManager
            employees={employees}
            onUpdateEmployee={handleUpdateEmployee}
          />
        );
      
      case 'photo-gallery':
        return (
          <PhotoGallery
            photos={transformedPhotos}
            onDownloadPhoto={handleDownloadPhoto}
          />
        );
      
      case 'pin-debug':
        return <PINDebug employees={employees} />;
      
      default:
        return (
          <EmployeeSelector
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={handleSelectEmployee}
          />
        );
    }
  };

  return (
    <div className="App">
      <PowerOutageNotification
        isOnline={true} // Supabase gère la connectivité
        recoveryNeeded={false}
        dataIntegrity={true}
        lastSave={new Date()}
        onExport={handleExportData}
        onImport={handleImportData}
        onDismiss={() => setShowNotification(false)}
      />
      
      {currentUser && (
        <Header
          currentUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            setView('login');
          }}
        />
      )}
      
      <main className="min-h-screen bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
}
