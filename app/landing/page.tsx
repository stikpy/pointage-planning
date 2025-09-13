"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  BarChart3, 
  Smartphone, 
  QrCode, 
  Building2, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Zap,
  Globe,
  Lock,
  Award,
  TrendingUp,
  Calendar,
  Camera,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Sécurité Enterprise",
      description: "Authentification multi-facteurs, chiffrement bout en bout, audit trail complet",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Gestion Multi-Rôles",
      description: "Super Admin, Admin, Manager, Employé avec permissions granulaires",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Clock,
      title: "Pointage Intelligent",
      description: "QR Codes, badges NFC, géolocalisation, photos avec horodatage",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Calendar,
      title: "Planning Avancé",
      description: "Templates réutilisables, génération automatique, workflow d'approbation",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: BarChart3,
      title: "Analytics Temps Réel",
      description: "Tableaux de bord interactifs, prédictions IA, optimisation automatique",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "PWA native, notifications push, mode hors ligne, interface adaptative",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const stats = [
    { number: "99.9%", label: "Disponibilité" },
    { number: "< 2s", label: "Temps de réponse" },
    { number: "95%+", label: "Compatibilité mobile" },
    { number: "0", label: "Faille de sécurité" }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Directrice RH, Restaurant Le Bistrot",
      content: "Cette solution a révolutionné notre gestion des équipes. Plus de 30% de gain de temps sur la planification !",
      rating: 5,
      avatar: "👩‍💼"
    },
    {
      name: "Jean Martin",
      role: "Chef de Cuisine",
      content: "Le pointage par NFC est génial ! Plus besoin de chercher les QR codes, un simple badge et c'est fait.",
      rating: 5,
      avatar: "👨‍🍳"
    },
    {
      name: "Sophie Laurent",
      role: "Manager Service",
      content: "Les tableaux de bord temps réel nous permettent de réagir instantanément aux besoins de l'équipe.",
      rating: 5,
      avatar: "👩‍💻"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "29€",
      period: "/mois",
      description: "Parfait pour les petites équipes",
      features: [
        "Jusqu'à 10 employés",
        "Pointage QR + NFC",
        "Planning basique",
        "Support email",
        "Stockage 1GB"
      ],
      color: "border-gray-200",
      buttonColor: "bg-gray-600 hover:bg-gray-700"
    },
    {
      name: "Professional",
      price: "79€",
      period: "/mois",
      description: "Pour les entreprises en croissance",
      features: [
        "Jusqu'à 50 employés",
        "Multi-organisations",
        "Planning avancé",
        "Analytics temps réel",
        "Support prioritaire",
        "Stockage 10GB"
      ],
      color: "border-blue-500",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Sur mesure",
      period: "",
      description: "Solution complète sur mesure",
      features: [
        "Employés illimités",
        "Multi-tenant complet",
        "API personnalisée",
        "Intégrations avancées",
        "Support dédié",
        "Stockage illimité"
      ],
      color: "border-purple-500",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Pointage Pro</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Fonctionnalités</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Tarifs</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Témoignages</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Connexion
              </Link>
              <Link 
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Gestion d'équipes
                <span className="text-blue-600 block">nouvelle génération</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Plateforme professionnelle de pointage et planning avec système multi-rôles, 
                badges NFC, analytics temps réel et interface mobile optimisée.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/login"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  Voir la démo
                  <Camera className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités professionnelles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une solution complète pour moderniser la gestion de vos équipes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Technologies de pointe
            </h2>
            <p className="text-xl text-gray-600">
              Construit avec les dernières technologies pour une performance optimale
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Next.js 14", icon: "⚡", desc: "Framework React moderne" },
              { name: "Supabase", icon: "🗄️", desc: "Backend as a Service" },
              { name: "TypeScript", icon: "🔒", desc: "Sécurité des types" },
              { name: "PWA", icon: "📱", desc: "Application native" }
            ].map((tech, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-4">{tech.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{tech.name}</h3>
                <p className="text-gray-600 text-sm">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les retours de nos clients satisfaits
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tarifs transparents
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white p-8 rounded-xl shadow-lg border-2 ${plan.color} ${plan.popular ? 'transform scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Le plus populaire
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors ${plan.buttonColor}`}>
                  {plan.name === 'Enterprise' ? 'Nous contacter' : 'Commencer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à moderniser votre gestion d'équipes ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines d'entreprises qui font confiance à Pointage Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Essayer gratuitement
            </Link>
            <button className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Demander une démo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">Pointage Pro</span>
              </div>
              <p className="text-gray-400">
                La solution professionnelle de gestion d'équipes nouvelle génération.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Intégrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Statut</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">Conditions</a></li>
                <li><a href="#" className="hover:text-white">Sécurité</a></li>
                <li><a href="#" className="hover:text-white">RGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Pointage Pro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}