//============================================================
//astroSky — Conversión de índice de color B-V a color RGB
//============================================================

/**
 *convertir índice de color B-V a color RGB.
 *basado en la tabla de Color-Temperature de Mitchell Charity,
 *con interpolación para colores continuos.
 *
 *b-V típicos:
 *  -0.40  →  Azul intenso (tipo O)
 *  -0.20  →  Azul-blanco (tipo B)
 *   0.00  →  Blanco (tipo A, ej: Vega, Sirius)
 *   0.30  →  Blanco-amarillo (tipo F)
 *   0.60  →  Amarillo (tipo G, ej: Sol)
 *   0.80  →  Naranja-amarillo (tipo K)
 *   1.20  →  Naranja (tipo K tardío)
 *   1.60  →  Rojo-naranja (tipo M, ej: Betelgeuse)
 *   2.00  →  Rojo profundo
 */
export const bvToRGB = (bv: number): [number, number, number] => {
  //clamp al rango válido
  const t = Math.max(-0.4, Math.min(2.0, bv));

  let r: number, g: number, b: number;

  //componente R
  if (t < 0.0) {
    r = 0.61 + 0.11 * t + 0.1 * t * t;
  } else if (t < 0.4) {
    r = 0.83 + 0.17 * t;
  } else {
    r = 1.0;
  }

  //componente G
  if (t < 0.0) {
    g = 0.70 + 0.07 * t + 0.1 * t * t;
  } else if (t < 0.4) {
    g = 0.87 + 0.11 * t;
  } else if (t < 1.6) {
    g = 1.0 - 0.47 * (t - 0.4);
  } else {
    g = 0.44 - 0.32 * (t - 1.6);
  }

  //componente B
  if (t < -0.1) {
    b = 1.0;
  } else if (t < 0.5) {
    b = 1.0 - 1.67 * (t + 0.1);
  } else {
    b = 0.0;
  }

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
};

/**
 *convertir B-V a string hexadecimal (#RRGGBB)
 */
export const bvToHex = (bv: number): string => {
  const [r, g, b] = bvToRGB(bv);
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 *colores predefinidos para planetas
 */
export const PLANET_COLORS: Record<string, string> = {
  Mercury: '#b0b0b0',
  Venus: '#fffde0',
  Mars: '#e06040',
  Jupiter: '#d4a574',
  Saturn: '#f0d890',
  Uranus: '#b0e0e6',
  Neptune: '#4169e1',
  Pluto: '#c4a882',
  Sun: '#fff44f',
  Moon: '#f5f5dc',
};

/**
 *colores de fondo para el modo planetario (gradiente cielo nocturno)
 */
export const SKY_COLORS = {
  zenith: '#000010',       //negro-azulado en el zénit
  horizon: '#0a0a2e',      //azul muy oscuro en el horizonte
  twilight: '#1a0a3e',     //crepúsculo
  dayHorizon: '#87CEEB',   //azul cielo de día
  dayZenith: '#4a90d9',    //azul profundo de día
};

/**
 *color del tema de la app
 */
export const THEME = {
  primary: '#5b9bd5',
  primaryLight: '#8ec4f0',
  accent: '#ffd700',
  background: '#0a0a1a',
  surface: '#151530',
  surfaceLight: '#202050',
  text: '#ffffff',
  textSecondary: '#a0a0c0',
  textMuted: '#606080',
  danger: '#ff4040',
  success: '#40ff60',
  constellationLine: '#4488cc',
  constellationLineGlow: '#6699dd',
  trajectoryLine: '#ffd700',
  gridLine: '#1a1a4a',
  cardinalN: '#ff4040',
  cardinalS: '#40a0ff',
  cardinalE: '#ffcc00',
  cardinalW: '#40ff80',
};
