"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  Clock, 
  Users, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { PlanningTemplate, ShiftTemplate, BreakRule } from '../types';
import { useAuth } from '../lib/auth';

interface PlanningTemplateManagerProps {
  templates: PlanningTemplate[];
  onTemplateCreate: (template: Partial<PlanningTemplate>) => void;
  onTemplateUpdate: (id: string, template: Partial<PlanningTemplate>) => void;
  onTemplateDelete: (id: string) => void;
  onTemplateDuplicate: (id: string) => void;
}

export default function PlanningTemplateManager({
  templates,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateDuplicate
}: PlanningTemplateManagerProps) {
  const { user, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shifts: [] as ShiftTemplate[],
    rules: {
      minStaff: 1,
      maxConsecutiveHours: 8,
      breakRequirements: [] as BreakRule[]
    }
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      shifts: [],
      rules: {
        minStaff: 1,
        maxConsecutiveHours: 8,
        breakRequirements: []
      }
    });
    setShowModal(true);
  };

  const handleEditTemplate = (template: PlanningTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      shifts: template.templateData.shifts,
      rules: template.templateData.rules
    });
    setShowModal(true);
  };

  const handleSaveTemplate = () => {
    const templateData = {
      name: formData.name,
      templateData: {
        shifts: formData.shifts,
        rules: formData.rules
      },
      isActive: true
    };

    if (editingTemplate) {
      onTemplateUpdate(editingTemplate.id, templateData);
    } else {
      onTemplateCreate(templateData);
    }

    setShowModal(false);
    setEditingTemplate(null);
  };

  const addShift = () => {
    const newShift: ShiftTemplate = {
      startTime: '09:00',
      endTime: '17:00',
      position: '',
      requiredSkills: [],
      minExperience: 0
    };
    setFormData({
      ...formData,
      shifts: [...formData.shifts, newShift]
    });
  };

  const updateShift = (index: number, shift: ShiftTemplate) => {
    const updatedShifts = [...formData.shifts];
    updatedShifts[index] = shift;
    setFormData({
      ...formData,
      shifts: updatedShifts
    });
  };

  const removeShift = (index: number) => {
    const updatedShifts = formData.shifts.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      shifts: updatedShifts
    });
  };

  const addBreakRule = () => {
    const newRule: BreakRule = {
      minDuration: 30,
      maxDuration: 60,
      frequency: 4
    };
    setFormData({
      ...formData,
      rules: {
        ...formData.rules,
        breakRequirements: [...formData.rules.breakRequirements, newRule]
      }
    });
  };

  const updateBreakRule = (index: number, rule: BreakRule) => {
    const updatedRules = [...formData.rules.breakRequirements];
    updatedRules[index] = rule;
    setFormData({
      ...formData,
      rules: {
        ...formData.rules,
        breakRequirements: updatedRules
      }
    });
  };

  const removeBreakRule = (index: number) => {
    const updatedRules = formData.rules.breakRequirements.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      rules: {
        ...formData.rules,
        breakRequirements: updatedRules
      }
    });
  };

  const calculateTotalHours = () => {
    return formData.shifts.reduce((total, shift) => {
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Templates de Planning</h2>
            <p className="text-gray-600">Gérez vos modèles de planning réutilisables</p>
          </div>
          
          {hasPermission('shifts', 'write') && (
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Template
            </button>
          )}
        </div>
      </div>

      {/* Liste des templates */}
      <div className="p-6">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun template</h3>
            <p className="text-gray-600 mb-4">Créez votre premier template de planning</p>
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer un template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {template.templateData.shifts.length} créneaux
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {template.templateData.shifts.reduce((total, shift) => {
                          const start = new Date(`2000-01-01T${shift.startTime}`);
                          const end = new Date(`2000-01-01T${shift.endTime}`);
                          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        }, 0).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                  
                  <div className={`w-3 h-3 rounded-full ${
                    template.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>

                {/* Règles du template */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Règles:</div>
                  <div className="space-y-1">
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Min. {template.templateData.rules.minStaff} employé(s)
                    </div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Max. {template.templateData.rules.maxConsecutiveHours}h consécutives
                    </div>
                    {template.templateData.rules.breakRequirements.length > 0 && (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {template.templateData.rules.breakRequirements.length} règle(s) de pause
                      </div>
                    )}
                  </div>
                </div>

                {/* Créneaux */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Créneaux:</div>
                  <div className="space-y-1">
                    {template.templateData.shifts.slice(0, 3).map((shift, index) => (
                      <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                        {shift.startTime} - {shift.endTime} • {shift.position}
                      </div>
                    ))}
                    {template.templateData.shifts.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{template.templateData.shifts.length - 3} autres...
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => onTemplateDuplicate(template.id)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onTemplateDelete(template.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <TemplateModal
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveTemplate}
          onCancel={() => setShowModal(false)}
          onAddShift={addShift}
          onUpdateShift={updateShift}
          onRemoveShift={removeShift}
          onAddBreakRule={addBreakRule}
          onUpdateBreakRule={updateBreakRule}
          onRemoveBreakRule={removeBreakRule}
          totalHours={calculateTotalHours()}
        />
      )}
    </div>
  );
}

// Composant Modal pour l'édition de template
function TemplateModal({
  formData,
  setFormData,
  onSave,
  onCancel,
  onAddShift,
  onUpdateShift,
  onRemoveShift,
  onAddBreakRule,
  onUpdateBreakRule,
  onRemoveBreakRule,
  totalHours
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddShift: () => void;
  onUpdateShift: (index: number, shift: ShiftTemplate) => void;
  onRemoveShift: (index: number) => void;
  onAddBreakRule: () => void;
  onUpdateBreakRule: (index: number, rule: BreakRule) => void;
  onRemoveBreakRule: (index: number) => void;
  totalHours: number;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Template de Planning</h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du template
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: Planning Standard Cuisine"
            />
          </div>

          {/* Règles générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personnel minimum
              </label>
              <input
                type="number"
                value={formData.rules.minStaff}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, minStaff: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heures consécutives max
              </label>
              <input
                type="number"
                value={formData.rules.maxConsecutiveHours}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, maxConsecutiveHours: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="12"
              />
            </div>
          </div>

          {/* Créneaux */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Créneaux</h4>
              <button
                onClick={onAddShift}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un créneau
              </button>
            </div>

            <div className="space-y-4">
              {formData.shifts.map((shift: ShiftTemplate, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium">Créneau {index + 1}</h5>
                    <button
                      onClick={() => onRemoveShift(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Début
                      </label>
                      <input
                        type="time"
                        value={shift.startTime}
                        onChange={(e) => onUpdateShift(index, { ...shift, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fin
                      </label>
                      <input
                        type="time"
                        value={shift.endTime}
                        onChange={(e) => onUpdateShift(index, { ...shift, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poste
                      </label>
                      <input
                        type="text"
                        value={shift.position}
                        onChange={(e) => onUpdateShift(index, { ...shift, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Ex: Chef de Cuisine"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expérience min (années)
                      </label>
                      <input
                        type="number"
                        value={shift.minExperience}
                        onChange={(e) => onUpdateShift(index, { ...shift, minExperience: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compétences requises
                    </label>
                    <input
                      type="text"
                      value={shift.requiredSkills.join(', ')}
                      onChange={(e) => onUpdateShift(index, { 
                        ...shift, 
                        requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ex: cuisine, service, bar"
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.shifts.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Total: {totalHours.toFixed(1)} heures
                  </span>
                  <span className="text-sm text-blue-700">
                    {formData.shifts.length} créneau(s)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Règles de pause */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Règles de pause</h4>
              <button
                onClick={onAddBreakRule}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une règle
              </button>
            </div>

            <div className="space-y-4">
              {formData.rules.breakRequirements.map((rule: BreakRule, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium">Règle de pause {index + 1}</h5>
                    <button
                      onClick={() => onRemoveBreakRule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée min (min)
                      </label>
                      <input
                        type="number"
                        value={rule.minDuration}
                        onChange={(e) => onUpdateBreakRule(index, { 
                          ...rule, 
                          minDuration: parseInt(e.target.value) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée max (min)
                      </label>
                      <input
                        type="number"
                        value={rule.maxDuration}
                        onChange={(e) => onUpdateBreakRule(index, { 
                          ...rule, 
                          maxDuration: parseInt(e.target.value) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fréquence (heures)
                      </label>
                      <input
                        type="number"
                        value={rule.frequency}
                        onChange={(e) => onUpdateBreakRule(index, { 
                          ...rule, 
                          frequency: parseInt(e.target.value) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}