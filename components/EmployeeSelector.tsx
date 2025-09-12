"use client";

import React from 'react';
import { User, Shield, Search } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
}

export default function EmployeeSelector({
  employees,
  selectedEmployee,
  onSelectEmployee
}: EmployeeSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredEmployees = employees.filter(employee =>
    employee.isActive && 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeSelect = (employee: Employee) => {
    onSelectEmployee(employee);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sélectionner un employé
        </h2>
        <p className="text-gray-600">
          Choisissez votre profil pour accéder au système
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Liste des employés */}
      <div className="space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucun employé trouvé</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleEmployeeSelect(employee)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                selectedEmployee?.id === employee.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  employee.role === 'manager'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {employee.role === 'manager' ? (
                    <Shield className="w-6 h-6" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.name}
                    </h3>
                    {employee.role === 'manager' && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Manager
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-xs text-gray-500">{employee.email}</p>
                </div>
                
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          💡 <strong>Astuce :</strong> Les managers ont accès au tableau de bord complet, 
          tandis que les employés peuvent gérer leurs créneaux personnels.
        </p>
      </div>
    </div>
  );
}
