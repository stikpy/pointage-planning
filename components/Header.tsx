"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, Shield, ArrowLeft, LogOut } from 'lucide-react';
import { Employee } from '../types';
import SaveStatus from './SaveStatus';

interface HeaderProps {
  currentUser: Employee | null;
  onLogout: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  lastSave?: Date | null;
  dataIntegrity?: boolean;
  onForceSave?: () => void;
}

export default function Header({ 
  currentUser, 
  onLogout, 
  showBackButton = false,
  onBack,
  title = "Pointage Planning",
  subtitle = "Gestion des créneaux de travail",
  isOnline = true,
  lastSave = null,
  dataIntegrity = true,
  onForceSave = () => {}
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(currentTime)}
              </div>
            </div>
            
            <SaveStatus
              isOnline={isOnline}
              lastSave={lastSave}
              dataIntegrity={dataIntegrity}
              onForceSave={onForceSave}
            />
            
            {currentUser && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                  {currentUser.role === 'manager' ? (
                    <Shield className="w-4 h-4 text-orange-600" />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {currentUser.name}
                  </span>
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}