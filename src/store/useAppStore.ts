//============================================================
//astroSky — Store de estado de la app (runtime)
//============================================================

import { create } from 'zustand';
import type { CelestialObject, SelectedObject, TrajectoryPoint } from '../data/types';

interface AppStore {
  /** Objeto actualmente seleccionado */
  selectedObject: SelectedObject | null;
  /** Si el panel de info está abierto */
  infoPanelOpen: boolean;
  /** Si se está mostrando una trayectoria */
  trajectoryPoints: TrajectoryPoint[];
  /** Si la app está en modo calibración */
  isCalibrating: boolean;
  /** Si se está buscando un objeto (flechas guía activas) */
  searchTarget: CelestialObject | null;
  /** Si la pantalla de búsqueda está abierta */
  isSearchOpen: boolean;
  /** FPS actual (para debug) */
  fps: number;
  /** Si es de noche (afecta el comportamiento del modo AR) */
  isNight: boolean;
  /** Permisos concedidos */
  permissions: {
    camera: boolean;
    location: boolean;
    sensors: boolean;
  };

  //acciones
  selectObject: (object: CelestialObject | null) => void;
  setInfoPanelOpen: (open: boolean) => void;
  setTrajectoryPoints: (points: TrajectoryPoint[]) => void;
  clearTrajectory: () => void;
  setIsCalibrating: (calibrating: boolean) => void;
  setSearchTarget: (target: CelestialObject | null) => void;
  setIsSearchOpen: (open: boolean) => void;
  setFps: (fps: number) => void;
  setIsNight: (isNight: boolean) => void;
  setPermission: (type: 'camera' | 'location' | 'sensors', granted: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedObject: null,
  infoPanelOpen: false,
  trajectoryPoints: [],
  isCalibrating: false,
  searchTarget: null,
  isSearchOpen: false,
  fps: 0,
  isNight: true,
  permissions: {
    camera: false,
    location: false,
    sensors: false,
  },

  selectObject: (object) =>
    set({
      selectedObject: object
        ? {
            object,
            horizontalPosition: { azimuth: 0, altitude: 0 },
            screenPosition: { x: 0, y: 0, visible: true },
            showTrajectory: false,
            showInfo: true,
          }
        : null,
      infoPanelOpen: !!object,
    }),

  setInfoPanelOpen: (open) => set({ infoPanelOpen: open }),

  setTrajectoryPoints: (points) => set({ trajectoryPoints: points }),

  clearTrajectory: () => set({ trajectoryPoints: [] }),

  setIsCalibrating: (calibrating) => set({ isCalibrating: calibrating }),

  setSearchTarget: (target) => set({ searchTarget: target }),

  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  setFps: (fps) => set({ fps }),

  setIsNight: (isNight) => set({ isNight }),

  setPermission: (type, granted) =>
    set((state) => ({
      permissions: {
        ...state.permissions,
        [type]: granted,
      },
    })),
}));
