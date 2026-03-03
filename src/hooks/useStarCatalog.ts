//============================================================
//astroSky — Hook de catálogo de estrellas
//============================================================

import { useState, useEffect, useRef } from 'react';
import {
  loadStarCatalog,
  type StarCatalog,
} from '../data/loaders/starCatalog';
import {
  loadConstellationCatalog,
  type ConstellationCatalog,
} from '../data/loaders/constellationData';

interface UseStarCatalogReturn {
  starCatalog: StarCatalog | null;
  constellationCatalog: ConstellationCatalog | null;
  loading: boolean;
  error: string | null;
}

/**
 *hook que carga los catálogos de estrellas y constelaciones.
 *se carga una sola vez y se mantiene en memoria.
 */
export const useStarCatalog = (): UseStarCatalogReturn => {
  const [starCatalog, setStarCatalog] = useState<StarCatalog | null>(null);
  const [constellationCatalog, setConstellationCatalog] =
    useState<ConstellationCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    try {
      //cargar catálogos (síncronos ya que son JSON embebidos)
      const stars = loadStarCatalog();
      const constellations = loadConstellationCatalog();

      setStarCatalog(stars);
      setConstellationCatalog(constellations);

      console.log(
        `Catálogo cargado: ${stars.stars.length} estrellas, ` +
        `${constellations.constellations.length} constelaciones`
      );
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar los datos astronómicos');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    starCatalog,
    constellationCatalog,
    loading,
    error,
  };
};
