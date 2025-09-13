"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Shift, User, PlanningTemplate } from '../types';
import { useAuth } from '../lib/auth';

interface PlanningCalendarProps {
  shifts: Shift[];
  users: User[];
  templates: PlanningTemplate[];
  onShiftCreate: (shift: Partial<Shift>) => void;
  onShiftUpdate: (id: string, shift: Partial<Shift>) => void;
  onShiftDelete: (id: string) => void;
  onTemplateApply: (templateId: string, date: Date) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export default function PlanningCalendar({
  shifts,
  users,
  templates,
  onShiftCreate,
  onShiftUpdate,
  onShiftDelete,
  onTemplateApply
}: PlanningCalendarProps) {
  const { user, hasPermission } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [filterUsers, setFilterUsers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // Générer les jours de la semaine
  const getWeekDays = useCallback(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Générer les heures de la journée
  const getHours = useCallback(() => {
    const hours = [];
    for (let i = 6; i <= 22; i++) {
      hours.push(i);
    }
    return hours;
  }, []);

  // Obtenir les créneaux pour une date donnée
  const getShiftsForDate = useCallback((date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start);
      return shiftDate.toDateString() === date.toDateString();
    });
  }, [shifts]);

  // Obtenir les créneaux pour une heure donnée
  const getShiftsForHour = useCallback((date: Date, hour: number) => {
    const shiftsForDate = getShiftsForDate(date);
    return shiftsForDate.filter(shift => {
      const shiftHour = new Date(shift.start).getHours();
      return shiftHour === hour;
    });
  }, [getShiftsForDate]);

  // Navigation dans le calendrier
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Gestion du drag & drop
  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetHour: number) => {
    e.preventDefault();
    
    if (!draggedShift) return;

    const newStart = new Date(targetDate);
    newStart.setHours(targetHour, 0, 0, 0);
    
    const endTime = draggedShift.end || new Date(draggedShift.start.getTime() + 8 * 60 * 60 * 1000);
    const duration = new Date(endTime).getTime() - new Date(draggedShift.start).getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onShiftUpdate(draggedShift.id, {
      start: newStart,
      end: newEnd
    });

    setDraggedShift(null);
  };

  // Créer un nouveau créneau
  const handleCreateShift = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 8, 0, 0, 0); // 8h par défaut

    const newShift: Partial<Shift> = {
      start: startTime,
      end: endTime,
      status: 'scheduled',
      breakMin: 60,
      employeeId: users[0]?.id,
      metadata: {}
    };

    onShiftCreate(newShift);
  };

  // Appliquer un template
  const handleApplyTemplate = (templateId: string, date: Date) => {
    onTemplateApply(templateId, date);
    setShowTemplateModal(false);
  };

  // Rendu du calendrier mensuel
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* En-têtes des jours */}
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Jours du mois */}
        {days.map((day, index) => {
          const shiftsForDay = getShiftsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-24 p-2 border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day, 9)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {shiftsForDay.slice(0, 3).map(shift => {
                  const user = users.find(u => u.id === shift.employeeId);
                  return (
                    <div
                      key={shift.id}
                      className={`text-xs p-1 rounded cursor-move ${
                        shift.status === 'active' ? 'bg-green-100 text-green-800' :
                        shift.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shift)}
                      onClick={() => {
                        setSelectedShift(shift);
                        setShowShiftModal(true);
                      }}
                    >
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </div>
                  );
                })}
                
                {shiftsForDay.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{shiftsForDay.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Rendu du calendrier hebdomadaire
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const hours = getHours();

    return (
      <div className="flex">
        {/* Colonne des heures */}
        <div className="w-16">
          <div className="h-12 border-b border-gray-200"></div>
          {hours.map(hour => (
            <div key={hour} className="h-12 border-b border-gray-200 text-xs text-gray-500 p-1">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Colonnes des jours */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="flex-1 border-l border-gray-200">
            {/* En-tête du jour */}
            <div className="h-12 border-b border-gray-200 p-2 text-center">
              <div className="text-sm font-semibold">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-xs text-gray-500">
                {day.getDate()}/{day.getMonth() + 1}
              </div>
            </div>

            {/* Créneaux horaires */}
            {hours.map(hour => {
              const shiftsForHour = getShiftsForHour(day, hour);
              
              return (
                <div
                  key={hour}
                  className="h-12 border-b border-gray-200 relative"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, hour)}
                  onDoubleClick={() => handleCreateShift(day, hour)}
                >
                  {shiftsForHour.map(shift => {
                    const user = users.find(u => u.id === shift.employeeId);
                    const startHour = new Date(shift.start).getHours();
                    const endHour = shift.end ? new Date(shift.end).getHours() : new Date(shift.start).getHours() + 8;
                    const height = (endHour - startHour) * 48; // 48px par heure
                    
                    return (
                      <div
                        key={shift.id}
                        className={`absolute left-1 right-1 rounded text-xs p-1 cursor-move ${
                          shift.status === 'active' ? 'bg-green-200 border-green-400' :
                          shift.status === 'completed' ? 'bg-blue-200 border-blue-400' :
                          'bg-gray-200 border-gray-400'
                        }`}
                        style={{
                          top: `${(startHour - 6) * 48}px`,
                          height: `${height}px`
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shift)}
                        onClick={() => {
                          setSelectedShift(shift);
                          setShowShiftModal(true);
                        }}
                      >
                        <div className="font-medium truncate">
                          {user?.profile?.firstName} {user?.profile?.lastName}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(shift.start).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {shift.end ? new Date(shift.end).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'En cours'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Rendu du calendrier journalier
  const renderDayView = () => {
    const hours = getHours();
    const shiftsForDay = getShiftsForDate(currentDate);

    return (
      <div className="flex">
        {/* Colonne des heures */}
        <div className="w-16">
          <div className="h-12 border-b border-gray-200"></div>
          {hours.map(hour => (
            <div key={hour} className="h-12 border-b border-gray-200 text-xs text-gray-500 p-1">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Colonne du jour */}
        <div className="flex-1 border-l border-gray-200">
          {/* En-tête du jour */}
          <div className="h-12 border-b border-gray-200 p-2 text-center">
            <div className="text-lg font-semibold">
              {currentDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>

          {/* Créneaux horaires */}
          {hours.map(hour => {
            const shiftsForHour = shiftsForDay.filter(shift => {
              const shiftHour = new Date(shift.start).getHours();
              return shiftHour === hour;
            });
            
            return (
              <div
                key={hour}
                className="h-12 border-b border-gray-200 relative"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, currentDate, hour)}
                onDoubleClick={() => handleCreateShift(currentDate, hour)}
              >
                {shiftsForHour.map(shift => {
                  const user = users.find(u => u.id === shift.employeeId);
                  
                  return (
                    <div
                      key={shift.id}
                      className={`absolute left-1 right-1 rounded text-xs p-1 cursor-move ${
                        shift.status === 'active' ? 'bg-green-200 border-green-400' :
                        shift.status === 'completed' ? 'bg-blue-200 border-blue-400' :
                        'bg-gray-200 border-gray-400'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shift)}
                      onClick={() => {
                        setSelectedShift(shift);
                        setShowShiftModal(true);
                      }}
                    >
                      <div className="font-medium truncate">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(shift.start).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {shift.end ? new Date(shift.end).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'En cours'}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* En-tête du calendrier */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Planning</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateCalendar('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateCalendar('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sélecteur de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Template
              </button>
              
              {hasPermission('shifts', 'write') && (
                <button
                  onClick={() => setShowShiftModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créneau
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtres:</span>
          </div>
          
          <select
            value={filterUsers.join(',')}
            onChange={(e) => setFilterUsers(e.target.value ? e.target.value.split(',') : [])}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Tous les employés</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.profile.firstName} {user.profile.lastName}
              </option>
            ))}
          </select>

          <select
            value={filterStatus.join(',')}
            onChange={(e) => setFilterStatus(e.target.value ? e.target.value.split(',') : [])}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="scheduled">Planifié</option>
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      {/* Corps du calendrier */}
      <div className="p-6">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Modal de création/modification de créneau */}
      {showShiftModal && (
        <ShiftModal
          shift={selectedShift}
          users={users}
          onSave={(shiftData) => {
            if (selectedShift) {
              onShiftUpdate(selectedShift.id, shiftData);
            } else {
              onShiftCreate(shiftData);
            }
            setShowShiftModal(false);
            setSelectedShift(null);
          }}
          onCancel={() => {
            setShowShiftModal(false);
            setSelectedShift(null);
          }}
        />
      )}

      {/* Modal d'application de template */}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          onApply={handleApplyTemplate}
          onCancel={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}

// Composant Modal pour les créneaux
function ShiftModal({ 
  shift, 
  users, 
  onSave, 
  onCancel 
}: { 
  shift: Shift | null; 
  users: User[]; 
  onSave: (data: Partial<Shift>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    employeeId: shift?.employeeId || '',
    start: shift?.start ? new Date(shift.start).toISOString().slice(0, 16) : '',
    end: shift?.end ? new Date(shift.end).toISOString().slice(0, 16) : '',
    breakMin: shift?.breakMin || 60,
    status: shift?.status || 'scheduled',
    notes: shift?.metadata?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      start: new Date(formData.start),
      end: formData.end ? new Date(formData.end) : undefined,
      metadata: { notes: formData.notes }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {shift ? 'Modifier le créneau' : 'Nouveau créneau'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employé
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Sélectionner un employé</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.profile.firstName} {user.profile.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Début
              </label>
              <input
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin
              </label>
              <input
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pause (minutes)
            </label>
            <input
              type="number"
              value={formData.breakMin}
              onChange={(e) => setFormData({ ...formData, breakMin: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="scheduled">Planifié</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {shift ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant Modal pour les templates
function TemplateModal({ 
  templates, 
  onApply, 
  onCancel 
}: { 
  templates: PlanningTemplate[]; 
  onApply: (templateId: string, date: Date) => void; 
  onCancel: () => void; 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate && selectedDate) {
      onApply(selectedTemplate, new Date(selectedDate));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Appliquer un template</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Sélectionner un template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Appliquer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}