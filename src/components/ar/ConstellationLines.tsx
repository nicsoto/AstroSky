//============================================================
//astroSky — Líneas de constelaciones (Three.js)
//============================================================

import * as THREE from 'three';
import type { StarCatalog } from '../../data/loaders/starCatalog';
import type { ConstellationCatalog } from '../../data/loaders/constellationData';
import { resolveConstellationLines } from '../../data/loaders/constellationData';
import type { ObserverLocation } from '../../data/types';
import { batchEquatorialToThreeJS } from '../../engine/coordinates';
import { THEME } from '../../utils/colors';

const SPHERE_RADIUS = 500;

/**
 *crear el grupo de líneas de constelaciones.
 *cada constelación es un THREE.LineSegments dentro del grupo.
 */
export const createConstellationLines = (
  starCatalog: StarCatalog,
  constellationCatalog: ConstellationCatalog,
  location: ObserverLocation
): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'constellations';

  //calcular posiciones actuales de las estrellas en Three.js
  const starPositions = new Float32Array(starCatalog.cartesianPositions.length);
  batchEquatorialToThreeJS(
    starCatalog.cartesianPositions,
    new Date(),
    location,
    SPHERE_RADIUS,
    starPositions
  );

  //material para las líneas
  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(THEME.constellationLine),
    transparent: true,
    opacity: 0.5,
    linewidth: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  //crear líneas para cada constelación
  for (const constellation of constellationCatalog.constellations) {
    if (constellation.lines.length === 0) continue;

    const resolvedLines = resolveConstellationLines(
      constellation,
      starCatalog.hipIndex
    );

    if (resolvedLines.length === 0) continue;

    //crear geometría de segmentos de línea
    const positions: number[] = [];

    for (const [idx1, idx2] of resolvedLines) {
      const i1 = idx1 * 3;
      const i2 = idx2 * 3;

      positions.push(
        starPositions[i1], starPositions[i1 + 1], starPositions[i1 + 2],
        starPositions[i2], starPositions[i2 + 1], starPositions[i2 + 2]
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const lineSegments = new THREE.LineSegments(geometry, lineMaterial.clone());
    lineSegments.name = `constellation_${constellation.abbreviation}`;
    lineSegments.frustumCulled = false;
    lineSegments.userData = {
      abbreviation: constellation.abbreviation,
      resolvedLines,
    };

    group.add(lineSegments);
  }

  return group;
};

/**
 *actualizar posiciones de las líneas de constelaciones.
 */
export const updateConstellationLinePositions = (
  group: THREE.Group,
  starCatalog: StarCatalog,
  constellationCatalog: ConstellationCatalog,
  location: ObserverLocation
): void => {
  //recalcular posiciones de estrellas
  const starPositions = new Float32Array(starCatalog.cartesianPositions.length);
  batchEquatorialToThreeJS(
    starCatalog.cartesianPositions,
    new Date(),
    location,
    SPHERE_RADIUS,
    starPositions
  );

  //actualizar cada constelación
  for (const child of group.children) {
    const lineSegments = child as THREE.LineSegments;
    const { resolvedLines } = lineSegments.userData;
    if (!resolvedLines) continue;

    const positions: number[] = [];

    for (const [idx1, idx2] of resolvedLines) {
      const i1 = idx1 * 3;
      const i2 = idx2 * 3;

      positions.push(
        starPositions[i1], starPositions[i1 + 1], starPositions[i1 + 2],
        starPositions[i2], starPositions[i2 + 1], starPositions[i2 + 2]
      );
    }

    const posAttr = lineSegments.geometry.getAttribute('position') as THREE.BufferAttribute;
    const newArray = new Float32Array(positions);
    (posAttr as any).array = newArray;
    (posAttr as any).count = newArray.length / 3;
    posAttr.needsUpdate = true;
  }
};

/**
 *animar el trazado progresivo de una constelación.
 *usa drawRange para revelar líneas gradualmente.
 *
 * @param lineSegments - El objeto de líneas de la constelación
 * @param progress - Progreso de 0 (nada) a 1 (completo)
 */
export const animateConstellationDraw = (
  lineSegments: THREE.LineSegments,
  progress: number
): void => {
  const totalVertices = lineSegments.geometry.getAttribute('position').count;
  const drawCount = Math.floor(totalVertices * Math.min(1, Math.max(0, progress)));
  lineSegments.geometry.setDrawRange(0, drawCount);
};
