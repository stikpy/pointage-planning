"use client";

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Calendar, 
  Users, 
  Clock,
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Shift, User, PlanningTemplate } from '../types';
import { useAuth } from '../lib/auth';

interface PlanningExporterProps {
  shifts: Shift[];
  users: User[];
  templates: PlanningTemplate[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv';
  includeDetails: boolean;
  includePhotos: boolean;
  includeBreakdown: boolean;
  groupBy: 'employee' | 'date' | 'position' | 'none';
  filters: {
    employees: string[];
    status: string[];
    positions: string[];
  };
}

export default function PlanningExporter({
  shifts,
  users,
  templates,
  dateRange
}: PlanningExporterProps) {
  const { user, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'pdf',
    includeDetails: true,
    includePhotos: false,
    includeBreakdown: true,
    groupBy: 'employee',
    filters: {
      employees: [],
      status: [],
      positions: []
    }
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!hasPermission('reports', 'read')) {
      alert('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    setIsExporting(true);
    
    try {
      switch (exportConfig.format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
      setShowModal(false);
    }
  };

  const exportToPDF = async () => {
    // Simuler l'export PDF
    const filteredShifts = getFilteredShifts();
    const reportData = generateReportData(filteredShifts);
    
    // Créer un blob PDF simulé
    const pdfContent = generatePDFContent(reportData);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    
    // Télécharger le fichier
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    // Simuler l'export Excel
    const filteredShifts = getFilteredShifts();
    const csvContent = generateCSVContent(filteredShifts);
    
    // Convertir en Excel (simulation)
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    const filteredShifts = getFilteredShifts();
    const csvContent = generateCSVContent(filteredShifts);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredShifts = () => {
    return shifts.filter(shift => {
      // Filtrer par employé
      if (exportConfig.filters.employees.length > 0 && 
          !exportConfig.filters.employees.includes(shift.employeeId)) {
        return false;
      }
      
      // Filtrer par statut
      if (exportConfig.filters.status.length > 0 && 
          !exportConfig.filters.status.includes(shift.status)) {
        return false;
      }
      
      // Filtrer par position
      if (exportConfig.filters.positions.length > 0 && 
          !exportConfig.filters.positions.includes(shift.metadata?.position || '')) {
        return false;
      }
      
      return true;
    });
  };

  const generateReportData = (filteredShifts: Shift[]) => {
    const totalShifts = filteredShifts.length;
    const totalHours = filteredShifts.reduce((total, shift) => {
      const duration = new Date(shift.end).getTime() - new Date(shift.start).getTime();
      return total + duration / (1000 * 60 * 60);
    }, 0);
    
    const uniqueEmployees = new Set(filteredShifts.map(shift => shift.employeeId)).size;
    
    return {
      summary: {
        totalShifts,
        totalHours: totalHours.toFixed(1),
        uniqueEmployees,
        dateRange: `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
      },
      shifts: filteredShifts.map(shift => {
        const employee = users.find(u => u.id === shift.employeeId);
        return {
          employee: employee ? `${employee.profile.firstName} ${employee.profile.lastName}` : 'Inconnu',
          position: employee?.profile.position || '',
          date: formatDate(new Date(shift.start)),
          startTime: formatTime(new Date(shift.start)),
          endTime: formatTime(new Date(shift.end)),
          duration: ((new Date(shift.end).getTime() - new Date(shift.start).getTime()) / (1000 * 60 * 60)).toFixed(1),
          status: shift.status,
          breakMin: shift.breakMin
        };
      })
    };
  };

  const generatePDFContent = (reportData: any) => {
    // Simulation du contenu PDF
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(Rapport de Planning) Tj
0 -20 Td
(Période: ${reportData.summary.dateRange}) Tj
0 -20 Td
(Total créneaux: ${reportData.summary.totalShifts}) Tj
0 -20 Td
(Total heures: ${reportData.summary.totalHours}h) Tj
0 -20 Td
(Employés: ${reportData.summary.uniqueEmployees}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
453
%%EOF
    `;
  };

  const generateCSVContent = (filteredShifts: Shift[]) => {
    const headers = [
      'Employé',
      'Poste',
      'Date',
      'Heure début',
      'Heure fin',
      'Durée (h)',
      'Pause (min)',
      'Statut'
    ];
    
    const rows = filteredShifts.map(shift => {
      const employee = users.find(u => u.id === shift.employeeId);
      const duration = (new Date(shift.end).getTime() - new Date(shift.start).getTime()) / (1000 * 60 * 60);
      
      return [
        employee ? `${employee.profile.firstName} ${employee.profile.lastName}` : 'Inconnu',
        employee?.profile.position || '',
        formatDate(new Date(shift.start)),
        formatTime(new Date(shift.start)),
        formatTime(new Date(shift.end)),
        duration.toFixed(1),
        shift.breakMin.toString(),
        shift.status
      ];
    });
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getExportStats = () => {
    const filteredShifts = getFilteredShifts();
    return {
      totalShifts: filteredShifts.length,
      totalHours: filteredShifts.reduce((total, shift) => {
        const duration = new Date(shift.end).getTime() - new Date(shift.start).getTime();
        return total + duration / (1000 * 60 * 60);
      }, 0).toFixed(1),
      uniqueEmployees: new Set(filteredShifts.map(shift => shift.employeeId)).size
    };
  };

  return (
    <>
      {/* Bouton d'export */}
      <button
        onClick={() => setShowModal(true)}
        disabled={!hasPermission('reports', 'read')}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Exporter
      </button>

      {/* Modal d'export */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Exporter le planning
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Format d'export */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Format d'export
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'pdf', label: 'PDF', icon: FileText, desc: 'Rapport formaté' },
                    { id: 'excel', label: 'Excel', icon: Table, desc: 'Tableur' },
                    { id: 'csv', label: 'CSV', icon: Table, desc: 'Données brutes' }
                  ].map(format => (
                    <button
                      key={format.id}
                      onClick={() => setExportConfig({ ...exportConfig, format: format.id as any })}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        exportConfig.format === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <format.icon className="w-6 h-6 mb-2" />
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-gray-600">{format.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options d'inclusion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Options d'inclusion
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeDetails}
                      onChange={(e) => setExportConfig({ 
                        ...exportConfig, 
                        includeDetails: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <span>Détails des créneaux</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.includePhotos}
                      onChange={(e) => setExportConfig({ 
                        ...exportConfig, 
                        includePhotos: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <span>Photos de pointage</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeBreakdown}
                      onChange={(e) => setExportConfig({ 
                        ...exportConfig, 
                        includeBreakdown: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <span>Répartition par employé</span>
                  </label>
                </div>
              </div>

              {/* Groupement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groupement
                </label>
                <select
                  value={exportConfig.groupBy}
                  onChange={(e) => setExportConfig({ 
                    ...exportConfig, 
                    groupBy: e.target.value as any 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="none">Aucun groupement</option>
                  <option value="employee">Par employé</option>
                  <option value="date">Par date</option>
                  <option value="position">Par poste</option>
                </select>
              </div>

              {/* Filtres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Filtres
                </label>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Employés</label>
                    <select
                      multiple
                      value={exportConfig.filters.employees}
                      onChange={(e) => setExportConfig({
                        ...exportConfig,
                        filters: {
                          ...exportConfig.filters,
                          employees: Array.from(e.target.selectedOptions, option => option.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.profile.firstName} {user.profile.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Statuts</label>
                    <select
                      multiple
                      value={exportConfig.filters.status}
                      onChange={(e) => setExportConfig({
                        ...exportConfig,
                        filters: {
                          ...exportConfig.filters,
                          status: Array.from(e.target.selectedOptions, option => option.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="scheduled">Planifié</option>
                      <option value="active">Actif</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Aperçu de l'export</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{getExportStats().totalShifts}</div>
                    <div className="text-gray-600">Créneaux</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{getExportStats().totalHours}h</div>
                    <div className="text-gray-600">Total heures</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{getExportStats().uniqueEmployees}</div>
                    <div className="text-gray-600">Employés</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}