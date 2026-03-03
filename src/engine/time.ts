//============================================================
//astroSky — Cálculos de tiempo astronómico
//============================================================

/**
 *calcular Día Juliano a partir de una fecha JavaScript.
 */
export const dateToJulianDay = (date: Date): number => {
  return date.getTime() / 86400000 + 2440587.5;
};

/**
 *calcular el siglo juliano J2000.0 (T).
 *t = (JD - 2451545.0) / 36525
 */
export const julianCentury = (date: Date): number => {
  const jd = dateToJulianDay(date);
  return (jd - 2451545.0) / 36525;
};

/**
 *calcular el Tiempo Sidéreo Medio de Greenwich (GMST) en horas.
 *fórmula de Meeus, "Astronomical Algorithms".
 */
export const greenwichMeanSiderealTime = (date: Date): number => {
  const jd = dateToJulianDay(date);
  const T = (jd - 2451545.0) / 36525;

  //ángulo en grados
  let gmst = 280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    T * T * T / 38710000;

  //normalizar a [0, 360)
  gmst = ((gmst % 360) + 360) % 360;

  //convertir a horas
  return gmst / 15;
};

/**
 *calcular el Tiempo Sidéreo Local (LST) en horas.
 *lST = GMST + longitud/15
 *
 * @param date - Fecha/hora actual (UTC internamente)
 * @param longitudeDeg - Longitud del observador en grados (+Este, -Oeste)
 */
export const localSiderealTime = (
  date: Date,
  longitudeDeg: number
): number => {
  const gmst = greenwichMeanSiderealTime(date);
  let lst = gmst + longitudeDeg / 15;
  lst = ((lst % 24) + 24) % 24;
  return lst;
};

/**
 *calcular el Ángulo Horario de un objeto.
 *h = LST - RA (en horas)
 */
export const hourAngle = (lstHours: number, raHours: number): number => {
  let ha = lstHours - raHours;
  ha = ((ha % 24) + 24) % 24;
  if (ha > 12) ha -= 24;
  return ha;
};

/**
 * ¿Es de noche? Chequeo simple basado en la altitud del Sol.
 *retorna true si el Sol está más de 6° por debajo del horizonte
 * (crepúsculo civil terminado).
 */
export const isNightTime = (sunAltitude: number): boolean => {
  return sunAltitude < -6;
};

/**
 *fase del día basada en la altitud del Sol.
 */
export type DayPhase = 'night' | 'astronomical_twilight' | 'nautical_twilight' | 'civil_twilight' | 'day';

export const getDayPhase = (sunAltitude: number): DayPhase => {
  if (sunAltitude < -18) return 'night';
  if (sunAltitude < -12) return 'astronomical_twilight';
  if (sunAltitude < -6) return 'nautical_twilight';
  if (sunAltitude < 0) return 'civil_twilight';
  return 'day';
};

/**
 *formatear hora local desde un Date.
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 *formatear fecha.
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
