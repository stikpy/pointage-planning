// Service de géolocalisation pour validation des pointages
import React from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  address?: string;
}

export interface LocationValidation {
  isValid: boolean;
  isWithinWorkArea: boolean;
  distanceFromWorkArea?: number;
  accuracy: 'high' | 'medium' | 'low';
  error?: string;
}

export interface WorkArea {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // en mètres
  isActive: boolean;
}

class GeolocationService {
  private workAreas: WorkArea[] = [];
  private currentLocation: LocationData | null = null;
  private watchId: number | null = null;

  constructor() {
    this.loadWorkAreas();
  }

  // Charger les zones de travail depuis la configuration
  private loadWorkAreas() {
    // En production, charger depuis l'API ou la base de données
    this.workAreas = [
      {
        id: 'work-area-1',
        name: 'Restaurant Le Bistrot',
        center: {
          latitude: 48.8566, // Paris
          longitude: 2.3522
        },
        radius: 100, // 100 mètres
        isActive: true
      },
      {
        id: 'work-area-2',
        name: 'Café Central',
        center: {
          latitude: 48.8606,
          longitude: 2.3376
        },
        radius: 50, // 50 mètres
        isActive: true
      }
    ];
  }

  // Demander la permission de géolocalisation
  async requestPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      throw new Error('Géolocalisation non supportée par ce navigateur');
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Obtenir la position actuelle
  async getCurrentPosition(): Promise<LocationData> {
    if (!('geolocation' in navigator)) {
      throw new Error('Géolocalisation non supportée');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: new Date(position.timestamp)
          };

          this.currentLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          reject(new Error(this.getGeolocationErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // 1 minute
        }
      );
    });
  }

  // Surveiller la position en continu
  startWatching(callback: (location: LocationData) => void): void {
    if (!('geolocation' in navigator)) {
      throw new Error('Géolocalisation non supportée');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date(position.timestamp)
        };

        this.currentLocation = locationData;
        callback(locationData);
      },
      (error) => {
        console.error('Erreur surveillance géolocalisation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000 // 10 secondes
      }
    );
  }

  // Arrêter la surveillance
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Valider la position par rapport aux zones de travail
  validateLocation(location: LocationData): LocationValidation {
    const validation: LocationValidation = {
      isValid: true,
      isWithinWorkArea: false,
      accuracy: this.getAccuracyLevel(location.accuracy)
    };

    // Vérifier la précision
    if (location.accuracy > 100) {
      validation.isValid = false;
      validation.error = 'Précision GPS insuffisante';
      return validation;
    }

    // Vérifier si dans une zone de travail
    for (const workArea of this.workAreas) {
      if (!workArea.isActive) continue;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        workArea.center.latitude,
        workArea.center.longitude
      );

      if (distance <= workArea.radius) {
        validation.isWithinWorkArea = true;
        validation.distanceFromWorkArea = distance;
        return validation;
      }
    }

    // Si pas dans une zone de travail
    validation.isValid = false;
    validation.error = 'Vous n\'êtes pas dans une zone de travail autorisée';
    return validation;
  }

  // Calculer la distance entre deux points (formule de Haversine)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  // Déterminer le niveau de précision
  private getAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy <= 10) return 'high';
    if (accuracy <= 50) return 'medium';
    return 'low';
  }

  // Obtenir le message d'erreur de géolocalisation
  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permission de géolocalisation refusée';
      case error.POSITION_UNAVAILABLE:
        return 'Position indisponible';
      case error.TIMEOUT:
        return 'Timeout de géolocalisation';
      default:
        return 'Erreur de géolocalisation inconnue';
    }
  }

  // Obtenir l'adresse à partir des coordonnées (géocodage inverse)
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // Utiliser l'API de géocodage inverse (ex: OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Erreur géocodage inverse');
      }

      const data = await response.json();
      return data.display_name || 'Adresse non trouvée';
    } catch (error) {
      console.error('Erreur géocodage inverse:', error);
      return 'Adresse non disponible';
    }
  }

  // Ajouter une zone de travail
  addWorkArea(workArea: WorkArea): void {
    this.workAreas.push(workArea);
  }

  // Supprimer une zone de travail
  removeWorkArea(workAreaId: string): void {
    this.workAreas = this.workAreas.filter(area => area.id !== workAreaId);
  }

  // Obtenir toutes les zones de travail
  getWorkAreas(): WorkArea[] {
    return [...this.workAreas];
  }

  // Obtenir la position actuelle en cache
  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Vérifier si la géolocalisation est disponible
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Obtenir les statistiques de géolocalisation
  getLocationStats(): {
    totalRequests: number;
    successfulRequests: number;
    averageAccuracy: number;
    lastUpdate: Date | null;
  } {
    // En production, ces statistiques seraient stockées et calculées
    return {
      totalRequests: 0,
      successfulRequests: 0,
      averageAccuracy: 0,
      lastUpdate: this.currentLocation?.timestamp || null
    };
  }
}

// Instance singleton
export const geolocationService = new GeolocationService();

// Hook React pour la géolocalisation
export function useGeolocation() {
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permission, setPermission] = React.useState<'granted' | 'denied' | 'prompt'>('prompt');

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        const hasPermission = await geolocationService.requestPermission();
        setPermission(hasPermission ? 'granted' : 'denied');
      } catch (error) {
        setPermission('denied');
        setError('Géolocalisation non supportée');
      }
    };

    checkPermission();
  }, []);

  const getCurrentLocation = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await geolocationService.getCurrentPosition();
      setLocation(locationData);
      return locationData;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateLocation = React.useCallback((locationData: LocationData) => {
    return geolocationService.validateLocation(locationData);
  }, []);

  const startWatching = React.useCallback((callback: (location: LocationData) => void) => {
    geolocationService.startWatching(callback);
  }, []);

  const stopWatching = React.useCallback(() => {
    geolocationService.stopWatching();
  }, []);

  return {
    location,
    isLoading,
    error,
    permission,
    getCurrentLocation,
    validateLocation,
    startWatching,
    stopWatching,
    isSupported: geolocationService.isGeolocationSupported()
  };
}