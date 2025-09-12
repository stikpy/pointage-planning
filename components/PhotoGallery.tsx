"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Download, Calendar, User, Clock, Search, Filter } from 'lucide-react';

interface ClockPhoto {
  id: string;
  employeeId: string;
  employeeName: string;
  photoData: string;
  timestamp: Date;
  clockType: 'in' | 'out';
  shiftId?: string;
}

interface PhotoGalleryProps {
  photos: ClockPhoto[];
  onDownloadPhoto: (photo: ClockPhoto) => void;
}

export default function PhotoGallery({ photos, onDownloadPhoto }: PhotoGalleryProps) {
  const [filteredPhotos, setFilteredPhotos] = useState<ClockPhoto[]>(photos);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<ClockPhoto | null>(null);

  useEffect(() => {
    let filtered = photos;

    // Filtre par nom d'employé
    if (searchTerm) {
      filtered = filtered.filter(photo =>
        photo.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type de pointage
    if (filterType !== 'all') {
      filtered = filtered.filter(photo => photo.clockType === filterType);
    }

    // Filtre par date
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter(photo => {
        const photoDate = new Date(photo.timestamp);
        return photoDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredPhotos(filtered);
  }, [photos, searchTerm, filterType, filterDate]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClockTypeColor = (type: 'in' | 'out') => {
    return type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getClockTypeIcon = (type: 'in' | 'out') => {
    return type === 'in' ? '🟢' : '🔴';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Camera className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Galerie de photos de pointage</h2>
        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
          {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'in' | 'out')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les pointages</option>
            <option value="in">Entrées uniquement</option>
            <option value="out">Sorties uniquement</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grille de photos */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune photo trouvée</h3>
          <p className="text-gray-500">Ajustez vos filtres pour voir les photos de pointage</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={photo.photoData}
                  alt={`Pointage ${photo.employeeName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClockTypeColor(photo.clockType)}`}>
                    {getClockTypeIcon(photo.clockType)} {photo.clockType === 'in' ? 'Entrée' : 'Sortie'}
                  </span>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{photo.employeeName}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(photo.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualisation */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedPhoto.employeeName}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedPhoto.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <img
                src={selectedPhoto.photoData}
                alt={`Pointage ${selectedPhoto.employeeName}`}
                className="max-w-full max-h-[60vh] object-contain mx-auto"
              />
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => onDownloadPhoto(selectedPhoto)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
