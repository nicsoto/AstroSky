//============================================================
//astroSky — Brújula HUD (indicador de dirección)
//============================================================

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import es from '../../i18n/es';
import { THEME } from '../../utils/colors';

interface CompassHUDProps {
  azimuth: number; //grados 0-360
  altitude: number; //grados -90 a 90
}

const CARDINALS = [
  { angle: 0, label: es.cardinals.N, major: true },
  { angle: 45, label: es.cardinals.NE, major: false },
  { angle: 90, label: es.cardinals.E, major: true },
  { angle: 135, label: es.cardinals.SE, major: false },
  { angle: 180, label: es.cardinals.S, major: true },
  { angle: 225, label: es.cardinals.SW, major: false },
  { angle: 270, label: es.cardinals.W, major: true },
  { angle: 315, label: es.cardinals.NW, major: false },
];

const STRIP_WIDTH = 320; //ancho visible de la tira de brújula
const TOTAL_ANGLE_VISIBLE = 90; //grados visibles en la tira

/**
 *brújula horizontal que muestra la dirección cardinal actual.
 */
export const CompassHUD: React.FC<CompassHUDProps> = ({
  azimuth,
  altitude,
}) => {
  //generar marcas de la brújula
  const marks = useMemo(() => {
    const result: Array<{
      label: string;
      offset: number;
      major: boolean;
      degreeLabel: string;
    }> = [];

    //calcular marcas cada 15 grados
    for (let deg = 0; deg < 360; deg += 15) {
      const cardinal = CARDINALS.find((c) => c.angle === deg);
      const diff = ((deg - azimuth + 540) % 360) - 180; //-180 a 180

      if (Math.abs(diff) > TOTAL_ANGLE_VISIBLE / 2 + 10) continue;

      const offset = (diff / TOTAL_ANGLE_VISIBLE) * STRIP_WIDTH;

      result.push({
        label: cardinal?.label || '',
        offset: offset + STRIP_WIDTH / 2,
        major: cardinal?.major || deg % 30 === 0,
        degreeLabel: cardinal ? '' : `${deg}°`,
      });
    }

    return result;
  }, [azimuth]);

  //dirección cardinal actual
  const currentCardinal = useMemo(() => {
    const idx = Math.round(azimuth / 45) % 8;
    return CARDINALS[idx].label;
  }, [azimuth]);

  return (
    <View style={styles.container}>
      {/* Información de altitud */}
      <View style={styles.altitudeInfo}>
        <Text style={styles.altitudeText}>
          {altitude.toFixed(0)}°
        </Text>
      </View>

      {/* Tira de brújula */}
      <View style={styles.strip}>
        {/* Indicador central */}
        <View style={styles.centerIndicator} />

        {/* Marcas */}
        {marks.map((mark, i) => (
          <View
            key={`mark_${i}`}
            style={[
              styles.markContainer,
              { left: mark.offset },
            ]}
          >
            <View
              style={[
                styles.markLine,
                mark.major ? styles.majorMark : styles.minorMark,
              ]}
            />
            {mark.label ? (
              <Text
                style={[
                  styles.markLabel,
                  mark.major && styles.majorLabel,
                ]}
              >
                {mark.label}
              </Text>
            ) : mark.degreeLabel ? (
              <Text style={styles.degreeLabel}>{mark.degreeLabel}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Dirección actual */}
      <View style={styles.directionInfo}>
        <Text style={styles.directionText}>
          {currentCardinal} · {azimuth.toFixed(0)}°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  altitudeInfo: {
    position: 'absolute',
    right: 20,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  altitudeText: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  strip: {
    width: STRIP_WIDTH,
    height: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  centerIndicator: {
    position: 'absolute',
    left: STRIP_WIDTH / 2 - 1,
    top: 0,
    width: 2,
    height: 16,
    backgroundColor: THEME.accent,
    zIndex: 2,
  },
  markContainer: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    transform: [{ translateX: -0.5 }],
  },
  markLine: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  majorMark: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  minorMark: {
    height: 6,
  },
  markLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  majorLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  degreeLabel: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    marginTop: 2,
  },
  directionInfo: {
    marginTop: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  directionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
