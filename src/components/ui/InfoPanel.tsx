//============================================================
//astroSky — Panel de información de objeto celeste
//============================================================

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { SelectedObject, TrajectoryPoint, ObserverLocation } from '../../data/types';
import { useAppStore } from '../../store/useAppStore';
import { calculateTrajectory, calculateStarTrajectory, getNextRiseSet } from '../../engine/astronomy';
import { formatTime } from '../../engine/time';
import es from '../../i18n/es';
import { THEME } from '../../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.4;

interface InfoPanelProps {
  selectedObject: SelectedObject;
  location: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

/**
 *panel deslizable inferior que muestra información del objeto seleccionado.
 */
export const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedObject,
  location,
  onClose,
}) => {
  const { object } = selectedObject;
  const setTrajectoryPoints = useAppStore((s) => s.setTrajectoryPoints);
  const trajectoryPoints = useAppStore((s) => s.trajectoryPoints);
  const showingTrajectory = trajectoryPoints.length > 0;

  const displayName = object.nameEs || object.name;

  //tipo de objeto localizado
  const objectTypeLabel = useMemo(() => {
    const type = object.type;
    return es.objectTypes[type as keyof typeof es.objectTypes] || type;
  }, [object.type]);

  //formatear distancia
  const formattedDistance = useMemo(() => {
    const obj = object as any;
    const dist = obj.distance || obj.distanceAU;
    if (!dist) return null;

    if (object.type === 'planet' || object.type === 'moon' || object.type === 'sun') {
      return `${dist.toFixed(3)} ${es.info.au}`;
    }
    if (dist > 1000) {
      return `${(dist / 1000).toFixed(1)}k ${es.info.lightYears}`;
    }
    return `${dist.toFixed(1)} ${es.info.lightYears}`;
  }, [object]);

  //formatear coordenadas
  const raFormatted = useMemo(() => {
    const h = Math.floor(object.ra);
    const m = Math.floor((object.ra - h) * 60);
    const s = ((object.ra - h - m / 60) * 3600).toFixed(1);
    return `${h}h ${m}m ${s}s`;
  }, [object.ra]);

  const decFormatted = useMemo(() => {
    const sign = object.dec >= 0 ? '+' : '';
    const d = Math.floor(Math.abs(object.dec));
    const m = Math.floor((Math.abs(object.dec) - d) * 60);
    return `${sign}${d}° ${m}'`;
  }, [object.dec]);

  //toggle trayectoria
  const handleToggleTrajectory = useCallback(() => {
    if (showingTrajectory) {
      setTrajectoryPoints([]);
    } else if (location) {
      let points: TrajectoryPoint[];

      const loc: ObserverLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: (location as any).elevation ?? 0,
      };

      if (object.type === 'planet' || object.type === 'sun' || object.type === 'moon') {
        points = calculateTrajectory(
          object.name,
          new Date(),
          loc,
          24,
          15 //cada 15 min
        );
      } else {
        points = calculateStarTrajectory(
          object.ra,
          object.dec,
          new Date(),
          loc,
          24,
          15
        );
      }

      setTrajectoryPoints(points);
    }
  }, [showingTrajectory, location, object]);

  return (
    <View style={styles.container}>
      {/* Handle del panel */}
      <View style={styles.handle}>
        <View style={styles.handleBar} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.subtitle}>{objectTypeLabel}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Cuerpo con scroll */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Información básica */}
        <View style={styles.section}>
          <InfoRow label={es.info.magnitude} value={object.magnitude.toFixed(2)} />
          <InfoRow label={es.info.rightAscension} value={raFormatted} />
          <InfoRow label={es.info.declination} value={decFormatted} />
          {formattedDistance && (
            <InfoRow label={es.info.distance} value={formattedDistance} />
          )}
          {'spectralType' in object && (object as any).spectralType && (
            <InfoRow
              label={es.info.spectralType}
              value={(object as any).spectralType}
            />
          )}
          {'constellation' in object && (object as any).constellation && (
            <InfoRow
              label={es.info.constellation}
              value={
                es.constellationNames[
                  (object as any).constellation as keyof typeof es.constellationNames
                ] || (object as any).constellation
              }
            />
          )}
        </View>

        {/* Coordenadas horizontales actuales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posición actual</Text>
          <InfoRow
            label={es.info.azimuth}
            value={`${selectedObject.horizontalPosition?.azimuth?.toFixed(1) ?? '—'}°`}
          />
          <InfoRow
            label={es.info.altitude}
            value={`${selectedObject.horizontalPosition?.altitude?.toFixed(1) ?? '—'}°`}
          />
        </View>

        {/* Descripción si existe */}
        {'description' in object && (object as any).description && (
          <View style={styles.section}>
            <Text style={styles.description}>
              {(object as any).description}
            </Text>
          </View>
        )}

        {/* Botón trayectoria */}
        <TouchableOpacity
          style={[
            styles.trajectoryBtn,
            showingTrajectory && styles.trajectoryBtnActive,
          ]}
          onPress={handleToggleTrajectory}
        >
          <Text style={styles.trajectoryBtnText}>
            {showingTrajectory ? es.info.hideTrajectory : es.info.showTrajectory}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

/** Fila de información clave-valor */
const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: PANEL_HEIGHT,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 30,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoLabel: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 20,
  },
  trajectoryBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: THEME.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trajectoryBtnActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
  },
  trajectoryBtnText: {
    color: THEME.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
