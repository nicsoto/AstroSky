//============================================================
//astroSky — Store de ajustes (Zustand + persistencia)
//============================================================

import { create } from 'zustand';
import type { AppSettings, BackgroundMode } from '../data/types';

//valores por defecto
const DEFAULT_SETTINGS: AppSettings = {
  backgroundMode: 'camera',
  magnitudeLimit: 4.5,
  showConstellations: true,
  showConstellationNames: true,
  showPlanetLabels: true,
  showStarLabels: true,
  showDeepSky: true,
  compassOffset: 0,
  sensorInterval: 16,
  twinkleIntensity: 0.5,
  showGrid: false,
  showCardinals: true,
  showEcliptic: false,
};

interface SettingsStore extends AppSettings {
  //acciones
  setBackgroundMode: (mode: BackgroundMode) => void;
  setMagnitudeLimit: (limit: number) => void;
  toggleConstellations: () => void;
  toggleConstellationNames: () => void;
  togglePlanetLabels: () => void;
  toggleStarLabels: () => void;
  toggleDeepSky: () => void;
  setCompassOffset: (offset: number) => void;
  setSensorInterval: (interval: number) => void;
  setTwinkleIntensity: (intensity: number) => void;
  toggleGrid: () => void;
  toggleCardinals: () => void;
  toggleEcliptic: () => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...DEFAULT_SETTINGS,

  setBackgroundMode: (mode) => set({ backgroundMode: mode }),
  setMagnitudeLimit: (limit) => set({ magnitudeLimit: Math.max(0, Math.min(8, limit)) }),
  toggleConstellations: () => set((s) => ({ showConstellations: !s.showConstellations })),
  toggleConstellationNames: () => set((s) => ({ showConstellationNames: !s.showConstellationNames })),
  togglePlanetLabels: () => set((s) => ({ showPlanetLabels: !s.showPlanetLabels })),
  toggleStarLabels: () => set((s) => ({ showStarLabels: !s.showStarLabels })),
  toggleDeepSky: () => set((s) => ({ showDeepSky: !s.showDeepSky })),
  setCompassOffset: (offset) => set({ compassOffset: offset % 360 }),
  setSensorInterval: (interval) => set({ sensorInterval: Math.max(8, Math.min(100, interval)) }),
  setTwinkleIntensity: (intensity) => set({ twinkleIntensity: Math.max(0, Math.min(1, intensity)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleCardinals: () => set((s) => ({ showCardinals: !s.showCardinals })),
  toggleEcliptic: () => set((s) => ({ showEcliptic: !s.showEcliptic })),
  resetToDefaults: () => set(DEFAULT_SETTINGS),
}));
