"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { checkShift } from '../utils/testUtils';
import { LaborWarning, ShiftFormData } from '../types';
import { validateShift, formatDuration } from '../utils/timeUtils';

interface ShiftFormProps {
  onShiftAdd: (shiftData: { start: Date; end: Date; breakMin: number; warnings: LaborWarning[] }) => void;
}

export default function ShiftForm({ onShiftAdd }: ShiftFormProps) {
  const [formData, setFormData] = useState<ShiftFormData>({
    start: new Date(),
    end: new Date(Date.now() + 8 * 60 * 60 * 1000), // +8h par défaut
    breakMin: 30
  });

  const [warnings, setWarnings] = useState<LaborWarning[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation en temps réel
  useEffect(() => {
    const validation = validateShift(formData.start, formData.end, formData.breakMin);
    setWarnings(validation.warnings);
    setIsValid(validation.isValid);
  }, [formData]);

  const handleInputChange = (field: keyof ShiftFormData, value: Date | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;

    setIsSubmitting(true);
    
    try {
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onShiftAdd({
        start: formData.start,
        end: formData.end,
        breakMin: formData.breakMin,
        warnings
      });

      // Réinitialiser le formulaire
      const now = new Date();
      setFormData({
        start: now,
        end: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        breakMin: 30
      });
      setWarnings([]);
      setIsValid(false);
      setShowSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du créneau:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    const validation = validateShift(formData.start, formData.end, formData.breakMin);
    return {
      total: validation.totalHours,
      effective: validation.effectiveHours,
      break: validation.breakHours
    };
  };

  const duration = calculateDuration();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nouveau Créneau</h2>
          <p className="text-sm text-gray-600">Ajouter un créneau de travail</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date et heure de début */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={formData.start.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(formData.start.getHours(), formData.start.getMinutes());
                handleInputChange('start', newDate);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure de début
            </label>
            <input
              type="time"
              value={formData.start.toTimeString().slice(0, 5)}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                const newDate = new Date(formData.start);
                newDate.setHours(hours, minutes);
                handleInputChange('start', newDate);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Date et heure de fin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={formData.end.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(formData.end.getHours(), formData.end.getMinutes());
                handleInputChange('end', newDate);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure de fin
            </label>
            <input
              type="time"
              value={formData.end.toTimeString().slice(0, 5)}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                const newDate = new Date(formData.end);
                newDate.setHours(hours, minutes);
                handleInputChange('end', newDate);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Durée de pause */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durée de pause (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="480"
            value={formData.breakMin}
            onChange={(e) => handleInputChange('breakMin', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Résumé de la durée */}
        {formData.start && formData.end && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Résumé du créneau</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{formatDuration(duration.total)}</div>
                <div className="text-gray-600">Durée totale</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{formatDuration(duration.effective)}</div>
                <div className="text-gray-600">Travail effectif</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{formatDuration(duration.break)}</div>
                <div className="text-gray-600">Pause</div>
              </div>
            </div>
          </div>
        )}

        {/* Avertissements */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded-md text-sm flex items-start ${
                  warning.type === 'error'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{warning.message}</div>
                  <div className="text-xs opacity-75">Code: {warning.code}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message de succès */}
        {showSuccess && (
          <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm border border-green-200 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Créneau ajouté avec succès !
          </div>
        )}

        {/* Boutons d'action rapide */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setFormData(prev => ({
                ...prev,
                start: now
              }));
            }}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Zap className="w-3 h-3 mr-1" />
            Maintenant
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              today.setHours(8, 0, 0, 0);
              const endOfDay = new Date(today);
              endOfDay.setHours(17, 0, 0, 0);
              setFormData(prev => ({
                ...prev,
                start: today,
                end: endOfDay
              }));
            }}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Clock className="w-3 h-3 mr-1" />
            8h-17h
          </button>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${
            isValid && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Ajout en cours...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le créneau
            </>
          )}
        </button>
      </form>
    </div>
  );
}