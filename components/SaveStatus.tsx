"use client";

import React from 'react';
import { CheckCircle, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react';

interface SaveStatusProps {
  isOnline: boolean;
  lastSave: Date | null;
  dataIntegrity: boolean;
  onForceSave: () => void;
}

export default function SaveStatus({ 
  isOnline, 
  lastSave, 
  dataIntegrity, 
  onForceSave 
}: SaveStatusProps) {
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: "Hors ligne",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100"
      };
    }

    if (!dataIntegrity) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: "Erreur données",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    }

    if (!lastSave) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: "Non sauvegardé",
        color: "text-gray-600",
        bgColor: "bg-gray-100"
      };
    }

    const timeSinceLastSave = Date.now() - lastSave.getTime();
    const minutesSinceLastSave = Math.floor(timeSinceLastSave / (1000 * 60));

    if (minutesSinceLastSave < 1) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        text: "Sauvegardé",
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    } else if (minutesSinceLastSave < 5) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: `${minutesSinceLastSave}min`,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: `${minutesSinceLastSave}min`,
        color: "text-orange-600",
        bgColor: "bg-orange-100"
      };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="flex items-center space-x-2">
      {/* Statut de connexion */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-yellow-500" />
        )}
        <span className="text-xs text-gray-500">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      {/* Statut de sauvegarde */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${status.bgColor}`}>
        {status.icon}
        <span className={`text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Bouton de sauvegarde forcée */}
      <button
        onClick={onForceSave}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Sauvegarder maintenant"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
