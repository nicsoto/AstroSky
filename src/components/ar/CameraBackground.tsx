//============================================================
//astroSky — Fondo de cámara
//============================================================

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';

/**
 *componente de fondo que muestra la cámara (modo AR)
 *o un gradiente oscuro (modo Planetario).
 */
export const CameraBackground: React.FC = () => {
  const backgroundMode = useSettingsStore((s) => s.backgroundMode);
  const setPermission = useAppStore((s) => s.setPermission);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    setPermission('camera', permission?.granted ?? false);
  }, [permission?.granted]);

  if (backgroundMode === 'planetarium' || !permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.planetariumBg} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera} 
        facing="back"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  camera: {
    flex: 1,
  },
  planetariumBg: {
    flex: 1,
    backgroundColor: '#05050f',
  },
});
