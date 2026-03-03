//============================================================
//astroSky — Hook de orientación del dispositivo
//============================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
import {
  OrientationFilter,
  processDeviceMotionRotation,
  type ProcessedOrientation,
} from '../engine/orientation';

interface UseDeviceOrientationOptions {
  /** Intervalo de actualización en ms (default: 16 ≈ 60fps) */
  interval?: number;
  /** Offset manual de brújula en grados */
  compassOffset?: number;
  /** Factor de suavizado del filtro (0.85-0.98) */
  filterAlpha?: number;
  /** Activar/desactivar el seguimiento */
  enabled?: boolean;
}

interface UseDeviceOrientationReturn {
  /** Orientación procesada actual */
  orientation: ProcessedOrientation;
  /** Si los sensores están disponibles */
  isAvailable: boolean;
  /** Calidad de la brújula (0-3) */
  magnetometerAccuracy: number;
  /** Resetear el filtro de orientación */
  resetFilter: () => void;
}

export const useDeviceOrientation = (
  options: UseDeviceOrientationOptions = {}
): UseDeviceOrientationReturn => {
  const {
    interval = 16,
    compassOffset = 0,
    filterAlpha = 0.92,
    enabled = true,
  } = options;

  const [orientation, setOrientation] = useState<ProcessedOrientation>({
    azimuth: 0,
    altitude: 45,
    roll: 0,
  });
  const [isAvailable, setIsAvailable] = useState(false);
  const [magnetometerAccuracy, setMagnetometerAccuracy] = useState(0);

  const filterRef = useRef(new OrientationFilter(filterAlpha));
  const compassOffsetRef = useRef(compassOffset);

  //actualizar refs cuando cambien las props
  useEffect(() => {
    compassOffsetRef.current = compassOffset;
  }, [compassOffset]);

  useEffect(() => {
    filterRef.current.setAlpha(filterAlpha);
  }, [filterAlpha]);

  const resetFilter = useCallback(() => {
    filterRef.current.reset();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const startListening = async () => {
      try {
        const available = await DeviceMotion.isAvailableAsync();
        setIsAvailable(available);

        if (!available) {
          console.warn('DeviceMotion no está disponible en este dispositivo');
          return;
        }

        DeviceMotion.setUpdateInterval(interval);

        subscription = DeviceMotion.addListener((data) => {
          if (!data.rotation) return;

          const { alpha, beta, gamma } = data.rotation;

          //convertir rotación de DeviceMotion a orientación de cámara
          const raw = processDeviceMotionRotation(
            (alpha ?? 0) * (180 / Math.PI),
            (beta ?? 0) * (180 / Math.PI),
            (gamma ?? 0) * (180 / Math.PI)
          );

          //aplicar filtro de suavizado
          const filtered = filterRef.current.update(
            raw.azimuth,
            raw.altitude,
            raw.roll,
            compassOffsetRef.current
          );

          setOrientation(filtered);
        });
      } catch (error) {
        console.error('Error iniciando DeviceMotion:', error);
        setIsAvailable(false);
      }
    };

    startListening();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, interval]);

  //opcional: monitorear la precisión del magnetómetro por separado
  useEffect(() => {
    if (!enabled) return;

    let magSubscription: ReturnType<typeof Magnetometer.addListener> | null = null;

    const startMagnetometer = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!available) return;

        Magnetometer.setUpdateInterval(500); //no necesita ser rápido

        magSubscription = Magnetometer.addListener((_data) => {
          //expo-sensors no expone accuracy directamente,
          //estimamos por la magnitud del campo magnético
          //(la Tierra tiene ~25-65 μT, valores fuera de rango = mala calibración)
          //por ahora, asumimos buena calibración
          setMagnetometerAccuracy(2);
        });
      } catch {
        //magnetómetro no disponible — no es crítico
      }
    };

    startMagnetometer();

    return () => {
      if (magSubscription) {
        magSubscription.remove();
      }
    };
  }, [enabled]);

  return {
    orientation,
    isAvailable,
    magnetometerAccuracy,
    resetFilter,
  };
};
