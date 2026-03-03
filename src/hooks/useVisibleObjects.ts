//============================================================
//astroSky — Hook de objetos visibles
//============================================================

import { useMemo, useCallback } from 'react';
import type {
  CelestialObject,
  ObserverLocation,
  Star,
  Planet,
  DeepSkyObject,
} from '../data/types';
import type { StarCatalog } from '../data/loaders/starCatalog';
import type { ProcessedOrientation } from '../engine/orientation';
import { equatorialToHorizontal, isInFieldOfView } from '../engine/coordinates';
import { getBodyPosition } from '../engine/astronomy';
import { angularDistance } from '../utils/math';
import messierData from '../data/catalogs/messier.json';

interface UseVisibleObjectsOptions {
  starCatalog: StarCatalog | null;
  planets: Planet[];
  orientation: ProcessedOrientation;
  location: ObserverLocation | null;
  magnitudeLimit: number;
  showDeepSky: boolean;
  fovH?: number;
  fovV?: number;
}

interface VisibleObjects {
  /** Estrellas visibles (índices en el catálogo) */
  starIndices: number[];
  /** Planetas visibles */
  planets: Planet[];
  /** Objetos de cielo profundo visibles */
  deepSky: DeepSkyObject[];
  /** Total de objetos visibles */
  totalCount: number;
}

/**
 *hook que calcula qué objetos celestes son actualmente visibles
 *en el campo de visión de la cámara.
 */
export const useVisibleObjects = (
  options: UseVisibleObjectsOptions
): VisibleObjects => {
  const {
    starCatalog,
    planets,
    orientation,
    location,
    magnitudeLimit,
    showDeepSky,
    fovH = 65,
    fovV = 90,
  } = options;

  //calcular objetos visibles (se recalcula cuando cambia la orientación significativamente)
  const visibleObjects = useMemo(() => {
    if (!starCatalog || !location) {
      return { starIndices: [], planets: [], deepSky: [], totalCount: 0 };
    }

    const now = new Date();
    const { azimuth: camAz, altitude: camAlt } = orientation;

    //filtrar estrellas visibles
    const starIndices: number[] = [];
    for (let i = 0; i < starCatalog.stars.length; i++) {
      if (starCatalog.magnitudes[i] > magnitudeLimit) continue;

      const star = starCatalog.stars[i];
      const pos = equatorialToHorizontal(star.ra, star.dec, now, location);

      //solo incluir si está sobre el horizonte y en el FOV (con margen)
      if (pos.altitude > -5 && isInFieldOfView(
        pos.azimuth, pos.altitude, camAz, camAlt, fovH * 1.5, fovV * 1.5
      )) {
        starIndices.push(i);
      }
    }

    //filtrar planetas visibles
    const visiblePlanets = planets.filter((p) => {
      const pos = getBodyPosition(p.bodyName, now, location);
      return pos.altitude > -5 && isInFieldOfView(
        pos.azimuth, pos.altitude, camAz, camAlt, fovH * 1.5, fovV * 1.5
      );
    });

    //filtrar objetos de cielo profundo
    let deepSky: DeepSkyObject[] = [];
    if (showDeepSky) {
      deepSky = (messierData as any[])
        .filter((m) => {
          if (m.magnitude > magnitudeLimit + 2) return false; //más generosos con deep sky
          const pos = equatorialToHorizontal(m.ra, m.dec, now, location);
          return pos.altitude > -5 && isInFieldOfView(
            pos.azimuth, pos.altitude, camAz, camAlt, fovH * 1.5, fovV * 1.5
          );
        })
        .map((m) => ({
          id: `messier_${m.messier}`,
          type: m.type as DeepSkyObject['type'],
          name: `M${m.messier}`,
          nameEs: m.nameEs,
          ra: m.ra,
          dec: m.dec,
          magnitude: m.magnitude,
          messier: m.messier,
          angularSize: m.angularSize,
          distance: m.distance,
          commonName: m.name,
          commonNameEs: m.nameEs,
          constellation: m.constellation,
          description: m.description,
        }));
    }

    return {
      starIndices,
      planets: visiblePlanets,
      deepSky,
      totalCount: starIndices.length + visiblePlanets.length + deepSky.length,
    };
  }, [
    starCatalog,
    location,
    //redondear orientación para evitar recálculos excesivos (cada ~2°)
    Math.round(orientation.azimuth / 2),
    Math.round(orientation.altitude / 2),
    magnitudeLimit,
    showDeepSky,
    planets.length,
  ]);

  return visibleObjects;
};

/**
 *encontrar el objeto celeste más cercano a un punto del cielo.
 *para hit testing al tocar la pantalla.
 */
export const findNearestObject = (
  targetAz: number,
  targetAlt: number,
  starCatalog: StarCatalog,
  planets: Planet[],
  location: ObserverLocation,
  maxDistanceDeg: number = 5
): CelestialObject | null => {
  const now = new Date();
  let nearest: CelestialObject | null = null;
  let nearestDist = maxDistanceDeg;

  //buscar en estrellas
  for (const star of starCatalog.stars) {
    const pos = equatorialToHorizontal(star.ra, star.dec, now, location);
    const dist = angularDistance(targetAz, targetAlt, pos.azimuth, pos.altitude);

    //priorizar estrellas más brillantes (factor de magnitud)
    const effectiveDist = dist + star.magnitude * 0.3;

    if (effectiveDist < nearestDist) {
      nearestDist = effectiveDist;
      nearest = star;
    }
  }

  //buscar en planetas (prioridad sobre estrellas)
  for (const planet of planets) {
    const pos = getBodyPosition(planet.bodyName, now, location);
    const dist = angularDistance(targetAz, targetAlt, pos.azimuth, pos.altitude);

    //los planetas tienen prioridad (factor menor)
    if (dist < nearestDist + 1) {
      nearestDist = dist;
      nearest = planet;
    }
  }

  return nearest;
};
