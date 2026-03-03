//============================================================
//astroSky — Wrapper de astronomy-engine para cálculos planetarios
//============================================================

import * as Astronomy from 'astronomy-engine';
import type {
  Planet,
  HorizontalCoords,
  ObserverLocation,
  TrajectoryPoint,
} from '../data/types';
import { PLANET_COLORS } from '../utils/colors';
import { formatTime } from './time';

//mapeo de nombres internos de astronomy-engine
const PLANET_BODIES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune',
] as const;

type PlanetBodyName = typeof PLANET_BODIES[number];

const PLANET_NAMES_ES: Record<PlanetBodyName, string> = {
  Sun: 'Sol',
  Moon: 'Luna',
  Mercury: 'Mercurio',
  Venus: 'Venus',
  Mars: 'Marte',
  Jupiter: 'Júpiter',
  Saturn: 'Saturno',
  Uranus: 'Urano',
  Neptune: 'Neptuno',
};

/**
 *crear un observer de astronomy-engine.
 */
const makeObserver = (loc: ObserverLocation): Astronomy.Observer => {
  return new Astronomy.Observer(loc.latitude, loc.longitude, loc.elevation);
};

/**
 *obtener la posición horizontal (Az/Alt) de un cuerpo del sistema solar.
 */
export const getBodyPosition = (
  bodyName: string,
  date: Date,
  location: ObserverLocation
): HorizontalCoords => {
  const observer = makeObserver(location);
  const time = Astronomy.MakeTime(date);
  const body = bodyName as Astronomy.Body;

  const equatorial = Astronomy.Equator(body, time, observer, true, true);
  const horizontal = Astronomy.Horizon(time, observer, equatorial.ra, equatorial.dec, 'normal');

  return {
    azimuth: horizontal.azimuth,
    altitude: horizontal.altitude,
  };
};

/**
 *obtener todas las posiciones planetarias actuales.
 *retorna un array de objetos Planet con posiciones calculadas.
 */
export const getAllPlanetPositions = (
  date: Date,
  location: ObserverLocation
): Planet[] => {
  const observer = makeObserver(location);
  const time = Astronomy.MakeTime(date);
  const planets: Planet[] = [];

  for (const bodyName of PLANET_BODIES) {
    try {
      const body = bodyName as Astronomy.Body;
      const equatorial = Astronomy.Equator(body, time, observer, true, true);
      const horizontal = Astronomy.Horizon(
        time, observer, equatorial.ra, equatorial.dec, 'normal'
      );

      let magnitude = 0;
      let phase: number | undefined;
      let distanceAU: number | undefined;

      //calcular magnitud y datos extra
      try {
        if (bodyName !== 'Sun' && bodyName !== 'Moon') {
          const illum = Astronomy.Illumination(body, time);
          magnitude = illum.mag;
          phase = illum.phase_fraction;
          distanceAU = illum.geo_dist;
        } else if (bodyName === 'Sun') {
          magnitude = -26.74;
        } else if (bodyName === 'Moon') {
          magnitude = -12.7; //aprox, varía mucho
          const moonIllum = Astronomy.Illumination('Moon' as Astronomy.Body, time);
          phase = moonIllum.phase_fraction;
          distanceAU = moonIllum.geo_dist;
        }
      } catch {
        //fallback si Illumination falla  
      }

      planets.push({
        id: `planet_${bodyName.toLowerCase()}`,
        type: bodyName === 'Moon' ? 'moon' : bodyName === 'Sun' ? 'sun' : 'planet',
        name: bodyName,
        nameEs: PLANET_NAMES_ES[bodyName],
        bodyName,
        ra: equatorial.ra,
        dec: equatorial.dec,
        magnitude,
        color: PLANET_COLORS[bodyName] || '#ffffff',
        phase,
        distanceAU,
        constellation: undefined, //se puede calcular después
      });
    } catch (e) {
      console.warn(`Error calculando posición de ${bodyName}:`, e);
    }
  }

  return planets;
};

/**
 *calcular la trayectoria de un cuerpo del sistema solar durante 24 horas.
 *retorna puntos cada `intervalMinutes` minutos.
 */
export const calculateTrajectory = (
  bodyName: string,
  date: Date,
  location: ObserverLocation,
  hoursTotal: number = 24,
  intervalMinutes: number = 30
): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  const observer = makeObserver(location);
  const body = bodyName as Astronomy.Body;
  const totalMinutes = hoursTotal * 60;

  //empezar 12 horas antes de la fecha dada
  const startTime = new Date(date.getTime() - 12 * 60 * 60 * 1000);

  for (let m = 0; m <= totalMinutes; m += intervalMinutes) {
    const pointDate = new Date(startTime.getTime() + m * 60 * 1000);
    const time = Astronomy.MakeTime(pointDate);

    try {
      const equatorial = Astronomy.Equator(body, time, observer, true, true);
      const horizontal = Astronomy.Horizon(
        time, observer, equatorial.ra, equatorial.dec, 'normal'
      );

      points.push({
        time: pointDate,
        azimuth: horizontal.azimuth,
        altitude: horizontal.altitude,
        label: m % 60 === 0 ? formatTime(pointDate) : undefined,
      });
    } catch {
      //saltar puntos que fallen
    }
  }

  return points;
};

/**
 *calcular la trayectoria de una estrella fija (RA/Dec constantes) durante 24h.
 */
export const calculateStarTrajectory = (
  ra: number,
  dec: number,
  date: Date,
  location: ObserverLocation,
  hoursTotal: number = 24,
  intervalMinutes: number = 30
): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  const observer = makeObserver(location);
  const totalMinutes = hoursTotal * 60;
  const startTime = new Date(date.getTime() - 12 * 60 * 60 * 1000);

  for (let m = 0; m <= totalMinutes; m += intervalMinutes) {
    const pointDate = new Date(startTime.getTime() + m * 60 * 1000);
    const time = Astronomy.MakeTime(pointDate);

    const horizontal = Astronomy.Horizon(time, observer, ra, dec, 'normal');

    points.push({
      time: pointDate,
      azimuth: horizontal.azimuth,
      altitude: horizontal.altitude,
      label: m % 60 === 0 ? formatTime(pointDate) : undefined,
    });
  }

  return points;
};

/**
 *obtener la posición del Sol (útil para detectar día/noche).
 */
export const getSunAltitude = (
  date: Date,
  location: ObserverLocation
): number => {
  const pos = getBodyPosition('Sun', date, location);
  return pos.altitude;
};

/**
 *buscar el próximo orto/ocaso de un cuerpo.
 */
export const getNextRiseSet = (
  bodyName: string,
  date: Date,
  location: ObserverLocation
): { rise?: Date; set?: Date } => {
  const observer = makeObserver(location);
  const time = Astronomy.MakeTime(date);
  const body = bodyName as Astronomy.Body;

  let rise: Date | undefined;
  let set: Date | undefined;

  try {
    const riseSearch = Astronomy.SearchRiseSet(body, observer, +1, time, 1);
    if (riseSearch) rise = riseSearch.date;
  } catch { /* puede no haber orto */ }

  try {
    const setSearch = Astronomy.SearchRiseSet(body, observer, -1, time, 1);
    if (setSearch) set = setSearch.date;
  } catch { /* puede no haber ocaso */ }

  return { rise, set };
};
