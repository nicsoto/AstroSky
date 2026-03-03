//============================================================
//astroSky — Tipos TypeScript para objetos celestes
//============================================================

/** Coordenadas ecuatoriales (sistema J2000) */
export interface EquatorialCoords {
  /** Ascensión recta en horas decimales (0–24) */
  ra: number;
  /** Declinación en grados decimales (-90 a +90) */
  dec: number;
}

/** Coordenadas horizontales (sistema local del observador) */
export interface HorizontalCoords {
  /** Azimut en grados (0=Norte, 90=Este, 180=Sur, 270=Oeste) */
  azimuth: number;
  /** Altitud en grados (-90 a +90, 0=horizonte) */
  altitude: number;
}

/** Coordenadas cartesianas 3D unitarias */
export interface CartesianCoords {
  x: number;
  y: number;
  z: number;
}

/** Posición en pantalla (píxeles) */
export interface ScreenPosition {
  x: number;
  y: number;
  /** Está dentro del campo de visión */
  visible: boolean;
}

/** Ubicación del observador */
export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation: number; //metros sobre nivel del mar
}

/** Orientación del dispositivo */
export interface DeviceOrientation {
  /** Azimut (heading) en grados — hacia dónde apunta el celu (0=Norte) */
  azimuth: number;
  /** Altitud (pitch) en grados — inclinación arriba/abajo */
  altitude: number;
  /** Roll en grados — rotación lateral */
  roll: number;
  /** Calidad de calibración del magnetómetro (0-3) */
  accuracy: number;
}

//============================================================
//objetos celestes
//============================================================

export type CelestialObjectType =
  | 'star'
  | 'planet'
  | 'moon'
  | 'sun'
  | 'galaxy'
  | 'nebula'
  | 'cluster'
  | 'globular_cluster'
  | 'planetary_nebula'
  | 'supernova_remnant'
  | 'double_star'
  | 'satellite';

/** Objeto celeste base */
export interface CelestialObject {
  id: string;
  type: CelestialObjectType;
  name: string;
  nameEs?: string; //nombre en español
  ra: number; //ascensión recta en horas
  dec: number; //declinación en grados
  magnitude: number; //magnitud aparente visual
  constellation?: string; //abreviatura IAU (3 letras)
  description?: string;
  descriptionEs?: string;
}

/** Estrella del catálogo */
export interface Star extends CelestialObject {
  type: 'star';
  hip?: number; //iD catálogo Hipparcos
  hd?: number; //iD catálogo Henry Draper
  /** Nombre propio (ej: "Sirius") */
  proper?: string;
  /** Designación Bayer (ej: "Alpha CMa") */
  bayer?: string;
  /** Índice de color B-V (para colorear) */
  ci: number;
  /** Tipo espectral (ej: "A1V") */
  spectralType?: string;
  /** Distancia en años luz */
  distance?: number;
  /** Luminosidad relativa al Sol */
  luminosity?: number;
}

/** Planeta del sistema solar */
export interface Planet extends CelestialObject {
  type: 'planet' | 'moon' | 'sun';
  /** Nombre interno para astronomy-engine */
  bodyName: string;
  /** Color representativo hex */
  color: string;
  /** Diámetro angular en segundos de arco */
  angularDiameter?: number;
  /** Fase (0-1, para planetas interiores y Luna) */
  phase?: number;
  /** Distancia al observador en UA */
  distanceAU?: number;
}

/** Objeto de cielo profundo (galaxia, nebulosa, cúmulo) */
export interface DeepSkyObject extends CelestialObject {
  type: 'galaxy' | 'nebula' | 'cluster' | 'globular_cluster' | 'planetary_nebula' | 'supernova_remnant';
  /** Número Messier (ej: 31 para M31) */
  messier?: number;
  /** Número NGC */
  ngc?: number;
  /** Tamaño angular en minutos de arco */
  angularSize?: number;
  /** Distancia en años luz */
  distance?: number;
  /** Nombre común (ej: "Nebulosa de Orión") */
  commonName?: string;
  commonNameEs?: string;
}

//============================================================
//constelaciones
//============================================================

/** Par de estrellas que forman una línea de constelación */
export type ConstellationLine = [number, number]; //[hipId1, hipId2]

/** Definición de una constelación */
export interface Constellation {
  /** Abreviatura IAU de 3 letras (ej: "Ori") */
  abbreviation: string;
  /** Nombre en latín */
  name: string;
  /** Nombre en español */
  nameEs: string;
  /** Genitivo latino (ej: "Orionis") */
  genitive?: string;
  /** Líneas que forman la figura (pares de Hipparcos IDs) */
  lines: ConstellationLine[];
}

//============================================================
//estado de la app
//============================================================

export type BackgroundMode = 'camera' | 'planetarium';

export interface AppSettings {
  /** Modo de fondo (cámara real o planetario) */
  backgroundMode: BackgroundMode;
  /** Magnitud límite de estrellas visibles */
  magnitudeLimit: number;
  /** Mostrar líneas de constelaciones */
  showConstellations: boolean;
  /** Mostrar nombres de constelaciones */
  showConstellationNames: boolean;
  /** Mostrar etiquetas de planetas */
  showPlanetLabels: boolean;
  /** Mostrar etiquetas de estrellas brillantes */
  showStarLabels: boolean;
  /** Mostrar objetos de cielo profundo */
  showDeepSky: boolean;
  /** Offset manual de brújula en grados */
  compassOffset: number;
  /** Frecuencia de actualización de sensores (ms) */
  sensorInterval: number;
  /** Intensidad del efecto de centelleo (0-1) */
  twinkleIntensity: number;
  /** Mostrar cuadrícula de coordenadas */
  showGrid: boolean;
  /** Mostrar puntos cardinales */
  showCardinals: boolean;
  /** Mostrar la eclíptica */
  showEcliptic: boolean;
}

/** Objeto seleccionado por el usuario */
export interface SelectedObject {
  object: CelestialObject;
  horizontalPosition: HorizontalCoords;
  screenPosition: ScreenPosition;
  showTrajectory: boolean;
  showInfo: boolean;
}

/** Punto de trayectoria */
export interface TrajectoryPoint {
  time: Date;
  azimuth: number;
  altitude: number;
  label?: string; //ej: "22:00"
}
