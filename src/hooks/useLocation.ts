//============================================================
//astroSky — Hook de ubicación GPS
//============================================================

import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import type { ObserverLocation } from '../data/types';

interface UseLocationReturn {
  /** Ubicación del observador */
  location: ObserverLocation | null;
  /** Si se está obteniendo la ubicación */
  loading: boolean;
  /** Error si lo hubo */
  error: string | null;
  /** Si se concedió el permiso */
  hasPermission: boolean;
  /** Refrescar la ubicación */
  refresh: () => Promise<void>;
}

/** Ubicación por defecto (Buenos Aires, Argentina) */
const DEFAULT_LOCATION: ObserverLocation = {
  latitude: -34.6037,
  longitude: -58.3816,
  elevation: 25,
};

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      //pedir permiso
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setHasPermission(false);
        setError('Permiso de ubicación denegado');
        //usar ubicación por defecto
        setLocation(DEFAULT_LOCATION);
        setLoading(false);
        return;
      }

      setHasPermission(true);

      //obtener ubicación actual
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        elevation: loc.coords.altitude ?? 0,
      });
    } catch (err) {
      console.error('Error obteniendo ubicación:', err);
      setError('No se pudo obtener la ubicación');
      //usar ubicación por defecto
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    hasPermission,
    refresh: fetchLocation,
  };
};
