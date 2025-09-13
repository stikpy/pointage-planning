"use client";

import React, { useState } from 'react';
import { List, Filter, SortAsc, Trash2, AlertCircle, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Shift, LaborWarning } from '../types';
import { formatDuration, formatDate, formatTime } from '../utils/timeUtils';

interface ShiftListProps {
  shifts: Shift[];
  onShiftDelete: (id: string) => void;
}

export default function ShiftList({ shifts, onShiftDelete }: ShiftListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'warnings'>('date');
  const [filter, setFilter] = useState<'all' | 'with-warnings' | 'today'>('all');

  const calculateDuration = (start: Date, end: Date, breakMin: number) => {
    const totalMs = end.getTime() - start.getTime();
    const totalHours = totalMs / (1000 * 60 * 60);
    const breakHours = breakMin / 60;
    const workHours = totalHours - breakHours;
    
    return {
      total: totalHours,
      work: workHours,
      break: breakHours
    };
  };

  const filteredShifts = shifts.filter(shift => {
    const today = new Date();
    const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
    const isToday = startDate.toDateString() === today.toDateString();
    
    switch (filter) {
      case 'with-warnings':
        return shift.warnings.length > 0;
      case 'today':
        return isToday;
      default:
        return true;
    }
  });

  const sortedShifts = [...filteredShifts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const startA = a.start instanceof Date ? a.start : new Date(a.start);
        const startB = b.start instanceof Date ? b.start : new Date(b.start);
        return startB.getTime() - startA.getTime();
      case 'duration':
        const startDateA = a.start instanceof Date ? a.start : new Date(a.start);
        const endDateA = a.end instanceof Date ? a.end : (a.end ? new Date(a.end) : new Date());
        const startDateB = b.start instanceof Date ? b.start : new Date(b.start);
        const endDateB = b.end instanceof Date ? b.end : (b.end ? new Date(b.end) : new Date());
        const durationA = calculateDuration(startDateA, endDateA, a.breakMin);
        const durationB = calculateDuration(startDateB, endDateB, b.breakMin);
        return durationB.work - durationA.work;
      case 'warnings':
        return b.warnings.length - a.warnings.length;
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <List className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Liste des Créneaux</h2>
            <p className="text-sm text-gray-600">{shifts.length} créneaux enregistrés</p>
          </div>
        </div>
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Filtrer:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="with-warnings">Avec avertissements</option>
            <option value="today">Aujourd'hui</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <SortAsc className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Trier par:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Date</option>
            <option value="duration">Durée</option>
            <option value="warnings">Avertissements</option>
          </select>
        </div>
      </div>

      {/* Liste des créneaux */}
      <div className="space-y-4">
        {sortedShifts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucun créneau trouvé</p>
            <p className="text-sm text-gray-400">Ajoutez votre premier créneau pour commencer</p>
          </div>
        ) : (
          sortedShifts.map((shift) => {
            const startDate = shift.start instanceof Date ? shift.start : new Date(shift.start);
            const endDate = shift.end instanceof Date ? shift.end : (shift.end ? new Date(shift.end) : new Date());
            const duration = calculateDuration(startDate, endDate, shift.breakMin);
            const hasErrors = shift.warnings.some(w => w.type === 'error');
            const hasWarnings = shift.warnings.some(w => w.type === 'warning');
            
            return (
              <div
                key={shift.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  hasErrors
                    ? 'border-red-200 bg-red-50'
                    : hasWarnings
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {formatDate(startDate)}
                      </h3>
                      {hasErrors && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Erreur
                        </span>
                      )}
                      {hasWarnings && !hasErrors && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Avertissement
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600 text-xs">Début</div>
                          <div className="font-medium">{formatTime(startDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600 text-xs">Fin</div>
                          <div className="font-medium">{formatTime(endDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-xs">⏸</span>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs">Pause</div>
                          <div className="font-medium">{formatDuration(duration.break)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs">Travail</div>
                          <div className="font-medium text-green-600">{formatDuration(duration.work)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {shift.warnings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {shift.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className={`text-xs flex items-start p-2 rounded ${
                              warning.type === 'error' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {warning.type === 'error' ? (
                              <AlertCircle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-medium">{warning.message}</div>
                              <div className="text-xs opacity-75">Code: {warning.code}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onShiftDelete(shift.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Supprimer le créneau"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}