//============================================================
//astroSky — Proyección de esfera celeste a pantalla
//============================================================

import { degToRad, normalizeAngleSigned } from '../utils/math';
import type { ScreenPosition } from '../data/types';

/**
 *proyectar coordenadas horizontales (Az/Alt) a posición en pantalla,
 *dado el pointing actual de la cámara.
 *
 *usa proyección gnomónica (tangencial) — la misma que usan las cámaras reales.
 *
 * @param objectAz - Azimut del objeto (grados)
 * @param objectAlt - Altitud del objeto (grados)
 * @param cameraAz - Azimut central de la cámara (grados)
 * @param cameraAlt - Altitud central de la cámara (grados)
 * @param cameraRoll - Roll de la cámara (grados)
 * @param fovH - Campo de visión horizontal de la cámara (grados)
 * @param screenWidth - Ancho de pantalla en píxeles
 * @param screenHeight - Alto de pantalla en píxeles
 */
export const projectToScreen = (
  objectAz: number,
  objectAlt: number,
  cameraAz: number,
  cameraAlt: number,
  cameraRoll: number,
  fovH: number,
  screenWidth: number,
  screenHeight: number
): ScreenPosition => {
  //convertir a radianes
  const oAz = degToRad(objectAz);
  const oAlt = degToRad(objectAlt);
  const cAz = degToRad(cameraAz);
  const cAlt = degToRad(cameraAlt);
  const roll = degToRad(cameraRoll);

  //calcular coordenadas en el plano tangente centrado en la cámara
  //usando proyección gnomónica

  //vector del objeto en coord horizontales cartesianas
  const cosOAlt = Math.cos(oAlt);
  const ox = cosOAlt * Math.cos(oAz);
  const oy = cosOAlt * Math.sin(oAz);
  const oz = Math.sin(oAlt);

  //vector de la cámara (dirección central)
  const cosCAlt = Math.cos(cAlt);
  const cx = cosCAlt * Math.cos(cAz);
  const cy = cosCAlt * Math.sin(cAz);
  const cz = Math.sin(cAlt);

  //producto punto (ángulo entre objeto y centro de cámara)
  const dot = ox * cx + oy * cy + oz * cz;

  //si dot <= 0, el objeto está detrás de la cámara
  if (dot <= 0.001) {
    return { x: -1000, y: -1000, visible: false };
  }

  //vectores base del plano tangente:
  //"right" = Este en el cielo (perpendicular al pointing, en el plano horizontal)
  //"up" = Arriba en el cielo (perpendicular al pointing y a right)

  //right = normalize(cross(zénit, camera_dir))
  //pero es más fácil usar diferencias de ángulo directas

  //proyección gnomónica simplificada:
  const dAz = normalizeAngleSigned(objectAz - cameraAz);
  const dAlt = objectAlt - cameraAlt;

  //factor de escala para la proyección
  const fovHRad = degToRad(fovH);
  const fovVRad = fovHRad * (screenHeight / screenWidth);
  const scaleX = screenWidth / (2 * Math.tan(fovHRad / 2));
  const scaleY = screenHeight / (2 * Math.tan(fovVRad / 2));

  //coordenadas en el plano tangente (sin roll)
  let px = degToRad(dAz) * scaleX * Math.cos(cAlt); //corregir por altitud
  let py = -degToRad(dAlt) * scaleY; //negativo porque Y pantalla va hacia abajo

  //aplicar roll de la cámara
  if (roll !== 0) {
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);
    const rpx = px * cosR - py * sinR;
    const rpy = px * sinR + py * cosR;
    px = rpx;
    py = rpy;
  }

  //centrar en la pantalla
  const screenX = screenWidth / 2 + px;
  const screenY = screenHeight / 2 + py;

  //verificar si está dentro de la pantalla (con margen)
  const margin = 50;
  const visible =
    screenX >= -margin &&
    screenX <= screenWidth + margin &&
    screenY >= -margin &&
    screenY <= screenHeight + margin;

  return { x: screenX, y: screenY, visible };
};

/**
 *calcular el FOV vertical dado el horizontal y el aspect ratio.
 */
export const calculateVerticalFOV = (
  fovH: number,
  aspectRatio: number //width/height
): number => {
  const fovHRad = degToRad(fovH);
  const fovVRad = 2 * Math.atan(Math.tan(fovHRad / 2) / aspectRatio);
  return fovVRad * (180 / Math.PI);
};

/**
 *fOV por defecto para la cámara del celular (aproximado).
 *la mayoría de celulares tienen FOV entre 60-75° horizontal.
 */
export const DEFAULT_CAMERA_FOV_H = 65; //grados
