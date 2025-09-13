"use client";

import React, { useState } from 'react';
import { 
  Zap, 
  Calendar, 
  Users, 
  Clock, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  Target
} from 'lucide-react';
import { User, PlanningTemplate, Shift } from '../types';
import { useAuth } from '../lib/auth';

interface AutoPlanningGeneratorProps {
  users: User[];
  templates: PlanningTemplate[];
  onPlanningGenerated: (shifts: Shift[]) => void;
}

interface GenerationRule {
  id: string;
  name: string;
  type: 'min_staff' | 'max_hours' | 'skill_match' | 'availability';
  value: any;
  weight: number; // 1-10, importance de la règle
}

interface GenerationConfig {
  startDate: Date;
  endDate: Date;
  rules: GenerationRule[];
  optimizationGoal: 'efficiency' | 'fairness' | 'cost' | 'coverage';
  maxIterations: number;
  allowOvertime: boolean;
  respectBreakRules: boolean;
}

export default function AutoPlanningGenerator({
  users,
  templates,
  onPlanningGenerated
}: AutoPlanningGeneratorProps) {
  const { user, hasPermission } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
    rules: [
      {
        id: 'min-staff-1',
        name: 'Personnel minimum par créneau',
        type: 'min_staff',
        value: 2,
        weight: 8
      },
      {
        id: 'max-hours-1',
        name: 'Heures maximum par employé',
        type: 'max_hours',
        value: 40,
        weight: 7
      },
      {
        id: 'skill-match-1',
        name: 'Correspondance des compétences',
        type: 'skill_match',
        value: true,
        weight: 6
      }
    ],
    optimizationGoal: 'efficiency',
    maxIterations: 100,
    allowOvertime: false,
    respectBreakRules: true
  });

  const handleGeneratePlanning = async () => {
    if (!hasPermission('shifts', 'write')) {
      alert('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simuler la génération automatique
      const generatedShifts = await generatePlanningWithAI(config, users, templates);
      
      setGeneratedShifts(generatedShifts);
      setShowPreview(true);
    } catch (error) {
      console.error('Erreur génération planning:', error);
      alert('Erreur lors de la génération du planning');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const generatePlanningWithAI = async (
    config: GenerationConfig, 
    users: User[], 
    templates: PlanningTemplate[]
  ): Promise<Shift[]> => {
    return new Promise((resolve) => {
      const shifts: Shift[] = [];
      const totalDays = Math.ceil((config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Simuler la progression
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simuler la génération après un délai
      setTimeout(() => {
        // Générer des créneaux pour chaque jour
        for (let day = 0; day < totalDays; day++) {
          const currentDate = new Date(config.startDate);
          currentDate.setDate(currentDate.getDate() + day);

          // Appliquer les templates disponibles
          templates.forEach(template => {
            if (template.isActive) {
              template.templateData.shifts.forEach((shiftTemplate, index) => {
                // Assigner un employé aléatoire disponible
                const availableUsers = users.filter(u => u.isActive);
                const assignedUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];

                if (assignedUser) {
                  const startTime = new Date(currentDate);
                  const [hours, minutes] = shiftTemplate.startTime.split(':').map(Number);
                  startTime.setHours(hours, minutes, 0, 0);

                  const endTime = new Date(currentDate);
                  const [endHours, endMinutes] = shiftTemplate.endTime.split(':').map(Number);
                  endTime.setHours(endHours, endMinutes, 0, 0);

                  const shift: Shift = {
                    id: `auto-shift-${day}-${index}-${Date.now()}`,
                    employeeId: assignedUser.id,
                    start: startTime,
                    end: endTime,
                    breakMin: 60,
                    status: 'scheduled',
                    warnings: [],
                    metadata: {
                      generated: true,
                      templateId: template.id,
                      position: shiftTemplate.position,
                      requiredSkills: shiftTemplate.requiredSkills,
                      generationDate: new Date().toISOString()
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };

                  shifts.push(shift);
                }
              });
            }
          });
        }

        clearInterval(interval);
        resolve(shifts);
      }, 2000);
    });
  };

  const handleApplyPlanning = () => {
    onPlanningGenerated(generatedShifts);
    setShowPreview(false);
    setGeneratedShifts([]);
  };

  const addRule = () => {
    const newRule: GenerationRule = {
      id: `rule-${Date.now()}`,
      name: 'Nouvelle règle',
      type: 'min_staff',
      value: 1,
      weight: 5
    };
    setConfig({
      ...config,
      rules: [...config.rules, newRule]
    });
  };

  const updateRule = (ruleId: string, updates: Partial<GenerationRule>) => {
    setConfig({
      ...config,
      rules: config.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    });
  };

  const removeRule = (ruleId: string) => {
    setConfig({
      ...config,
      rules: config.rules.filter(rule => rule.id !== ruleId)
    });
  };

  const getOptimizationStats = () => {
    const totalShifts = generatedShifts.length;
    const totalHours = generatedShifts.reduce((total, shift) => {
      const duration = new Date(shift.end).getTime() - new Date(shift.start).getTime();
      return total + duration / (1000 * 60 * 60);
    }, 0);
    
    const uniqueEmployees = new Set(generatedShifts.map(shift => shift.employeeId)).size;
    const avgHoursPerEmployee = totalHours / uniqueEmployees;

    return {
      totalShifts,
      totalHours: totalHours.toFixed(1),
      uniqueEmployees,
      avgHoursPerEmployee: avgHoursPerEmployee.toFixed(1)
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-500" />
              Générateur Automatique
            </h2>
            <p className="text-gray-600">IA pour optimiser vos plannings</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </button>
            
            <button
              onClick={handleGeneratePlanning}
              disabled={isGenerating || !hasPermission('shifts', 'write')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isGenerating ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Génération...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Générer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Configuration de base */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={config.startDate.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  startDate: new Date(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={config.endDate.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  endDate: new Date(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Objectif d'optimisation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objectif d'optimisation
          </label>
          <select
            value={config.optimizationGoal}
            onChange={(e) => setConfig({
              ...config,
              optimizationGoal: e.target.value as any
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="efficiency">Efficacité maximale</option>
            <option value="fairness">Équité entre employés</option>
            <option value="cost">Coût minimum</option>
            <option value="coverage">Couverture optimale</option>
          </select>
        </div>

        {/* Règles de génération */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Règles de génération</h3>
            <button
              onClick={addRule}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Ajouter une règle
            </button>
          </div>

          <div className="space-y-4">
            {config.rules.map(rule => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{rule.name}</h4>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de règle
                    </label>
                    <select
                      value={rule.type}
                      onChange={(e) => updateRule(rule.id, { type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="min_staff">Personnel minimum</option>
                      <option value="max_hours">Heures maximum</option>
                      <option value="skill_match">Correspondance compétences</option>
                      <option value="availability">Disponibilité</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valeur
                    </label>
                    <input
                      type={rule.type === 'skill_match' ? 'checkbox' : 'number'}
                      checked={rule.type === 'skill_match' ? rule.value : undefined}
                      value={rule.type !== 'skill_match' ? rule.value : undefined}
                      onChange={(e) => updateRule(rule.id, { 
                        value: rule.type === 'skill_match' ? e.target.checked : parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poids (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rule.weight}
                      onChange={(e) => updateRule(rule.id, { weight: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 text-center">{rule.weight}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options avancées */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Options avancées</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">Autoriser les heures supplémentaires</label>
                <p className="text-sm text-gray-600">Permettre aux employés de dépasser leurs heures normales</p>
              </div>
              <input
                type="checkbox"
                checked={config.allowOvertime}
                onChange={(e) => setConfig({ ...config, allowOvertime: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">Respecter les règles de pause</label>
                <p className="text-sm text-gray-600">Appliquer automatiquement les pauses obligatoires</p>
              </div>
              <input
                type="checkbox"
                checked={config.respectBreakRules}
                onChange={(e) => setConfig({ ...config, respectBreakRules: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itérations maximum
              </label>
              <input
                type="number"
                value={config.maxIterations}
                onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="10"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Progression de génération */}
        {isGenerating && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Génération en cours...</span>
              <span className="text-sm text-blue-700">{generationProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              L'IA analyse les contraintes et optimise le planning...
            </p>
          </div>
        )}

        {/* Aperçu du planning généré */}
        {showPreview && generatedShifts.length > 0 && (
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Planning généré avec succès !
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </button>
                <button
                  onClick={handleApplyPlanning}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Appliquer
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(getOptimizationStats()).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-green-800">{value}</div>
                  <div className="text-sm text-green-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé des créneaux */}
            <div className="space-y-2">
              <h4 className="font-medium text-green-900">Résumé des créneaux générés :</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {generatedShifts.slice(0, 10).map(shift => {
                  const employee = users.find(u => u.id === shift.employeeId);
                  return (
                    <div key={shift.id} className="text-sm bg-white p-2 rounded border">
                      <span className="font-medium">
                        {employee?.profile.firstName} {employee?.profile.lastName}
                      </span>
                      {' '}• {new Date(shift.start).toLocaleDateString('fr-FR')}
                      {' '}• {new Date(shift.start).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(shift.end).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  );
                })}
                {generatedShifts.length > 10 && (
                  <div className="text-sm text-green-700 text-center">
                    ... et {generatedShifts.length - 10} autres créneaux
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}