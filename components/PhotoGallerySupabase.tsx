"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Download, Eye, Calendar, User, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClockPhoto {
  id: number;
  employee_id: string;
  photo_url: string;
  photo_data: string;
  timestamp: string;
  metadata: any;
  created_at: string;
}

interface PhotoGallerySupabaseProps {
  employeeId?: string;
  showAll?: boolean;
}

export default function PhotoGallerySupabase({ employeeId, showAll = false }: PhotoGallerySupabaseProps) {
  const [photos, setPhotos] = useState<ClockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<ClockPhoto | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [employeeId, showAll]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('clock_photos')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (!showAll && employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur chargement photos:', error);
        setError('Erreur lors du chargement des photos');
        return;
      }
      
      setPhotos(data || []);
    } catch (err) {
      console.error('❌ Erreur fatale:', err);
      setError('Erreur lors du chargement des photos');
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = (photo: ClockPhoto) => {
    try {
      const link = document.createElement('a');
      link.href = photo.photo_url;
      link.download = `pointage_${photo.employee_id}_${new Date(photo.timestamp).getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('❌ Erreur téléchargement:', err);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;
    
    try {
      const { error } = await supabase
        .from('clock_photos')
        .delete()
        .eq('id', photoId);
      
      if (error) {
        console.error('❌ Erreur suppression:', error);
        return;
      }
      
      // Recharger les photos
      await loadPhotos();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={loadPhotos}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Camera className="w-6 h-6 mr-2" />
          Photos de Pointage
        </h2>
        <button
          onClick={loadPhotos}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune photo de pointage</p>
          <p className="text-gray-400 text-sm">Les photos apparaîtront ici après les pointages</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {photo.photo_url ? (
                  <img
                    src={photo.photo_url}
                    alt={`Pointage ${photo.employee_id}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                    title="Voir en grand"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadPhoto(photo)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="p-1 bg-red-600 bg-opacity-50 text-white rounded hover:bg-opacity-70"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {photo.metadata?.employeeName || photo.employee_id}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(photo.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour voir la photo en grand */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Photo de Pointage</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <img
                src={selectedPhoto.photo_url}
                alt="Photo de pointage"
                className="max-w-full max-h-96 mx-auto"
              />
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Employé:</strong> {selectedPhoto.metadata?.employeeName || selectedPhoto.employee_id}</p>
                <p><strong>Date:</strong> {formatDate(selectedPhoto.timestamp)}</p>
                {selectedPhoto.metadata?.fileName && (
                  <p><strong>Fichier:</strong> {selectedPhoto.metadata.fileName}</p>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => downloadPhoto(selectedPhoto)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
