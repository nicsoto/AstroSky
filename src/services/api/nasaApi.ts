//============================================================
//astroSky — Servicio API de NASA (APOD, NEO, etc.)
//============================================================

import { cachedFetch } from '../cache';

//nota: Para producción se debería usar una API key propia
//la API key DEMO_KEY tiene límites muy bajos (30/hora, 50/día)
const NASA_API_KEY = 'DEMO_KEY';
const NASA_BASE_URL = 'https://api.nasa.gov';

//============ TIPOS ============

export interface NasaAPOD {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  date: string;
  copyright?: string;
}

export interface NearEarthObject {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    relative_velocity: {
      kilometers_per_second: string;
    };
    miss_distance: {
      kilometers: string;
      lunar: string;
    };
  }>;
}

//============ FUNCIONES ============

/**
 *obtener la Imagen Astronómica del Día (APOD).
 */
export const getAPOD = async (): Promise<NasaAPOD | null> => {
  try {
    return await cachedFetch<NasaAPOD>(
      'nasa_apod',
      async () => {
        const url = `${NASA_BASE_URL}/planetary/apod?api_key=${NASA_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NASA APOD: ${response.status}`);
        return response.json();
      },
      12 * 60 * 60 * 1000 //12 horas
    );
  } catch (e) {
    console.warn('[NASA API] Error APOD:', e);
    return null;
  }
};

/**
 *obtener objetos cercanos a la Tierra (NEO) para una fecha.
 */
export const getNearEarthObjects = async (
  date?: string
): Promise<NearEarthObject[]> => {
  const dateStr = date || new Date().toISOString().split('T')[0];

  try {
    return await cachedFetch<NearEarthObject[]>(
      `nasa_neo_${dateStr}`,
      async () => {
        const url = `${NASA_BASE_URL}/neo/rest/v1/feed?start_date=${dateStr}&end_date=${dateStr}&api_key=${NASA_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NASA NEO: ${response.status}`);
        const data = await response.json();

        //extraer NEOs de la respuesta
        const neos: NearEarthObject[] = [];
        for (const dayObjects of Object.values(
          data.near_earth_objects || {}
        )) {
          neos.push(...(dayObjects as NearEarthObject[]));
        }

        return neos;
      },
      6 * 60 * 60 * 1000 //6 horas
    );
  } catch (e) {
    console.warn('[NASA API] Error NEO:', e);
    return [];
  }
};

/**
 *buscar imágenes de un objeto celeste en la biblioteca de NASA.
 */
export const searchNasaImages = async (
  query: string,
  limit: number = 5
): Promise<Array<{ title: string; url: string; description: string }>> => {
  const cacheKey = `nasa_images_${query.toLowerCase().replace(/\s+/g, '_')}`;

  try {
    return await cachedFetch(
      cacheKey,
      async () => {
        const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(
          query
        )}&media_type=image&page_size=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NASA Images: ${response.status}`);
        const data = await response.json();

        return (data.collection?.items || []).map((item: any) => ({
          title: item.data?.[0]?.title || '',
          url: item.links?.[0]?.href || '',
          description: item.data?.[0]?.description || '',
        }));
      },
      24 * 60 * 60 * 1000 //24 horas
    );
  } catch (e) {
    console.warn('[NASA API] Error Images:', e);
    return [];
  }
};
