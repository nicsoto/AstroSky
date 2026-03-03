//============================================================
//astroSky — Servicio de caché (MMKV)
//============================================================

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

const storage: MMKV = createMMKV({ id: 'astrosky-cache' });

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; //milisegundos
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000; //24 horas

/**
 *guardar datos en caché con TTL.
 */
export const cacheSet = <T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    storage.set(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache] Error al guardar:', key, e);
  }
};

/**
 *obtener datos del caché. Retorna null si expirado o no existe.
 */
export const cacheGet = <T>(key: string): T | null => {
  try {
    const raw = storage.getString(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl) {
      //expirado
      storage.remove(key);
      return null;
    }

    return entry.data;
  } catch (e) {
    console.warn('[Cache] Error al leer:', key, e);
    return null;
  }
};

/**
 *verificar si una clave existe y no está expirada.
 */
export const cacheHas = (key: string): boolean => {
  return cacheGet(key) !== null;
};

/**
 *eliminar una entrada del caché.
 */
export const cacheDelete = (key: string): void => {
  storage.remove(key);
};

/**
 *limpiar todo el caché.
 */
export const cacheClear = (): void => {
  storage.clearAll();
};

/**
 *obtener el tamaño aproximado del caché.
 */
export const cacheSize = (): number => {
  return storage.getAllKeys().length;
};

/**
 *wrapper para fetch con caché.
 *si hay datos en caché válidos, los devuelve inmediatamente.
 *si no, hace fetch, guarda en caché, y retorna los datos.
 */
export const cachedFetch = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<T> => {
  //intentar caché primero
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  //hacer fetch
  const data = await fetchFn();
  cacheSet(key, data, ttlMs);
  return data;
};
