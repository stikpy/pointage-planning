"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Filter,
  Download,
  Settings,
  BarChart3,
  UserCheck,
  UserX,
  Timer
} from 'lucide-react';
import { UserRole, User, Shift, PlanningTemplate } from '../../types';
import { useAuth } from '../../lib/auth';
import PlanningCalendar from '../../components/PlanningCalendar';
import PlanningTemplateManager from '../../components/PlanningTemplateManager';

interface ManagerStats {
  totalTeamMembers: number;
  activeShifts: number;
  completedShifts: number;
  pendingApprovals: number;
  weeklyHours: number;
  teamEfficiency: number;
}

export default function ManagerDashboard() {
  const { user, hasRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planning' | 'templates' | 'team'>('dashboard');
  const [stats, setStats] = useState<ManagerStats>({
    totalTeamMembers: 0,
    activeShifts: 0,
    completedShifts: 0,
    pendingApprovals: 0,
    weeklyHours: 0,
    teamEfficiency: 0
  });
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier les permissions
  if (!hasRole(UserRole.MANAGER) && !hasRole(UserRole.ADMIN) && !hasRole(UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      // Simuler le chargement des données
      // En production, appeler l'API
      setTimeout(() => {
        setStats({
          totalTeamMembers: 8,
          activeShifts: 3,
          completedShifts: 12,
          pendingApprovals: 2,
          weeklyHours: 156,
          teamEfficiency: 87
        });

        // Simuler les membres de l'équipe
        setTeamMembers([
          {
            id: 'user-1',
            email: 'jean@lebistrot.com',
            role: UserRole.USER,
            organizationId: 'org-1',
            departmentId: 'dept-1',
            teamId: 'team-1',
            profile: {
              firstName: 'Jean',
              lastName: 'Martin',
              position: 'Serveur',
              phone: '+33123456789'
            },
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'user-2',
            email: 'sophie@lebistrot.com',
            role: UserRole.USER,
            organizationId: 'org-1',
            departmentId: 'dept-1',
            teamId: 'team-1',
            profile: {
              firstName: 'Sophie',
              lastName: 'Laurent',
              position: 'Cuisinière',
              phone: '+33987654321'
            },
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        // Simuler les créneaux
        setShifts([
          {
            id: 'shift-1',
            employeeId: 'user-1',
            start: new Date(2024, 11, 18, 9, 0),
            end: new Date(2024, 11, 18, 17, 0),
            breakMin: 60,
            status: 'active',
            warnings: [],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        // Simuler les templates
        setTemplates([
          {
            id: 'template-1',
            organizationId: 'org-1',
            name: 'Planning Standard Cuisine',
            templateData: {
              shifts: [
                {
                  startTime: '08:00',
                  endTime: '16:00',
                  position: 'Chef de Cuisine',
                  requiredSkills: ['cuisine'],
                  minExperience: 2
                }
              ],
              rules: {
                minStaff: 2,
                maxConsecutiveHours: 8,
                breakRequirements: [
                  {
                    minDuration: 30,
                    maxDuration: 60,
                    frequency: 4
                  }
                ]
              }
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur chargement données manager:', error);
      setLoading(false);
    }
  };

  const handleShiftCreate = (shiftData: Partial<Shift>) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      employeeId: shiftData.employeeId || '',
      start: shiftData.start || new Date(),
      end: shiftData.end || new Date(),
      breakMin: shiftData.breakMin || 60,
      status: shiftData.status || 'scheduled',
      warnings: [],
      metadata: shiftData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setShifts([...shifts, newShift]);
  };

  const handleShiftUpdate = (id: string, shiftData: Partial<Shift>) => {
    setShifts(shifts.map(shift => 
      shift.id === id ? { ...shift, ...shiftData, updatedAt: new Date() } : shift
    ));
  };

  const handleShiftDelete = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
  };

  const handleTemplateCreate = (templateData: Partial<PlanningTemplate>) => {
    const newTemplate: PlanningTemplate = {
      id: `template-${Date.now()}`,
      organizationId: user?.organizationId || '',
      name: templateData.name || '',
      templateData: templateData.templateData || { shifts: [], rules: { minStaff: 1, maxConsecutiveHours: 8, breakRequirements: [] } },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleTemplateUpdate = (id: string, templateData: Partial<PlanningTemplate>) => {
    setTemplates(templates.map(template => 
      template.id === id ? { ...template, ...templateData, updatedAt: new Date() } : template
    ));
  };

  const handleTemplateDelete = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id));
  };

  const handleTemplateDuplicate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      const duplicatedTemplate: PlanningTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copie)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTemplates([...templates, duplicatedTemplate]);
    }
  };

  const handleTemplateApply = (templateId: string, date: Date) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Appliquer le template à la date donnée
      template.templateData.shifts.forEach((shiftTemplate, index) => {
        const startTime = new Date(date);
        const [hours, minutes] = shiftTemplate.startTime.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(date);
        const [endHours, endMinutes] = shiftTemplate.endTime.split(':').map(Number);
        endTime.setHours(endHours, endMinutes, 0, 0);

        const newShift: Shift = {
          id: `shift-${Date.now()}-${index}`,
          employeeId: '', // À assigner manuellement
          start: startTime,
          end: endTime,
          breakMin: 60,
          status: 'scheduled',
          warnings: [],
          metadata: { 
            templateId,
            position: shiftTemplate.position,
            requiredSkills: shiftTemplate.requiredSkills
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setShifts([...shifts, newShift]);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord Manager
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.profile.firstName} {user?.profile.lastName} • 
                Gestion d'équipe et planning
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Dernière connexion: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Jamais'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
              { id: 'planning', label: 'Planning', icon: Calendar },
              { id: 'templates', label: 'Templates', icon: Settings },
              { id: 'team', label: 'Équipe', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Membres équipe',
                  value: stats.totalTeamMembers.toString(),
                  subtitle: 'Total actifs',
                  icon: Users,
                  color: 'from-blue-500 to-blue-600',
                  textColor: 'text-blue-100'
                },
                {
                  title: 'Créneaux actifs',
                  value: stats.activeShifts.toString(),
                  subtitle: 'En cours',
                  icon: Clock,
                  color: 'from-green-500 to-green-600',
                  textColor: 'text-green-100'
                },
                {
                  title: 'Heures semaine',
                  value: `${stats.weeklyHours}h`,
                  subtitle: 'Temps travaillé',
                  icon: TrendingUp,
                  color: 'from-purple-500 to-purple-600',
                  textColor: 'text-purple-100'
                },
                {
                  title: 'Efficacité',
                  value: `${stats.teamEfficiency}%`,
                  subtitle: 'Performance équipe',
                  icon: CheckCircle,
                  color: 'from-orange-500 to-orange-600',
                  textColor: 'text-orange-100'
                }
              ].map((stat, index) => (
                <div key={index} className={`bg-gradient-to-br ${stat.color} p-6 rounded-xl shadow-lg text-white relative overflow-hidden hover:shadow-xl transition-shadow duration-300`}>
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
                    <stat.icon className="w-10 h-10" />
                  </div>
                  <div className="relative z-10">
                    <h3 className={`text-sm font-medium ${stat.textColor} mb-1`}>{stat.title}</h3>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className={`text-xs ${stat.textColor}`}>{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('planning')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Créer un planning</h4>
                  <p className="text-sm text-gray-600">Planifier les créneaux de l'équipe</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('templates')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Settings className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Gérer les templates</h4>
                  <p className="text-sm text-gray-600">Créer et modifier les modèles</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('team')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Users className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Gérer l'équipe</h4>
                  <p className="text-sm text-gray-600">Voir et modifier les membres</p>
                </button>
              </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Nouveau créneau créé</p>
                      <p className="text-sm text-gray-600">Jean Martin - 9h00-17h00</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Il y a 2 heures</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Template appliqué</p>
                      <p className="text-sm text-gray-600">Planning Standard Cuisine</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Il y a 4 heures</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <PlanningCalendar
            shifts={shifts}
            users={teamMembers}
            templates={templates}
            onShiftCreate={handleShiftCreate}
            onShiftUpdate={handleShiftUpdate}
            onShiftDelete={handleShiftDelete}
            onTemplateApply={handleTemplateApply}
          />
        )}

        {activeTab === 'templates' && (
          <PlanningTemplateManager
            templates={templates}
            onTemplateCreate={handleTemplateCreate}
            onTemplateUpdate={handleTemplateUpdate}
            onTemplateDelete={handleTemplateDelete}
            onTemplateDuplicate={handleTemplateDuplicate}
          />
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Membres de l'équipe</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un membre
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {member.profile.firstName[0]}{member.profile.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.profile.firstName} {member.profile.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{member.profile.position}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        member.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {member.email}
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {member.profile.phone}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                        Modifier
                      </button>
                      <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        Planning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}