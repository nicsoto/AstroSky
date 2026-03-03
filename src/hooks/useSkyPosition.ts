//============================================================
//astroSky — Hook de posición del cielo
//============================================================

import { useMemo, useRef, useCallback } from 'react';
import type { ObserverLocation, Planet } from '../data/types';
import type { StarCatalog } from '../data/loaders/starCatalog';
import type { ProcessedOrientation } from '../engine/orientation';
import { batchEquatorialToThreeJS } from '../engine/coordinates';
import { getAllPlanetPositions } from '../engine/astronomy';

interface UseSkyPositionOptions {
  starCatalog: StarCatalog | null;
  orientation: ProcessedOrientation;
  location: ObserverLocation | null;
  enabled?: boolean;
}

interface UseSkyPositionReturn {
  /** Obtener posiciones Three.js actualizadas de las estrellas */
  getStarPositions: (radius: number) => Float32Array | null;
  /** Posiciones de planetas */
  planets: Planet[];
  /** Refrescar posiciones planetarias */
  refreshPlanets: () => void;
}

const SPHERE_RADIUS = 500; //radio de la esfera celeste en unidades Three.js

export const useSkyPosition = (
  options: UseSkyPositionOptions
): UseSkyPositionReturn => {
  const { starCatalog, location, enabled = true } = options;

  //buffer reutilizable para posiciones Three.js
  const positionsBufferRef = useRef<Float32Array | null>(null);
  const planetsRef = useRef<Planet[]>([]);
  const lastPlanetUpdateRef = useRef<number>(0);

  //calcular posiciones de estrellas en coordenadas Three.js
  const getStarPositions = useCallback(
    (radius: number = SPHERE_RADIUS): Float32Array | null => {
      if (!starCatalog || !location || !enabled) return null;

      const now = new Date();

      //reutilizar buffer si ya existe
      if (
        !positionsBufferRef.current ||
        positionsBufferRef.current.length !== starCatalog.cartesianPositions.length
      ) {
        positionsBufferRef.current = new Float32Array(
          starCatalog.cartesianPositions.length
        );
      }

      //transformar todas las posiciones ecuatoriales a Three.js
      batchEquatorialToThreeJS(
        starCatalog.cartesianPositions,
        now,
        location,
        radius,
        positionsBufferRef.current
      );

      return positionsBufferRef.current;
    },
    [starCatalog, location, enabled]
  );

  //calcular posiciones de planetas (más costoso, se actualiza con menos frecuencia)
  const refreshPlanets = useCallback(() => {
    if (!location || !enabled) return;

    const now = Date.now();
    //actualizar planetas máximo cada 30 segundos
    if (now - lastPlanetUpdateRef.current < 30000) return;
    lastPlanetUpdateRef.current = now;

    const planets = getAllPlanetPositions(new Date(), location);
    planetsRef.current = planets;
  }, [location, enabled]);

  //refrescar planetas al montar y cuando cambie la ubicación
  useMemo(() => {
    if (location && enabled) {
      lastPlanetUpdateRef.current = 0; //forzar actualización
      refreshPlanets();
    }
  }, [location, enabled]);

  return {
    getStarPositions,
    planets: planetsRef.current,
    refreshPlanets,
  };
};
