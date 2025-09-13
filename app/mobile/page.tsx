"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  Calendar, 
  Bell, 
  Camera, 
  MapPin, 
  Wifi, 
  WifiOff,
  Battery,
  Signal,
  Menu,
  Home,
  User,
  Settings,
  LogOut,
  QrCode,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { UserRole, Shift, User as UserType } from '../../types';
import { useAuth } from '../../lib/auth';
import Link from 'next/link';

interface MobileStats {
  currentShift?: Shift;
  todayHours: number;
  weeklyHours: number;
  notifications: number;
  teamStatus: {
    present: number;
    total: number;
  };
}

export default function MobileDashboard() {
  const { user, hasRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'clock' | 'team' | 'profile'>('home');
  const [stats, setStats] = useState<MobileStats>({
    todayHours: 0,
    weeklyHours: 0,
    notifications: 0,
    teamStatus: { present: 0, total: 0 }
  });
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadMobileData();
    setupMobileFeatures();
  }, []);

  const loadMobileData = async () => {
    try {
      // Simuler le chargement des données mobiles
      setTimeout(() => {
        setStats({
          currentShift: {
            id: 'shift-1',
            employeeId: user?.id || '',
            start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
            end: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6h from now
            breakMin: 60,
            status: 'active',
            warnings: [],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          todayHours: 2.5,
          weeklyHours: 18.5,
          notifications: 3,
          teamStatus: { present: 8, total: 12 }
        });
      }, 1000);
    } catch (error) {
      console.error('Erreur chargement données mobiles:', error);
    }
  };

  const setupMobileFeatures = () => {
    // Détecter la connexion
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Détecter le niveau de batterie
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Géolocalisation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Géolocalisation refusée:', error);
        }
      );
    }
  };

  const handleQuickClock = () => {
    // Rediriger vers le pointage rapide
    window.location.href = '/mobile/clock';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {getGreeting()}, {user?.profile.firstName}
                </h1>
                <p className="text-sm text-gray-600">{user?.profile.position}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Statut de connexion */}
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              
              {/* Batterie */}
              <div className="flex items-center space-x-1">
                <Battery className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">{batteryLevel}%</span>
              </div>
              
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {stats.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-6 space-y-6">
        {/* Statut actuel */}
        {stats.currentShift && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Statut actuel</h2>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(stats.currentShift.status)}`}></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Début:</span>
                <span className="font-medium">
                  {stats.currentShift.start.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fin prévue:</span>
                <span className="font-medium">
                  {stats.currentShift.end?.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium">{stats.todayHours}h</span>
              </div>
            </div>
            
            <button
              onClick={handleQuickClock}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              {stats.currentShift.status === 'active' ? 'Pointer la sortie' : 'Pointer l\'entrée'}
            </button>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-xl font-bold text-gray-900">{stats.todayHours}h</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cette semaine</p>
                <p className="text-xl font-bold text-gray-900">{stats.weeklyHours}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Équipe */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Équipe</h2>
            <Link href="/mobile/team" className="text-blue-600 text-sm font-medium">
              Voir tout
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Présents</span>
              <span className="font-medium">
                {stats.teamStatus.present}/{stats.teamStatus.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.teamStatus.present / stats.teamStatus.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <QrCode className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium">Scanner QR</span>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Camera className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium">Planning</span>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium">Équipe</span>
            </button>
          </div>
        </div>

        {/* Localisation */}
        {location && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Localisation</p>
                <p className="text-xs text-gray-600">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode hors ligne */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Mode hors ligne</p>
                <p className="text-xs text-yellow-700">
                  Les données seront synchronisées à la reconnexion
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'clock', label: 'Pointage', icon: Clock },
            { id: 'team', label: 'Équipe', icon: Users },
            { id: 'profile', label: 'Profil', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center space-y-1 p-2 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-xl w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Pointage enregistré</p>
                  <p className="text-xs text-blue-700">Il y a 2 heures</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Pause recommandée</p>
                  <p className="text-xs text-yellow-700">Il y a 4 heures</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Nouveau membre</p>
                  <p className="text-xs text-green-700">Hier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}