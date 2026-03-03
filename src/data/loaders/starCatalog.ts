//============================================================
//astroSky — Cargador del catálogo de estrellas
//============================================================

import type { Star } from '../types';
import { equatorialToCartesian } from '../../utils/math';
import { bvToRGB } from '../../utils/colors';

import starsData from '../catalogs/stars.json';

export interface StarCatalog {
  /** Array de estrellas */
  stars: Star[];
  /** Posiciones cartesianas ecuatoriales (x,y,z unitarios) — Float32Array */
  cartesianPositions: Float32Array;
  /** Colores RGB de cada estrella — Float32Array [r,g,b, r,g,b, ...] */
  colors: Float32Array;
  /** Magnitudes — Float32Array */
  magnitudes: Float32Array;
  /** Mapa de Hipparcos ID → índice en el array */
  hipIndex: Map<number, number>;
  /** Mapa de nombre → índice */
  nameIndex: Map<string, number>;
}

/**
 *cargar y procesar el catálogo de estrellas.
 *pre-calcula posiciones cartesianas y colores para rendimiento óptimo.
 */
export const loadStarCatalog = (): StarCatalog => {
  const stars: Star[] = (starsData as any[]).map((s) => ({
    id: s.id,
    type: 'star' as const,
    name: s.name,
    nameEs: s.name, //usar nombre propio si existe
    proper: s.proper,
    bayer: s.bayer,
    hip: s.hip,
    hd: s.hd,
    ra: s.ra,
    dec: s.dec,
    magnitude: s.magnitude,
    ci: s.ci ?? 0,
    spectralType: s.spectralType,
    distance: s.distance,
    constellation: s.constellation,
  }));

  const numStars = stars.length;

  //pre-calcular posiciones cartesianas ecuatoriales
  const cartesianPositions = new Float32Array(numStars * 3);
  const colors = new Float32Array(numStars * 3);
  const magnitudes = new Float32Array(numStars);
  const hipIndex = new Map<number, number>();
  const nameIndex = new Map<string, number>();

  for (let i = 0; i < numStars; i++) {
    const star = stars[i];

    //posición cartesiana ecuatorial (vector unitario)
    const [x, y, z] = equatorialToCartesian(star.ra, star.dec);
    cartesianPositions[i * 3] = x;
    cartesianPositions[i * 3 + 1] = y;
    cartesianPositions[i * 3 + 2] = z;

    //color RGB desde índice B-V
    const [r, g, b] = bvToRGB(star.ci);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    //magnitud
    magnitudes[i] = star.magnitude;

    //índices
    if (star.hip) {
      hipIndex.set(star.hip, i);
    }
    if (star.proper) {
      nameIndex.set(star.proper.toLowerCase(), i);
    }
    if (star.name) {
      nameIndex.set(star.name.toLowerCase(), i);
    }
  }

  return {
    stars,
    cartesianPositions,
    colors,
    magnitudes,
    hipIndex,
    nameIndex,
  };
};

/**
 *filtrar estrellas por magnitud límite.
 *retorna los índices de las estrellas visibles.
 */
export const filterByMagnitude = (
  magnitudes: Float32Array,
  limit: number
): number[] => {
  const indices: number[] = [];
  for (let i = 0; i < magnitudes.length; i++) {
    if (magnitudes[i] <= limit) {
      indices.push(i);
    }
  }
  return indices;
};

/**
 *buscar estrellas por nombre (búsqueda parcial).
 */
export const searchStarsByName = (
  stars: Star[],
  query: string,
  maxResults: number = 20
): Star[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: Star[] = [];

  for (const star of stars) {
    if (results.length >= maxResults) break;

    const matchName = star.name?.toLowerCase().includes(q);
    const matchProper = star.proper?.toLowerCase().includes(q);
    const matchBayer = star.bayer?.toLowerCase().includes(q);
    const matchConstellation = star.constellation?.toLowerCase().includes(q);

    if (matchName || matchProper || matchBayer || matchConstellation) {
      results.push(star);
    }
  }

  //ordenar por relevancia (nombres exactos primero, luego por magnitud)
  return results.sort((a, b) => {
    const aExact = a.name?.toLowerCase() === q || a.proper?.toLowerCase() === q;
    const bExact = b.name?.toLowerCase() === q || b.proper?.toLowerCase() === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.magnitude - b.magnitude;
  });
};
