//============================================================
//astroSky — Pantalla de calibración de brújula
//============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useSettingsStore } from '../src/store/useSettingsStore';
import es from '../src/i18n/es';
import { THEME } from '../src/utils/colors';

export default function CalibrationScreen() {
  const router = useRouter();
  const orientation = useDeviceOrientation();
  const compassOffset = useSettingsStore((s) => s.compassOffset);
  const setCompassOffset = useSettingsStore((s) => s.setCompassOffset);

  const [manualOffset, setManualOffset] = useState(compassOffset);
  const [calibrationQuality, setCalibrationQuality] = useState<
    'poor' | 'fair' | 'good' | 'excellent'
  >('fair');

  //animación del "8" indicador
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  //evaluar calidad basada en varianza del magnetómetro
  useEffect(() => {
    const acc = orientation.magnetometerAccuracy;
    if (acc >= 3) setCalibrationQuality('excellent');
    else if (acc >= 2) setCalibrationQuality('good');
    else if (acc >= 1) setCalibrationQuality('fair');
    else setCalibrationQuality('poor');
  }, [orientation.magnetometerAccuracy]);

  const qualityLabel = es.calibration[calibrationQuality];
  const qualityColor =
    calibrationQuality === 'excellent'
      ? '#4CAF50'
      : calibrationQuality === 'good'
        ? '#8BC34A'
        : calibrationQuality === 'fair'
          ? '#FFC107'
          : '#F44336';

  const handleDone = () => {
    setCompassOffset(manualOffset);
    router.back();
  };

  //animación circular (rotación para indicar que muevan el teléfono)
  const rotate = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {es.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{es.calibration.title}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          {/* Instrucción animada */}
          <Animated.View
            style={[
              styles.animCircle,
              { transform: [{ rotate }] },
            ]}
          >
            <Text style={styles.animNumber}>8</Text>
          </Animated.View>

          <Text style={styles.instruction}>
            {es.calibration.instruction}
          </Text>

          {/* Indicador de calidad */}
          <View style={styles.qualitySection}>
            <Text style={styles.qualityLabel}>
              {es.calibration.quality}
            </Text>
            <View style={styles.qualityBar}>
              <View
                style={[
                  styles.qualityFill,
                  {
                    width:
                      calibrationQuality === 'poor'
                        ? '25%'
                        : calibrationQuality === 'fair'
                          ? '50%'
                          : calibrationQuality === 'good'
                            ? '75%'
                            : '100%',
                    backgroundColor: qualityColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.qualityValue, { color: qualityColor }]}>
              {qualityLabel}
            </Text>
          </View>

          {/* Lectura actual */}
          <View style={styles.readingSection}>
            <Text style={styles.readingLabel}>Azimut actual</Text>
            <Text style={styles.readingValue}>
              {orientation.orientation.azimuth.toFixed(1)}°
            </Text>
          </View>

          {/* Ajuste manual */}
          <View style={styles.manualSection}>
            <Text style={styles.manualLabel}>
              {es.calibration.manualOffset}
            </Text>
            <View style={styles.offsetControls}>
              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => setManualOffset((v) => v - 5)}
              >
                <Text style={styles.offsetBtnText}>−5°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => setManualOffset((v) => v - 1)}
              >
                <Text style={styles.offsetBtnText}>−1°</Text>
              </TouchableOpacity>
              <Text style={styles.offsetValue}>{manualOffset.toFixed(0)}°</Text>
              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => setManualOffset((v) => v + 1)}
              >
                <Text style={styles.offsetBtnText}>+1°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => setManualOffset((v) => v + 5)}
              >
                <Text style={styles.offsetBtnText}>+5°</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.tip}>{es.calibration.tip}</Text>

          {/* Botón Listo */}
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>{es.calibration.done}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: { width: 60 },
  backBtnText: { color: THEME.accent, fontSize: 15 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  animCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  animNumber: {
    color: THEME.accent,
    fontSize: 48,
    fontWeight: '200',
  },
  instruction: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  qualitySection: {
    width: '100%',
    marginBottom: 24,
  },
  qualityLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  qualityBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 3,
  },
  qualityValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  readingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  readingLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  readingValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manualSection: {
    width: '100%',
    marginBottom: 20,
  },
  manualLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  offsetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  offsetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  offsetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  offsetValue: {
    color: THEME.accent,
    fontSize: 22,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
  },
  tip: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  doneBtn: {
    backgroundColor: THEME.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 50,
  },
  doneBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
