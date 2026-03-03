//============================================================
//astroSky — Procesamiento de orientación del dispositivo
//============================================================

import { normalizeAngle, normalizeAngleSigned, lerp, clamp } from '../utils/math';

/**
 *estado de orientación procesado a partir de los sensores.
 */
export interface ProcessedOrientation {
  /** Azimut (heading): hacia dónde apunta la cámara, 0=Norte, 90=Este */
  azimuth: number;
  /** Altitud (elevación): ángulo vertical, 0=horizonte, 90=zénit */
  altitude: number;
  /** Roll: rotación lateral */
  roll: number;
}

/**
 *filtro complementario para combinar giroscopio (alta frecuencia)
 *con acelerómetro/magnetómetro (baja frecuencia).
 */
export class OrientationFilter {
  private alpha: number; //factor de filtrado (0-1)
  private currentAz: number = 0;
  private currentAlt: number = 0;
  private currentRoll: number = 0;
  private initialized: boolean = false;

  /**
   * @param alpha - Factor de filtro (0.85-0.98 típico).
   *más alto = más suave pero más lento.
   *más bajo = más responsivo pero más ruidoso.
   */
  constructor(alpha: number = 0.92) {
    this.alpha = alpha;
  }

  /**
   *actualizar con nuevos datos de sensores.
   *
   * @param rawAzimuth - Azimut crudo del magnetómetro/DeviceMotion (grados)
   * @param rawAltitude - Altitud cruda del acelerómetro (grados)
   * @param rawRoll - Roll crudo (grados)
   * @param compassOffset - Offset manual de calibración (grados)
   */
  update(
    rawAzimuth: number,
    rawAltitude: number,
    rawRoll: number,
    compassOffset: number = 0
  ): ProcessedOrientation {
    //aplicar offset de brújula
    let az = normalizeAngle(rawAzimuth + compassOffset);
    let alt = clamp(rawAltitude, -90, 90);
    let roll = normalizeAngleSigned(rawRoll);

    if (!this.initialized) {
      this.currentAz = az;
      this.currentAlt = alt;
      this.currentRoll = roll;
      this.initialized = true;
    } else {
      //filtro complementario para azimut (cuidando el wrap-around en 0/360)
      let dAz = az - this.currentAz;
      if (dAz > 180) dAz -= 360;
      if (dAz < -180) dAz += 360;
      this.currentAz = normalizeAngle(this.currentAz + (1 - this.alpha) * dAz);

      //filtro para altitud (no tiene wrap-around)
      this.currentAlt = this.alpha * this.currentAlt + (1 - this.alpha) * alt;

      //filtro para roll
      let dRoll = roll - this.currentRoll;
      if (dRoll > 180) dRoll -= 360;
      if (dRoll < -180) dRoll += 360;
      this.currentRoll = normalizeAngleSigned(
        this.currentRoll + (1 - this.alpha) * dRoll
      );
    }

    return {
      azimuth: this.currentAz,
      altitude: this.currentAlt,
      roll: this.currentRoll,
    };
  }

  /**
   *resetear el filtro (ej: después de calibración).
   */
  reset(): void {
    this.initialized = false;
  }

  /**
   *cambiar el factor de filtrado.
   */
  setAlpha(alpha: number): void {
    this.alpha = clamp(alpha, 0, 1);
  }
}

/**
 *convertir datos de DeviceMotion de Expo a orientación de cámara.
 *
 *deviceMotion provee rotation en formato:
 * - alpha: rotación alrededor del eje Z (yaw) → nuestro azimut
 * - beta: rotación alrededor del eje X (pitch) → nuestra altitud
 * - gamma: rotación alrededor del eje Y (roll) → nuestro roll
 *
 *sin embargo, la orientación depende de cómo se sostiene el celular.
 *asumimos orientación "portrait" (vertical).
 */
export const processDeviceMotionRotation = (
  alpha: number, //yaw en grados (0-360)
  beta: number,  //pitch en grados (-180 a 180)
  gamma: number  //roll en grados (-90 a 90)
): { azimuth: number; altitude: number; roll: number } => {
  //en portrait, apuntando al cielo:
  //- alpha (yaw) → azimut (brújula), pero viene invertido en muchos devices
  //- beta (pitch) → altitud. 0° = horizontal, 90° = mirando arriba
  //- gamma (roll) → roll lateral

  //cuando el celu está en portrait:
  //beta = 0 → plano horizontal (cámara mira al techo/cielo si boca arriba)
  //beta = 90 → vertical, cámara mira al horizonte
  //beta = -90 → vertical invertido

  //para nuestra app (cámara apuntando al cielo):
  //altitud = 90 - beta (cuando beta=0, miramos arriba: alt=90; cuando beta=90, horizonte: alt=0)

  let azimuth = normalizeAngle(360 - alpha); //invertir para que sea clockwise desde Norte
  let altitude = 90 - beta;
  altitude = clamp(altitude, -90, 90);
  const roll = gamma;

  return { azimuth, altitude, roll };
};

/**
 *convertir datos del magnetómetro (x, y, z) a heading (azimut).
 *suplementario a DeviceMotion cuando la brújula necesita corrección.
 */
export const magnetometerToHeading = (
  x: number,
  y: number
): number => {
  let heading = Math.atan2(y, x) * (180 / Math.PI);
  heading = normalizeAngle(heading);
  return heading;
};
