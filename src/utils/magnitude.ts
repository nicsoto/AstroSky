//============================================================
//astroSky — Utilidades de magnitud estelar
//============================================================

/**
 *convertir magnitud aparente a tamaño de punto en píxeles.
 *estrellas más brillantes (magnitud menor) → puntos más grandes.
 *
 *escala logarítmica inversa:
 *mag -1.5 (Sirius) → ~8px
 *mag  0.0 (Vega)   → ~5px
 *mag  1.0          → ~3.5px
 *mag  3.0          → ~2px
 *mag  6.0          → ~1px
 */
export const magnitudeToPointSize = (
  magnitude: number,
  baseSize: number = 5,
  scaleFactor: number = 1.8
): number => {
  //fórmula: size = baseSize * scaleFactor^(-mag/2.5)
  //ajustada para que mag 0 ≈ baseSize
  const size = baseSize * Math.pow(scaleFactor, -magnitude / 2.5);
  return Math.max(0.5, Math.min(12, size));
};

/**
 *convertir magnitud aparente a opacidad (alpha).
 *estrellas débiles son más transparentes.
 */
export const magnitudeToAlpha = (
  magnitude: number,
  magLimit: number = 6.5
): number => {
  if (magnitude <= 0) return 1.0;
  if (magnitude >= magLimit) return 0.15;
  //interpolación lineal-ish con curva
  const t = magnitude / magLimit;
  return Math.max(0.15, 1.0 - t * 0.7);
};

/**
 *convertir magnitud a brillo relativo (para shaders).
 *escala de flujo: 10^(-mag/2.5)
 */
export const magnitudeToFlux = (magnitude: number): number => {
  return Math.pow(10, -magnitude / 2.5);
};

/**
 *filtrar por magnitud: ¿es visible dado el límite?
 */
export const isVisible = (
  magnitude: number,
  magnitudeLimit: number
): boolean => {
  return magnitude <= magnitudeLimit;
};

/**
 *clasificación de brillo para etiquetado.
 *retorna si una estrella merece etiqueta de nombre.
 */
export const shouldShowLabel = (
  magnitude: number,
  hasProperName: boolean,
  zoomLevel: number = 1
): boolean => {
  //estrellas con nombre propio y mag < 2 siempre muestran label
  if (hasProperName && magnitude < 2.0) return true;
  //con zoom, mostrar más labels
  const threshold = 1.0 + zoomLevel * 1.5;
  return magnitude < threshold;
};

/**
 *descripción verbal de magnitud para UI.
 */
export const magnitudeDescription = (mag: number): string => {
  if (mag < -1) return 'Extremadamente brillante';
  if (mag < 0) return 'Muy brillante';
  if (mag < 1) return 'Brillante';
  if (mag < 2) return 'Notable';
  if (mag < 3) return 'Moderada';
  if (mag < 4) return 'Débil';
  if (mag < 5) return 'Muy débil';
  return 'Apenas visible';
};
