"use client";

import React from 'react';
import { Users, Clock, TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Shift, Employee, DashboardStats } from '../types';
import { calculateDashboardStats, formatDuration } from '../utils/timeUtils';

interface DashboardProps {
  shifts: Shift[];
  employees?: Employee[];
  todayShifts?: Shift[];
  weeklyHours?: number;
  presentEmployees?: number;
  onNavigateToQR?: () => void;
}

export default function Dashboard({ 
  shifts, 
  employees = [], 
  todayShifts = [],
  weeklyHours = 0,
  presentEmployees = 0,
  onNavigateToQR
}: DashboardProps) {
  const stats = calculateDashboardStats(shifts);
  const activeEmployees = employees.filter(emp => emp.isActive).length;

  const dashboardStats = [
    {
      title: 'Créneaux',
      value: stats.totalShifts.toString(),
      subtitle: 'Total enregistrés',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100'
    },
    {
      title: 'Heures travaillées',
      value: formatDuration(stats.totalHours),
      subtitle: 'Temps effectif',
      icon: Clock,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-100'
    },
    {
      title: 'Moyenne/créneau',
      value: formatDuration(stats.averageHoursPerShift),
      subtitle: 'Par session',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100'
    },
    {
      title: 'Avertissements',
      value: stats.warningsCount.toString(),
      subtitle: `${stats.blockingWarnings} bloquants, ${stats.warningsCount - stats.blockingWarnings} alertes`,
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-600">Vue d'ensemble des créneaux et statistiques</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Données en temps réel</span>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
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

      {/* Section Cette semaine */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cette semaine</h3>
            <p className="text-sm text-gray-600">Progression des objectifs hebdomadaires</p>
          </div>
          <div className="text-2xl">📈</div>
        </div>
        
        <div className="space-y-6">
          {/* Heures travaillées */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">Heures travaillées</span>
              <span className="font-bold text-gray-900">{formatDuration(stats.weeklyHours)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats.weeklyHours / 40) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Objectif: 40h/semaine • {Math.round((stats.weeklyHours / 40) * 100)}% atteint
            </div>
          </div>

          {/* Employés présents */}
          {employees.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Employés présents</span>
                <span className="font-bold text-gray-900">{presentEmployees}/{activeEmployees}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${activeEmployees > 0 ? (presentEmployees / activeEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {activeEmployees > 0 ? Math.round((presentEmployees / activeEmployees) * 100) : 0}% de l'équipe présente
              </div>
            </div>
          )}

          {/* Créneaux aujourd'hui */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">Créneaux aujourd'hui</span>
              <span className="font-bold text-gray-900">{stats.todayShifts}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats.todayShifts / 10) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Moyenne quotidienne: {Math.round(stats.todayShifts)} créneaux
            </div>
          </div>
        </div>
      </div>

      {/* Bouton QR Codes */}
      {onNavigateToQR && (
        <div className="mt-6 text-center">
          <button
            onClick={onNavigateToQR}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Gérer les QR Codes
          </button>
        </div>
      )}
    </div>
  );
}