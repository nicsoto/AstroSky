//============================================================
//astroSky — Slider de límite de magnitud
//============================================================

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  PanResponder,
  Dimensions,
} from 'react-native';
import es from '../../i18n/es';
import { THEME } from '../../utils/colors';
import { useSettingsStore } from '../../store/useSettingsStore';

const SLIDER_WIDTH = 200;
const SLIDER_HEIGHT = 28;
const KNOB_SIZE = 22;
const MIN_MAG = 1;
const MAX_MAG = 7;

/**
 *slider compacto para ajustar el límite de magnitud visible.
 *aparece en la esquina inferior de la pantalla principal.
 */
export const MagnitudeSlider: React.FC = () => {
  const magnitudeLimit = useSettingsStore((s) => s.magnitudeLimit);
  const setMagnitudeLimit = useSettingsStore((s) => s.setMagnitudeLimit);

  const [dragging, setDragging] = useState(false);

  //calcular posición del knob
  const fraction = (magnitudeLimit - MIN_MAG) / (MAX_MAG - MIN_MAG);
  const knobX = fraction * (SLIDER_WIDTH - KNOB_SIZE);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setDragging(true);
    },
    onPanResponderMove: (_, gestureState) => {
      const pos = knobX + gestureState.dx;
      const clamped = Math.max(0, Math.min(SLIDER_WIDTH - KNOB_SIZE, pos));
      const newFraction = clamped / (SLIDER_WIDTH - KNOB_SIZE);
      const newValue = MIN_MAG + newFraction * (MAX_MAG - MIN_MAG);
      setMagnitudeLimit(Math.round(newValue * 10) / 10);
    },
    onPanResponderRelease: () => {
      setDragging(false);
    },
  });

  //etiqueta descriptiva
  const magLabel = magnitudeLimit <= 2
    ? es.magnitudeDesc.veryBright
    : magnitudeLimit <= 3
      ? es.magnitudeDesc.bright
      : magnitudeLimit <= 4
        ? es.magnitudeDesc.moderate
        : magnitudeLimit <= 5
          ? es.magnitudeDesc.faint
          : magnitudeLimit <= 6
            ? es.magnitudeDesc.veryFaint
            : es.magnitudeDesc.barelyVisible;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>★ {es.settings.magnitudeLimit}</Text>
        <Text style={styles.valueText}>
          {magnitudeLimit.toFixed(1)} · {magLabel}
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        {/* Pista */}
        <View style={styles.track}>
          <View
            style={[styles.trackFill, { width: knobX + KNOB_SIZE / 2 }]}
          />
        </View>

        {/* Knob */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.knob,
            {
              left: knobX,
              transform: dragging ? [{ scale: 1.2 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Text style={styles.knobText}>⬤</Text>
        </View>

        {/* Etiquetas de rango */}
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>{MIN_MAG}</Text>
          <Text style={styles.rangeText}>{MAX_MAG}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    borderRadius: 14,
    padding: 12,
    zIndex: 15,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  valueText: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '500',
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    position: 'relative',
  },
  track: {
    position: 'absolute',
    top: KNOB_SIZE / 2 - 2,
    left: KNOB_SIZE / 2,
    right: KNOB_SIZE / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.accent,
  },
  knob: {
    position: 'absolute',
    top: 0,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  knobText: {
    fontSize: 8,
    color: '#000',
  },
  rangeRow: {
    position: 'absolute',
    top: KNOB_SIZE + 2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 9,
  },
});
