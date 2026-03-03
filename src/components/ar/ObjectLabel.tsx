//============================================================
//astroSky — Etiquetas de objetos celestes (React Native)
//============================================================

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { ScreenPosition, CelestialObject } from '../../data/types';
import { THEME } from '../../utils/colors';

interface ObjectLabelProps {
  object: CelestialObject;
  screenPosition: ScreenPosition;
  onPress?: () => void;
  visible?: boolean;
}

/**
 *etiqueta flotante que se muestra sobre un objeto celeste.
 */
export const ObjectLabel: React.FC<ObjectLabelProps> = ({
  object,
  screenPosition,
  onPress,
  visible = true,
}) => {
  if (!visible) return null;

  const displayName = object.nameEs || object.name;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          left: screenPosition.x - 40,
          top: screenPosition.y - 30,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.labelBg}>
        <Text style={styles.labelText} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.magnitudeText}>
          mag {object.magnitude.toFixed(1)}
        </Text>
      </View>
      {/* Línea apuntando al objeto */}
      <View style={styles.pointer} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  labelBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: THEME.accent,
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 120,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  magnitudeText: {
    color: THEME.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
  pointer: {
    width: 1,
    height: 8,
    backgroundColor: THEME.accent,
  },
});
