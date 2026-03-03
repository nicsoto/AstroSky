//============================================================
//astroSky — Cargador de datos de constelaciones
//============================================================

import type { Constellation, ConstellationLine } from '../types';
import constellationsData from '../catalogs/constellations.json';
import es from '../../i18n/es';

export interface ConstellationCatalog {
  constellations: Constellation[];
  /** Mapa de abreviatura → constelación */
  byAbbreviation: Map<string, Constellation>;
}

/**
 *cargar y procesar los datos de constelaciones.
 */
export const loadConstellationCatalog = (): ConstellationCatalog => {
  const constellationNames = es.constellationNames as Record<string, string>;

  const constellations: Constellation[] = (constellationsData as any[]).map((c) => ({
    abbreviation: c.abbreviation,
    name: c.name,
    nameEs: constellationNames[c.abbreviation] || c.name,
    genitive: c.genitive,
    lines: (c.lines || []) as ConstellationLine[],
  }));

  const byAbbreviation = new Map<string, Constellation>();
  for (const c of constellations) {
    byAbbreviation.set(c.abbreviation, c);
  }

  return { constellations, byAbbreviation };
};

/**
 *obtener todas las líneas de constelaciones que se pueden dibujar,
 *resolviendo los Hipparcos IDs a índices del catálogo de estrellas.
 *
 * @param constellation - La constelación
 * @param hipIndex - Mapa de HIP ID → índice en el array de estrellas
 * @returns Array de pares [starIndex1, starIndex2]
 */
export const resolveConstellationLines = (
  constellation: Constellation,
  hipIndex: Map<number, number>
): [number, number][] => {
  const resolved: [number, number][] = [];

  for (const [hip1, hip2] of constellation.lines) {
    const idx1 = hipIndex.get(hip1);
    const idx2 = hipIndex.get(hip2);

    if (idx1 !== undefined && idx2 !== undefined) {
      resolved.push([idx1, idx2]);
    }
  }

  return resolved;
};

/**
 *buscar constelaciones por nombre.
 */
export const searchConstellations = (
  constellations: Constellation[],
  query: string,
  maxResults: number = 10
): Constellation[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return constellations
    .filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameEs.toLowerCase().includes(q) ||
      c.abbreviation.toLowerCase().includes(q)
    )
    .slice(0, maxResults);
};
