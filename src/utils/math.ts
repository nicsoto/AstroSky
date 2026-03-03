//============================================================
//astroSky — Utilidades matemáticas
//============================================================

/** Grados a radianes */
export const degToRad = (deg: number): number => deg * (Math.PI / 180);

/** Radianes a grados */
export const radToDeg = (rad: number): number => rad * (180 / Math.PI);

/** Horas a radianes */
export const hoursToRad = (hours: number): number => hours * (Math.PI / 12);

/** Radianes a horas */
export const radToHours = (rad: number): number => rad * (12 / Math.PI);

/** Horas a grados */
export const hoursToDeg = (hours: number): number => hours * 15;

/** Grados a horas */
export const degToHours = (hours: number): number => hours / 15;

/** Normalizar ángulo a rango [0, 360) */
export const normalizeAngle = (deg: number): number => {
  let result = deg % 360;
  if (result < 0) result += 360;
  return result;
};

/** Normalizar ángulo a rango [-180, 180) */
export const normalizeAngleSigned = (deg: number): number => {
  let result = normalizeAngle(deg);
  if (result >= 180) result -= 360;
  return result;
};

/** Distancia angular entre dos puntos en la esfera (en grados) */
export const angularDistance = (
  az1: number, alt1: number,
  az2: number, alt2: number
): number => {
  const a1 = degToRad(alt1);
  const a2 = degToRad(alt2);
  const dAz = degToRad(az2 - az1);
  const cosD = Math.sin(a1) * Math.sin(a2) +
    Math.cos(a1) * Math.cos(a2) * Math.cos(dAz);
  return radToDeg(Math.acos(Math.min(1, Math.max(-1, cosD))));
};

/** Interpolación lineal */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Clamp valor entre min y max */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 *convertir coordenadas ecuatoriales (RA/Dec) a cartesianas unitarias.
 *rA en horas, Dec en grados.
 *sistema: X hacia RA=0h Dec=0°, Y hacia RA=6h Dec=0°, Z hacia Dec=+90°
 */
export const equatorialToCartesian = (
  raHours: number,
  decDeg: number
): [number, number, number] => {
  const ra = hoursToRad(raHours);
  const dec = degToRad(decDeg);
  const cosDec = Math.cos(dec);
  return [
    cosDec * Math.cos(ra),
    cosDec * Math.sin(ra),
    Math.sin(dec),
  ];
};

/**
 *convertir coordenadas horizontales (Az/Alt) a cartesianas unitarias.
 *az en grados (0=Norte, 90=Este), Alt en grados.
 *sistema: X hacia Norte, Y hacia Este, Z hacia Zénit
 */
export const horizontalToCartesian = (
  azDeg: number,
  altDeg: number
): [number, number, number] => {
  const az = degToRad(azDeg);
  const alt = degToRad(altDeg);
  const cosAlt = Math.cos(alt);
  return [
    cosAlt * Math.cos(az),
    cosAlt * Math.sin(az),
    Math.sin(alt),
  ];
};

/**
 *construir la matriz de rotación 3x3 que transforma
 *coordenadas cartesianas ecuatoriales → horizontales.
 *
 *parámetros:
 * - lst: Tiempo Sidéreo Local en horas
 * - lat: Latitud del observador en grados
 *
 *retorna un Float64Array de 9 elementos (row-major 3x3).
 */
export const buildEquatorialToHorizontalMatrix = (
  lstHours: number,
  latDeg: number
): Float64Array => {
  const lst = hoursToRad(lstHours);
  const lat = degToRad(latDeg);

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLst = Math.sin(lst);
  const cosLst = Math.cos(lst);

  //la transformación es:
  //1. Rotar por -LST alrededor del eje Z (hora sidérea)
  //2. Rotar por -(90°-lat) alrededor del eje Y (latitud)
  //
  //az se mide desde el Norte, hacia el Este.
  //alt se mide desde el horizonte.
  //
  //en coordenadas ecuatoriales cartesianas:
  //x_eq = cos(dec)*cos(ra)
  //y_eq = cos(dec)*sin(ra)
  //z_eq = sin(dec)
  //
  //hour angle H = LST - RA
  //
  //horizontal cartesianas (x=Norte, y=Este, z=Zénit):
  //x_hz = -sin(lat)*cos(H)*cos(dec) + cos(lat)*sin(dec)
  //y_hz = -sin(H)*cos(dec)
  //z_hz =  cos(lat)*cos(H)*cos(dec) + sin(lat)*sin(dec)
  //
  //expandiendo cos(H) = cos(LST)*cos(RA) + sin(LST)*sin(RA)
  //y sin(H) = sin(LST)*cos(RA) - cos(LST)*sin(RA)

  const m = new Float64Array(9);

  //row 0: x_hz (Norte)
  m[0] = -sinLat * cosLst;   //coef de x_eq
  m[1] = -sinLat * sinLst;   //coef de y_eq
  m[2] = cosLat;              //coef de z_eq

  //row 1: y_hz (Este) — nota: sin(H) = sin(LST-RA), expandido
  m[3] = sinLst;              //coef de x_eq: -(-sin(LST)) = sin(LST)
  m[4] = -cosLst;             //coef de y_eq: -(cos(LST)) = -cos(LST)
  m[5] = 0;                   //coef de z_eq

  //row 2: z_hz (Zénit)
  m[6] = cosLat * cosLst;    //coef de x_eq
  m[7] = cosLat * sinLst;    //coef de y_eq
  m[8] = sinLat;              //coef de z_eq

  return m;
};

/**
 *aplicar una matriz 3x3 (row-major) a un vector [x,y,z].
 *retorna [x', y', z'].
 */
export const applyMatrix3 = (
  m: Float64Array,
  x: number, y: number, z: number
): [number, number, number] => {
  return [
    m[0] * x + m[1] * y + m[2] * z,
    m[3] * x + m[4] * y + m[5] * z,
    m[6] * x + m[7] * y + m[8] * z,
  ];
};

/**
 *convertir cartesianas horizontales (N,E,Zénit) a (Az, Alt) en grados.
 */
export const cartesianToHorizontal = (
  xN: number, yE: number, zUp: number
): [number, number] => {
  const alt = radToDeg(Math.asin(clamp(zUp, -1, 1)));
  let az = radToDeg(Math.atan2(yE, xN));
  if (az < 0) az += 360;
  return [az, alt];
};

/**
 *cuaternión: [w, x, y, z]
 */
export type Quaternion = [number, number, number, number];

/** Multiplicar dos cuaterniones */
export const quaternionMultiply = (
  a: Quaternion,
  b: Quaternion
): Quaternion => {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
};

/** Conjugado de un cuaternión */
export const quaternionConjugate = (q: Quaternion): Quaternion => {
  return [q[0], -q[1], -q[2], -q[3]];
};

/** Normalizar cuaternión */
export const quaternionNormalize = (q: Quaternion): Quaternion => {
  const len = Math.sqrt(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2);
  if (len === 0) return [1, 0, 0, 0];
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
};

/** SLERP entre dos cuaterniones */
export const quaternionSlerp = (
  a: Quaternion,
  b: Quaternion,
  t: number
): Quaternion => {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

  //si el dot es negativo, invertir uno para tomar el camino corto
  const bSign: Quaternion = dot < 0
    ? (dot = -dot, [-b[0], -b[1], -b[2], -b[3]])
    : [...b];

  if (dot > 0.9995) {
    //muy cercanos: interpolar linealmente
    return quaternionNormalize([
      lerp(a[0], bSign[0], t),
      lerp(a[1], bSign[1], t),
      lerp(a[2], bSign[2], t),
      lerp(a[3], bSign[3], t),
    ]);
  }

  const theta = Math.acos(clamp(dot, -1, 1));
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;

  return [
    wa * a[0] + wb * bSign[0],
    wa * a[1] + wb * bSign[1],
    wa * a[2] + wb * bSign[2],
    wa * a[3] + wb * bSign[3],
  ];
};
