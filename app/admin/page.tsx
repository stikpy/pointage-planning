"use client";

import React, { useState, useEffect } from 'react';
import { Users, Building2, BarChart3, Settings, Clock, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { UserRole, Organization, User } from '../../types';
import { useAuth } from '../../lib/auth';

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  activeUsers: number;
  totalShifts: number;
  weeklyHours: number;
  alerts: number;
}

export default function AdminDashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    activeUsers: 0,
    totalShifts: 0,
    weeklyHours: 0,
    alerts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Vérifier les permissions
  if (!hasRole(UserRole.ADMIN) && !hasRole(UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Charger les statistiques
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Simuler le chargement des données
      // En production, appeler l'API
      setTimeout(() => {
        setStats({
          totalUsers: 156,
          totalOrganizations: 8,
          activeUsers: 142,
          totalShifts: 1247,
          weeklyHours: 2840,
          alerts: 3,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} actifs`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
    },
    {
      title: 'Organisations',
      value: stats.totalOrganizations,
      subtitle: 'Multi-tenant',
      icon: Building2,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-100',
    },
    {
      title: 'Créneaux',
      value: stats.totalShifts,
      subtitle: 'Ce mois',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100',
    },
    {
      title: 'Heures travaillées',
      value: `${stats.weeklyHours}h`,
      subtitle: 'Cette semaine',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100',
    },
  ];

  const quickActions = [
    {
      title: 'Gérer les Organisations',
      description: 'Créer et configurer les organisations',
      icon: Building2,
      href: '/admin/organizations',
      color: 'bg-blue-500 hover:bg-blue-600',
      requiresRole: UserRole.SUPER_ADMIN,
    },
    {
      title: 'Gestion des Utilisateurs',
      description: 'Créer et gérer les comptes utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600',
      requiresRole: UserRole.ADMIN,
    },
    {
      title: 'Rapports & Analytics',
      description: 'Consulter les statistiques globales',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-purple-500 hover:bg-purple-600',
      requiresRole: UserRole.ADMIN,
    },
    {
      title: 'Configuration Système',
      description: 'Paramètres et configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500 hover:bg-gray-600',
      requiresRole: UserRole.SUPER_ADMIN,
    },
  ];

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
                Tableau de Bord Administrateur
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === UserRole.SUPER_ADMIN ? 'Super Administrateur' : 'Administrateur'} • 
                {user?.profile.firstName} {user?.profile.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {stats.alerts > 0 && (
                <div className="flex items-center space-x-2 bg-red-50 text-red-800 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.alerts} alertes</span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Dernière connexion: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Jamais'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
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
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              // Vérifier les permissions
              const canAccess = action.requiresRole === UserRole.SUPER_ADMIN 
                ? hasRole(UserRole.SUPER_ADMIN)
                : hasRole(UserRole.ADMIN);

              if (!canAccess) return null;

              return (
                <a
                  key={index}
                  href={action.href}
                  className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="text-center">
                    <action.icon className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Activité récente</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nouvel utilisateur créé</p>
                  <p className="text-sm text-gray-600">Marie Dubois - Serveur</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Il y a 2 heures</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Organisation mise à jour</p>
                  <p className="text-sm text-gray-600">Restaurant Le Bistrot</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Il y a 4 heures</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Alerte système</p>
                  <p className="text-sm text-gray-600">Dépassement d'heures détecté</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Il y a 6 heures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}