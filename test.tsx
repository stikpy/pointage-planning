"use client";

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ShiftForm from './components/ShiftForm';
import ShiftList from './components/ShiftList';
import EmployeeSelector from './components/EmployeeSelector';
import PowerOutageNotification from './components/PowerOutageNotification';
import QuickClockIn from './components/QuickClockIn';
import QRCodeManager from './components/QRCodeManager';
import QRCodeDemo from './components/QRCodeDemo';
import EmployeePINManager from './components/EmployeePINManager';
import PhotoGallery from './components/PhotoGallery';
import PINDebug from './components/PINDebug';
import { useRobustStorage } from './hooks/useRobustStorage';
import { initialAppState } from './data/mockData';
import { AppState, Employee, Shift, LaborWarning } from './types';
import { runSelfTests } from './utils/testUtils';

export default function App() {
  const {
    data: appState,
    setData: setAppState,
    isOnline,
    lastSave,
    dataIntegrity,
    exportData,
    importData,
    forceSave,
    recoveryNeeded
  } = useRobustStorage('shift-management-app', initialAppState);
  
  const [view, setView] = useState<'login' | 'shifts' | 'dashboard' | 'analytics' | 'qr-codes' | 'pin-manager' | 'photo-gallery' | 'pin-debug'>('login');
  const [showNotification, setShowNotification] = useState(true);

  // Calculer les créneaux d'aujourd'hui
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayShifts = appState.shifts.filter(shift => {
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    return startDate.toISOString().split('T')[0] === todayString;
  });

  // Calculer les employés présents
  const presentEmployees = appState.employees.filter(emp => 
    emp.isActive && todayShifts.some(shift => shift.employeeId === emp.id)
  ).length;

  // Calculer les heures de la semaine
  const getWeeklyHours = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return appState.shifts
      .filter(shift => {
        const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
        return startDate >= weekStart && startDate <= weekEnd;
      })
      .reduce((sum, shift) => {
        const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
        const endDate = shift.end instanceof Date ? shift.end : new Date(shift.end);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const breakHours = shift.breakMin / 60;
        return sum + (duration - breakHours);
      }, 0);
  };

  const handleSelectEmployee = (employee: Employee) => {
    setAppState(prev => ({ ...prev, currentUser: employee }));
    setView(employee.role === 'manager' ? 'dashboard' : 'shifts');
  };

  const handleLogout = () => {
    setAppState(prev => ({ ...prev, currentUser: null }));
    setView('login');
  };

  const handleShiftAdd = (shiftData: { start: Date; end: Date; breakMin: number; warnings: LaborWarning[] }) => {
    const newShift: Shift = {
      id: Date.now().toString(),
      start: shiftData.start,
      end: shiftData.end,
      breakMin: shiftData.breakMin,
      warnings: shiftData.warnings,
      employeeId: appState.currentUser?.id,
      employeeName: appState.currentUser?.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setAppState(prev => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };

  const handleShiftDelete = (id: string) => {
    setAppState(prev => ({
      ...prev,
      shifts: prev.shifts.filter(shift => shift.id !== id)
    }));
  };

  // Fonctions de pointage rapide
  const handleQuickClockIn = (employeeId: string) => {
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    // Vérifier si l'employé a déjà un créneaux aujourd'hui
    const existingShift = appState.shifts.find(shift => {
      const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
      return shift.employeeId === employeeId &&
        startDate.toISOString().split('T')[0] === todayString &&
        !shift.end;
    });

    if (existingShift) {
      // Pointer la sortie
      setAppState(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === existingShift.id 
            ? { ...shift, end: now }
            : shift
        )
      }));
    } else {
      // Pointer l'entrée
      const newShift: Shift = {
        id: Date.now().toString(),
        employeeId,
        start: now,
        end: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 heures par défaut
        breakMin: 30, // 30 minutes de pause par défaut
        warnings: [],
        employeeName: appState.employees.find(emp => emp.id === employeeId)?.name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setAppState(prev => ({ ...prev, shifts: [...prev.shifts, newShift] }));
    }
  };

  const handleQuickClockOut = (employeeId: string) => {
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    const existingShift = appState.shifts.find(shift => {
      const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
      return shift.employeeId === employeeId &&
        startDate.toISOString().split('T')[0] === todayString &&
        !shift.end;
    });

    if (existingShift) {
      setAppState(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === existingShift.id 
            ? { ...shift, end: now }
            : shift
        )
      }));
    }
  };

  // Fonction pour mettre à jour un employé
  const handleUpdateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    const updatedEmployees = appState.employees.map(emp => 
      emp.id === employeeId ? { ...emp, ...updates } : emp
    );
    updateAppState({ employees: updatedEmployees });
  };

  // Fonction pour télécharger une photo
  const handleDownloadPhoto = (photo: any) => {
    const link = document.createElement('a');
    link.download = `pointage_${photo.employeeName}_${new Date(photo.timestamp).toISOString().split('T')[0]}.jpg`;
    link.href = photo.photoData;
    link.click();
  };

  // Charger les photos de pointage
  const clockPhotos = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('clock-photos') || '[]')
    : [];

  // Debug: vérifier les données des employés
  console.log('Employés chargés:', appState.employees);
  console.log('Marie Dubois PIN:', appState.employees.find(emp => emp.id === 'emp_1')?.pinCode);
  console.log('Tous les codes PIN:', appState.employees.map(emp => ({ name: emp.name, pin: emp.pinCode })));

  // Forcer la mise à jour des employés avec les codes PIN si nécessaire
  useEffect(() => {
    const needsUpdate = appState.employees.some(emp => !emp.pinCode);
    if (needsUpdate) {
      console.log('Mise à jour des codes PIN...');
      const defaultPins: { [key: string]: string } = {
        'emp_1': '1234', // Marie Dubois
        'emp_2': '5678', // Jean Martin
        'emp_3': '9012', // Sophie Laurent
        'emp_4': '3456', // Pierre Moreau
        'emp_5': '7890'  // Claire Petit
      };
      
      const updatedEmployees = appState.employees.map(emp => ({
        ...emp,
        pinCode: emp.pinCode || defaultPins[emp.id] || '0000'
      }));
      
      setAppState(prev => ({ ...prev, employees: updatedEmployees }));
    }
  }, [appState.employees]);

  const renderContent = () => {
    switch (view) {
      case 'login':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Pointage Planning</h1>
                <p className="text-xl text-gray-600">Gestion intelligente des créneaux de travail</p>
              </div>
              <EmployeeSelector
                employees={appState.employees}
                selectedEmployee={appState.currentUser}
                onSelectEmployee={handleSelectEmployee}
              />
            </div>
          </div>
        );

      case 'shifts':
        if (!appState.currentUser) return null;
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('login')}
              title="Mes Créneaux"
              subtitle="Gestion de vos horaires de travail"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <Dashboard 
                  shifts={appState.shifts.filter(shift => shift.employeeId === appState.currentUser?.id)}
                  employees={appState.employees}
                  todayShifts={todayShifts.filter(shift => shift.employeeId === appState.currentUser?.id)}
                  weeklyHours={getWeeklyHours()}
                  presentEmployees={presentEmployees}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <ShiftForm onShiftAdd={handleShiftAdd} />
                  </div>
                  
                  <div>
                    <ShiftList 
                      shifts={appState.shifts.filter(shift => shift.employeeId === appState.currentUser?.id)}
                      onShiftDelete={handleShiftDelete} 
                    />
                  </div>
                </div>
              </div>
            </main>
          </div>
        );

      case 'dashboard':
        if (!appState.currentUser || appState.currentUser.role !== 'manager') return null;
        
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('login')}
              title="Tableau de Bord"
              subtitle="Vue d'ensemble de l'équipe"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <Dashboard 
                  shifts={appState.shifts}
                  employees={appState.employees}
                  todayShifts={todayShifts}
                  weeklyHours={getWeeklyHours()}
                  presentEmployees={presentEmployees}
                  onNavigateToQR={() => setView('qr-codes')}
                />
                
                {/* Pointage rapide */}
                <div className="mt-8">
                  <QuickClockIn
                    employees={appState.employees}
                    currentShifts={appState.shifts.filter(shift => !shift.end)}
                    onClockIn={handleQuickClockIn}
                    onClockOut={handleQuickClockOut}
                  />
                </div>

                {/* Démonstration QR Codes */}
                <div className="mt-8">
                  <QRCodeDemo
                    employees={appState.employees}
                    onClockIn={handleQuickClockIn}
                    onClockOut={handleQuickClockOut}
                  />
                </div>

                {/* Navigation vers les nouvelles fonctionnalités */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setView('qr-codes')}
                    className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-lg">📱</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">QR Codes</h3>
                        <p className="text-sm text-gray-600">Générer des codes QR sécurisés</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setView('pin-manager')}
                    className="p-4 bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-lg">🔐</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Codes PIN</h3>
                        <p className="text-sm text-gray-600">Gérer les codes de sécurité</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setView('photo-gallery')}
                    className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-lg">📸</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Photos</h3>
                        <p className="text-sm text-gray-600">Galerie des photos de pointage</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setView('pin-debug')}
                    className="p-4 bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-300 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-lg">🐛</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Debug PIN</h3>
                        <p className="text-sm text-gray-600">Tester les codes PIN</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  <div>
                    <ShiftForm onShiftAdd={handleShiftAdd} />
                  </div>
                  
                  <div>
                    <ShiftList 
                      shifts={appState.shifts}
                      onShiftDelete={handleShiftDelete} 
                    />
                  </div>
                </div>
                
                {/* Section de test pour les développeurs */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">Tests de validation</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Cette section permet de tester la logique de validation des règles de travail.
      </p>
      <button
        onClick={() => {
          try {
            const res = runSelfTests();
            alert(res);
          } catch (e: any) {
            alert(e?.message ?? String(e));
          }
        }}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
                    Lancer les tests de validation
      </button>
                </div>
              </div>
            </main>
    </div>
  );

      case 'qr-codes':
        if (!appState.currentUser || appState.currentUser.role !== 'manager') return null;
        
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('dashboard')}
              title="Gestion QR Codes"
              subtitle="Génération et gestion des codes QR"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <QRCodeManager
                  employees={appState.employees}
                  onGenerateAll={() => {}}
                  onDownloadAll={() => {}}
                />
              </div>
            </main>
          </div>
        );

      case 'pin-manager':
        if (!appState.currentUser || appState.currentUser.role !== 'manager') return null;
        
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('dashboard')}
              title="Gestion des codes PIN"
              subtitle="Configuration des codes PIN de sécurité"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <EmployeePINManager
                  employees={appState.employees}
                  onUpdateEmployee={handleUpdateEmployee}
                />
              </div>
            </main>
          </div>
        );

      case 'photo-gallery':
        if (!appState.currentUser || appState.currentUser.role !== 'manager') return null;
        
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('dashboard')}
              title="Galerie de photos"
              subtitle="Photos de pointage avec horodatage"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <PhotoGallery
                  photos={clockPhotos}
                  onDownloadPhoto={handleDownloadPhoto}
                />
              </div>
            </main>
          </div>
        );

      case 'pin-debug':
        if (!appState.currentUser || appState.currentUser.role !== 'manager') return null;
        
        return (
          <div>
            <Header
              currentUser={appState.currentUser}
              onLogout={handleLogout}
              showBackButton
              onBack={() => setView('dashboard')}
              title="Debug des codes PIN"
              subtitle="Tester et diagnostiquer les codes PIN"
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={forceSave}
            />
            <main className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                <PINDebug employees={appState.employees} />
              </div>
            </main>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderContent()}
      
      {/* Notification de gestion des coupures de courant */}
      <PowerOutageNotification
        isOnline={isOnline}
        lastSave={lastSave}
        dataIntegrity={dataIntegrity}
        recoveryNeeded={recoveryNeeded}
        onExport={exportData}
        onImport={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            importData(content);
          };
          reader.readAsText(file);
        }}
        onDismiss={() => setShowNotification(false)}
      />
    </div>
  );
}