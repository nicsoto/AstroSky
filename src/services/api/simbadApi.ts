//============================================================
//astroSky — Servicio API SIMBAD (CDS Strasbourg)
//============================================================

import { cachedFetch } from '../cache';

const SIMBAD_BASE_URL = 'https://simbad.u-strasbg.fr/simbad/sim-tap/sync';

//============ TIPOS ============

export interface SimbadObject {
  mainId: string;
  ra: number;      //grados
  dec: number;     //grados
  objectType: string;
  spectralType?: string;
  magnitude?: number;
  redshift?: number;
  morphType?: string;
}

//============ FUNCIONES ============

/**
 *buscar un objeto celeste por nombre en SIMBAD.
 *usa TAP (Table Access Protocol) con ADQL.
 */
export const searchSimbadByName = async (
  name: string
): Promise<SimbadObject | null> => {
  const cacheKey = `simbad_name_${name.toLowerCase().replace(/\s+/g, '_')}`;

  try {
    return await cachedFetch<SimbadObject | null>(
      cacheKey,
      async () => {
        const query = `
          SELECT TOP 1
            main_id, ra, dec, otype_txt, sp_type, flux
          FROM basic
          WHERE main_id = '${name.replace(/'/g, "''")}'
          OR ident.id = '${name.replace(/'/g, "''")}'
        `;

        const params = new URLSearchParams({
          request: 'doQuery',
          lang: 'adql',
          format: 'json',
          query: query.trim(),
        });

        const response = await fetch(`${SIMBAD_BASE_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`SIMBAD: ${response.status}`);

        const data = await response.json();
        const rows = data?.data || [];

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
          mainId: row[0] || name,
          ra: row[1] || 0,
          dec: row[2] || 0,
          objectType: row[3] || 'unknown',
          spectralType: row[4] || undefined,
          magnitude: row[5] || undefined,
        };
      },
      7 * 24 * 60 * 60 * 1000 //7 días (datos astronómicos no cambian)
    );
  } catch (e) {
    console.warn('[SIMBAD API] Error búsqueda por nombre:', e);
    return null;
  }
};

/**
 *buscar objetos celestes en un área del cielo (cone search).
 *
 * @param ra - Ascensión recta en grados
 * @param dec - Declinación en grados
 * @param radius - Radio de búsqueda en grados
 * @param limit - Número máximo de resultados
 */
export const searchSimbadByRegion = async (
  ra: number,
  dec: number,
  radius: number = 2,
  limit: number = 20
): Promise<SimbadObject[]> => {
  const cacheKey = `simbad_region_${ra.toFixed(1)}_${dec.toFixed(1)}_${radius}`;

  try {
    return await cachedFetch<SimbadObject[]>(
      cacheKey,
      async () => {
        const query = `
          SELECT TOP ${limit}
            main_id, ra, dec, otype_txt, sp_type, flux
          FROM basic
          WHERE CONTAINS(
            POINT('ICRS', ra, dec),
            CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
          ) = 1
          AND flux < 8
          ORDER BY flux ASC
        `;

        const params = new URLSearchParams({
          request: 'doQuery',
          lang: 'adql',
          format: 'json',
          query: query.trim(),
        });

        const response = await fetch(`${SIMBAD_BASE_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`SIMBAD: ${response.status}`);

        const data = await response.json();
        const rows = data?.data || [];

        return rows.map((row: any[]) => ({
          mainId: row[0] || '',
          ra: row[1] || 0,
          dec: row[2] || 0,
          objectType: row[3] || 'unknown',
          spectralType: row[4] || undefined,
          magnitude: row[5] || undefined,
        }));
      },
      24 * 60 * 60 * 1000 //24 horas
    );
  } catch (e) {
    console.warn('[SIMBAD API] Error búsqueda por región:', e);
    return [];
  }
};

/**
 *obtener información detallada de un objeto por identificador SIMBAD.
 */
export const getSimbadDetails = async (
  identifier: string
): Promise<SimbadObject | null> => {
  const cacheKey = `simbad_detail_${identifier.toLowerCase().replace(/\s+/g, '_')}`;

  try {
    return await cachedFetch<SimbadObject | null>(
      cacheKey,
      async () => {
        const query = `
          SELECT TOP 1
            main_id, ra, dec, otype_txt, sp_type, flux,
            rvz_redshift, morph_type
          FROM basic
          JOIN ident ON ident.oidref = basic.oid
          WHERE ident.id = '${identifier.replace(/'/g, "''")}'
        `;

        const params = new URLSearchParams({
          request: 'doQuery',
          lang: 'adql',
          format: 'json',
          query: query.trim(),
        });

        const response = await fetch(`${SIMBAD_BASE_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`SIMBAD: ${response.status}`);

        const data = await response.json();
        const rows = data?.data || [];

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
          mainId: row[0] || identifier,
          ra: row[1] || 0,
          dec: row[2] || 0,
          objectType: row[3] || 'unknown',
          spectralType: row[4] || undefined,
          magnitude: row[5] || undefined,
          redshift: row[6] || undefined,
          morphType: row[7] || undefined,
        };
      },
      7 * 24 * 60 * 60 * 1000 //7 días
    );
  } catch (e) {
    console.warn('[SIMBAD API] Error detalle:', e);
    return null;
  }
};
