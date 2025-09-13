"use client";

import React, { useEffect } from 'react';
import { QrCode, Monitor, Settings, Clock, Users, BarChart3, Shield, Building2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { UserRole } from '../types';

export default function HomePage() {
  const { user, loading, hasRole } = useAuth();

  // Rediriger automatiquement si connecté
  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = getRedirectUrlForRole(user.role);
      window.location.href = redirectUrl;
    } else if (!loading && !user) {
      // Rediriger vers la landing page si pas connecté
      window.location.href = '/landing';
    }
  }, [user, loading]);

  const getRedirectUrlForRole = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.MANAGER:
        return '/manager';
      case UserRole.USER:
        return '/user';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center space-x-3">
            <Shield className="h-10 w-10 text-blue-500" />
            <span>Pointage & Planning Pro</span>
          </h1>
          <p className="text-xl text-gray-600">Système professionnel de gestion des équipes</p>
          <div className="mt-4 inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">Architecture Multi-Rôles</span>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Connexion */}
          <Link href="/login" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-green-300">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <LogIn className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Connexion</h2>
                <p className="text-gray-600 text-sm">Accédez à votre tableau de bord</p>
              </div>
            </div>
          </Link>

          {/* Administration */}
          <Link href="/admin" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Building2 className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Administration</h2>
                <p className="text-gray-600 text-sm">Gestion des organisations et utilisateurs</p>
              </div>
            </div>
          </Link>

          {/* QR Code Generator */}
          <Link href="/admin/qr-generator" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <QrCode className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Générateur QR</h2>
                <p className="text-gray-600 text-sm">Générer des QR codes pour le pointage des équipes</p>
              </div>
            </div>
          </Link>

          {/* Display Mode */}
          <Link href="/display" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Monitor className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Mode Affichage</h2>
                <p className="text-gray-600 text-sm">Écran d'affichage pour la cuisine/accueil</p>
              </div>
            </div>
          </Link>

          {/* Employee Management */}
          <Link href="/admin/employees" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Gestion Employés</h2>
                <p className="text-gray-600 text-sm">Gérer les employés et leurs plannings</p>
              </div>
            </div>
          </Link>

          {/* Reports */}
          <Link href="/admin/reports" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Rapports</h2>
                <p className="text-gray-600 text-sm">Consulter les rapports de pointage</p>
              </div>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/admin/settings" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                  <Settings className="h-8 w-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Paramètres</h2>
                <p className="text-gray-600 text-sm">Configuration du système</p>
              </div>
            </div>
          </Link>

          {/* Direct Clock */}
          <Link href="/clock/emp_1" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-blue-300">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pointage Direct</h2>
                <p className="text-gray-600 text-sm">Accès direct au pointage (test)</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📋 Instructions d'utilisation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">👨‍💼 Pour les Managers :</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Utilisez le <strong>Générateur QR</strong> pour créer des codes</li>
                <li>• Affichez le <strong>Mode Affichage</strong> sur les écrans</li>
                <li>• Gérez les employés et plannings</li>
                <li>• Consultez les rapports de pointage</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">👥 Pour les Équipes :</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Scannez le QR code affiché</li>
                <li>• Sélectionnez votre nom</li>
                <li>• Entrez votre code PIN</li>
                <li>• Prenez une photo de pointage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Système opérationnel</span>
          </div>
        </div>
      </div>
    </div>
  );
}