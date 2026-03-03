//============================================================
//astroSky — Pantalla principal (vista AR/Planetario)
//============================================================

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraBackground } from '../src/components/ar/CameraBackground';
import { ARScene } from '../src/components/ar/ARScene';
import { CompassHUD } from '../src/components/ui/CompassHUD';
import { InfoPanel } from '../src/components/ui/InfoPanel';
import { SearchBar } from '../src/components/ui/SearchBar';
import { MagnitudeSlider } from '../src/components/ui/MagnitudeSlider';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useLocation } from '../src/hooks/useLocation';
import { useStarCatalog } from '../src/hooks/useStarCatalog';
import { useSkyPosition } from '../src/hooks/useSkyPosition';
import { findNearestObject } from '../src/hooks/useVisibleObjects';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useAppStore } from '../src/store/useAppStore';
import { projectToScreen, DEFAULT_CAMERA_FOV_H } from '../src/engine/projection';
import es from '../src/i18n/es';
import { THEME } from '../src/utils/colors';
import type { SelectedObject } from '../src/data/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function MainScreen() {
  const router = useRouter();

  //===== Hooks =====
  const { orientation, magnetometerAccuracy } = useDeviceOrientation();
  const { location } = useLocation();
  const { starCatalog, constellationCatalog, loading, error } = useStarCatalog();
  const { getStarPositions, planets } = useSkyPosition({
    starCatalog,
    orientation,
    location,
  });

  //===== Stores =====
  const backgroundMode = useSettingsStore((s) => s.backgroundMode);
  const selectedObject = useAppStore((s) => s.selectedObject);
  const selectObject = useAppStore((s) => s.selectObject);
  const setTrajectoryPoints = useAppStore((s) => s.setTrajectoryPoints);
  const setIsNight = useAppStore((s) => s.setIsNight);

  //===== Estado local =====
  const [showMagnitudeSlider, setShowMagnitudeSlider] = useState(false);

  //===== Tap en el cielo para seleccionar objeto =====
  const handleSkyTap = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;

      if (!starCatalog || !location) return;

      //convertir coordenadas de pantalla a azimut/altitud
      const fovH = DEFAULT_CAMERA_FOV_H;
      const fovV = fovH * (SCREEN_H / SCREEN_W);
      const tapAz =
        orientation.azimuth +
        ((locationX - SCREEN_W / 2) / SCREEN_W) * fovH;
      const tapAlt =
        orientation.altitude -
        ((locationY - SCREEN_H / 2) / SCREEN_H) * fovV;

      //buscar el objeto más cercano al punto tocado
      const nearest = findNearestObject(
        tapAz,
        tapAlt,
        starCatalog,
        planets,
        location,
        8 //grados de tolerancia
      );

      if (nearest) {
        selectObject(nearest);
      } else {
        selectObject(null);
        setTrajectoryPoints([]);
      }
    },
    [starCatalog, planets, orientation, location]
  );

  //===== Seleccionar objeto desde búsqueda =====
  const handleSearchSelect = useCallback(
    (object: any) => {
      selectObject(object);
    },
    []
  );

  //===== Cerrar panel de info =====
  const handleCloseInfo = useCallback(() => {
    selectObject(null);
    setTrajectoryPoints([]);
  }, []);

  //===== Loading screen =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔭</Text>
        <Text style={styles.loadingLabel}>{es.loading}</Text>
        <Text style={styles.loadingSubLabel}>
          Preparando catálogo estelar...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Capa 1: Fondo (cámara o planetario) */}
      <CameraBackground />

      {/* Capa 2: Escena 3D (Three.js) */}
      <ARScene
        orientation={orientation}
        starCatalog={starCatalog}
        constellationCatalog={constellationCatalog}
        location={location}
        planets={planets}
      />

      {/* Capa 3: Área de interacción táctil */}
      <View
        style={styles.touchLayer}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleSkyTap}
      />

      {/* Capa 4: UI Overlay */}
      <View style={styles.uiLayer} pointerEvents="box-none">
        {/* Brújula HUD arriba */}
        <CompassHUD
          azimuth={orientation.azimuth}
          altitude={orientation.altitude}
        />

        {/* Barra de búsqueda */}
        <SearchBar
          starCatalog={starCatalog}
          onSelectObject={handleSearchSelect}
          planets={planets}
        />

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          {/* Toggle modo AR/Planetario */}
          <ActionButton
            icon={backgroundMode === 'camera' ? '🎥' : '🌌'}
            label={
              backgroundMode === 'camera'
                ? es.main.modeAR
                : es.main.modePlanetarium
            }
            onPress={() => {
              useSettingsStore.getState().setBackgroundMode(
                backgroundMode === 'camera' ? 'planetarium' : 'camera'
              );
            }}
          />

          {/* Toggle magnitud */}
          <ActionButton
            icon="★"
            label={es.settings.magnitudeLimit}
            onPress={() => setShowMagnitudeSlider((v) => !v)}
          />

          {/* Calibrar */}
          <ActionButton
            icon="🧭"
            label={es.main.calibrate}
            onPress={() => router.push('/calibration')}
          />

          {/* Ajustes */}
          <ActionButton
            icon="⚙️"
            label={es.main.settings}
            onPress={() => router.push('/settings')}
          />
        </View>

        {/* Slider de magnitud */}
        {showMagnitudeSlider && <MagnitudeSlider />}

        {/* Panel de información */}
        {selectedObject && (
          <InfoPanel
            selectedObject={selectedObject}
            location={location}
            onClose={handleCloseInfo}
          />
        )}

        {/* Indicador apuntar al cielo */}
        {orientation.altitude < 10 && !selectedObject && (
          <View style={styles.pointUpHint}>
            <Text style={styles.pointUpText}>☝️ {es.main.pointUp}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

//===== Botón de acción circular =====
const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubLabel: {
    color: THEME.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  actionButtons: {
    position: 'absolute',
    right: 14,
    bottom: 100,
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 15, 30, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionIcon: {
    fontSize: 20,
  },
  pointUpHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pointUpText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
