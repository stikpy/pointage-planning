'use client';

import { useState, useEffect } from 'react';

interface WorkSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

interface PlanningDisplayProps {
  employeeName: string;
  workSchedule: WorkSchedule;
  currentShift?: any;
  onActionSelect: (action: 'arrival' | 'morning_break' | 'evening_break' | 'departure') => void;
}

export default function PlanningDisplay({ 
  employeeName, 
  workSchedule, 
  currentShift, 
  onActionSelect 
}: PlanningDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [suggestedAction, setSuggestedAction] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateSuggestedAction();
    }, 1000);

    return () => clearInterval(timer);
  }, [workSchedule, currentShift]);

  const updateSuggestedAction = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const [startHour, startMin] = workSchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = workSchedule.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    const currentTimeMinutes = hour * 60 + minute;
    
    // Logique de suggestion basée sur l'heure et l'état du shift
    if (!currentShift) {
      if (currentTimeMinutes >= startTime - 30 && currentTimeMinutes <= startTime + 60) {
        setSuggestedAction('arrival');
      } else {
        setSuggestedAction('outside_hours');
      }
    } else if (currentShift.status === 'active') {
      if (currentTimeMinutes >= startTime + 4 * 60 && currentTimeMinutes <= startTime + 6 * 60) {
        setSuggestedAction('morning_break');
      } else if (currentTimeMinutes >= endTime - 2 * 60 && currentTimeMinutes <= endTime) {
        setSuggestedAction('evening_break');
      } else if (currentTimeMinutes >= endTime) {
        setSuggestedAction('departure');
      } else {
        setSuggestedAction('working');
      }
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'arrival': return 'Arrivée';
      case 'morning_break': return 'Pause déjeuner';
      case 'evening_break': return 'Pause soir';
      case 'departure': return 'Départ';
      case 'working': return 'En cours de travail';
      case 'outside_hours': return 'Hors heures de travail';
      default: return 'Action inconnue';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'arrival': return 'bg-green-500';
      case 'morning_break': return 'bg-blue-500';
      case 'evening_break': return 'bg-purple-500';
      case 'departure': return 'bg-red-500';
      case 'working': return 'bg-yellow-500';
      case 'outside_hours': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isActionAvailable = (action: string) => {
    return action !== 'working' && action !== 'outside_hours';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Bonjour {employeeName} 👋
        </h2>
        <div className="text-lg text-gray-600">
          {currentTime.toLocaleTimeString('fr-FR')}
        </div>
        <div className="text-sm text-gray-500">
          {currentTime.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Planning */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📅 Votre Planning</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Début:</span>
            <span className="ml-2 text-gray-800">{workSchedule.startTime}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Fin:</span>
            <span className="ml-2 text-gray-800">{workSchedule.endTime}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-600">Jours:</span>
            <span className="ml-2 text-gray-800">
              {workSchedule.days.map(day => 
                day.charAt(0).toUpperCase() + day.slice(1)
              ).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* État actuel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🔄 État Actuel</h3>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-medium ${getActionColor(suggestedAction)}`}>
          {getActionLabel(suggestedAction)}
        </div>
      </div>

      {/* Actions disponibles */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">⚡ Actions Disponibles</h3>
        
        {isActionAvailable('arrival') && (
          <button
            onClick={() => onActionSelect('arrival')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>🚀</span>
            <span>Pointer l'arrivée</span>
          </button>
        )}

        {isActionAvailable('morning_break') && (
          <button
            onClick={() => onActionSelect('morning_break')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>🍽️</span>
            <span>Pause déjeuner</span>
          </button>
        )}

        {isActionAvailable('evening_break') && (
          <button
            onClick={() => onActionSelect('evening_break')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>☕</span>
            <span>Pause soir</span>
          </button>
        )}

        {isActionAvailable('departure') && (
          <button
            onClick={() => onActionSelect('departure')}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>🏠</span>
            <span>Fin de shift</span>
          </button>
        )}

        {!isActionAvailable(suggestedAction) && (
          <div className="text-center text-gray-500 py-4">
            Aucune action disponible pour le moment
          </div>
        )}
      </div>
    </div>
  );
}
