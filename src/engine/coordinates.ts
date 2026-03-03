//============================================================
//astroSky — Sistema de coordenadas celestes
//============================================================

import {
  degToRad,
  radToDeg,
  hoursToRad,
  equatorialToCartesian,
  buildEquatorialToHorizontalMatrix,
  applyMatrix3,
  cartesianToHorizontal,
} from '../utils/math';
import { localSiderealTime } from './time';
import type { EquatorialCoords, HorizontalCoords, ObserverLocation } from '../data/types';

/**
 *convertir coordenadas ecuatoriales (RA/Dec) a horizontales (Az/Alt)
 *para un observador dado en un momento dado.
 *
 *esta es la función individual — úsala para objetos únicos (planetas, etc).
 *para miles de estrellas, usa la versión con matriz batch.
 */
export const equatorialToHorizontal = (
  ra: number,  //horas
  dec: number, //grados
  date: Date,
  observer: ObserverLocation
): HorizontalCoords => {
  const lst = localSiderealTime(date, observer.longitude);
  const matrix = buildEquatorialToHorizontalMatrix(lst, observer.latitude);

  const [ex, ey, ez] = equatorialToCartesian(ra, dec);
  const [hx, hy, hz] = applyMatrix3(matrix, ex, ey, ez);
  const [azimuth, altitude] = cartesianToHorizontal(hx, hy, hz);

  return { azimuth, altitude };
};

/**
 *convertir un batch de estrellas de ecuatorial a horizontal
 *usando una sola matriz de rotación.
 *
 * @param cartesianPositions - Float32Array con posiciones cartesianas ecuatoriales
 *                             [x0,y0,z0, x1,y1,z1, ...]
 * @param date - Fecha/hora actual
 * @param observer - Ubicación del observador
 * @param output - Float32Array de salida para posiciones horizontales [az,alt, az,alt, ...]
 *                 (se crea si no se provee)
 * @returns Float32Array con [az0,alt0, az1,alt1, ...] en grados
 */
export const batchEquatorialToHorizontal = (
  cartesianPositions: Float32Array,
  date: Date,
  observer: ObserverLocation,
  output?: Float32Array
): Float32Array => {
  const numStars = cartesianPositions.length / 3;
  const result = output || new Float32Array(numStars * 2);

  const lst = localSiderealTime(date, observer.longitude);
  const m = buildEquatorialToHorizontalMatrix(lst, observer.latitude);

  for (let i = 0; i < numStars; i++) {
    const i3 = i * 3;
    const i2 = i * 2;

    const ex = cartesianPositions[i3];
    const ey = cartesianPositions[i3 + 1];
    const ez = cartesianPositions[i3 + 2];

    //aplicar matriz
    const hx = m[0] * ex + m[1] * ey + m[2] * ez;
    const hy = m[3] * ex + m[4] * ey + m[5] * ez;
    const hz = m[6] * ex + m[7] * ey + m[8] * ez;

    //convertir a Az/Alt
    const alt = radToDeg(Math.asin(Math.max(-1, Math.min(1, hz))));
    let az = radToDeg(Math.atan2(hy, hx));
    if (az < 0) az += 360;

    result[i2] = az;
    result[i2 + 1] = alt;
  }

  return result;
};

/**
 *convertir un batch de posiciones ecuatoriales cartesianas a posiciones
 * 3D en el sistema de coordenadas horizontal (para Three.js).
 *
 *sistema Three.js: X=Este, Y=Arriba(Zénit), Z=Sur (por convención)
 *pero lo adaptamos: X=Este, Y=Zénit, Z=-Norte
 *
 * @param cartesianPositions - Posiciones ecuatoriales [x,y,z, ...]
 * @param date - Fecha actual
 * @param observer - Ubicación
 * @param radius - Radio de la esfera celeste en unidades Three.js
 * @param output - Buffer de salida Three.js [x,y,z, ...]
 */
export const batchEquatorialToThreeJS = (
  cartesianPositions: Float32Array,
  date: Date,
  observer: ObserverLocation,
  radius: number,
  output?: Float32Array
): Float32Array => {
  const numStars = cartesianPositions.length / 3;
  const result = output || new Float32Array(numStars * 3);

  const lst = localSiderealTime(date, observer.longitude);
  const m = buildEquatorialToHorizontalMatrix(lst, observer.latitude);

  for (let i = 0; i < numStars; i++) {
    const i3 = i * 3;

    const ex = cartesianPositions[i3];
    const ey = cartesianPositions[i3 + 1];
    const ez = cartesianPositions[i3 + 2];

    //horizontal: hx=Norte, hy=Este, hz=Zénit
    const hx = m[0] * ex + m[1] * ey + m[2] * ez;
    const hy = m[3] * ex + m[4] * ey + m[5] * ez;
    const hz = m[6] * ex + m[7] * ey + m[8] * ez;

    //three.js: X=Este, Y=Zénit, Z=-Norte (cámara mira hacia -Z)
    //pero en nuestra escena la cámara rota, así que usamos:
    //three.js X = Este (hy)
    //three.js Y = Zénit (hz)
    //three.js Z = -Norte (-hx)
    result[i3] = hy * radius;
    result[i3 + 1] = hz * radius;
    result[i3 + 2] = -hx * radius;
  }

  return result;
};

/**
 *convertir una posición horizontal (Az/Alt) a posición 3D para Three.js.
 *para objetos individuales (planetas, etc.).
 */
export const horizontalToThreeJS = (
  azimuth: number, //grados
  altitude: number, //grados
  radius: number
): [number, number, number] => {
  const az = degToRad(azimuth);
  const alt = degToRad(altitude);
  const cosAlt = Math.cos(alt);

  //horizontal: N=cos(az)*cos(alt), E=sin(az)*cos(alt), Up=sin(alt)
  const hN = cosAlt * Math.cos(az);
  const hE = cosAlt * Math.sin(az);
  const hUp = Math.sin(alt);

  //three.js: X=E, Y=Up, Z=-N
  return [hE * radius, hUp * radius, -hN * radius];
};

/**
 *verificar si un objeto con coordenadas (Az,Alt) está dentro del
 *campo de visión de la cámara apuntando en la dirección dada.
 *
 * @param objectAz - Azimut del objeto (grados)
 * @param objectAlt - Altitud del objeto (grados)
 * @param cameraAz - Azimut de la cámara (grados)
 * @param cameraAlt - Altitud de la cámara (grados)
 * @param fovH - Campo de visión horizontal (grados)
 * @param fovV - Campo de visión vertical (grados)
 */
export const isInFieldOfView = (
  objectAz: number,
  objectAlt: number,
  cameraAz: number,
  cameraAlt: number,
  fovH: number = 65,
  fovV: number = 90
): boolean => {
  //distancia angular simplificada
  let dAz = objectAz - cameraAz;
  if (dAz > 180) dAz -= 360;
  if (dAz < -180) dAz += 360;

  const dAlt = objectAlt - cameraAlt;

  //margen extra para que objetos no aparezcan/desaparezcan abruptamente
  const margin = 5;
  return Math.abs(dAz) <= (fovH / 2 + margin) &&
    Math.abs(dAlt) <= (fovV / 2 + margin);
};
