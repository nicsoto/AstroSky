//============================================================
//astroSky — Trayectoria de objeto celeste (Three.js)
//============================================================

import * as THREE from 'three';
import type { TrajectoryPoint } from '../../data/types';
import { horizontalToThreeJS } from '../../engine/coordinates';

const TRAJECTORY_COLOR = 0xffc107; //dorado (amber)
const HORIZON_COLOR = 0x44ffaa; //verde claro para horizonte

/**
 *crear línea de trayectoria a partir de puntos Azimut/Altitud.
 *
 *la trayectoria muestra el recorrido de un objeto celeste
 *a lo largo de las próximas 24 horas.
 */
export const createTrajectoryPath = (
  trajectoryPoints: TrajectoryPoint[],
  radius: number
): THREE.Line => {
  const points: THREE.Vector3[] = [];

  for (const tp of trajectoryPoints) {
    const [px, py, pz] = horizontalToThreeJS(tp.azimuth, tp.altitude, radius * 0.9);
    points.push(new THREE.Vector3(px, py, pz));
  }

  //crear curva suave a través de los puntos
  let curvePoints: THREE.Vector3[];
  if (points.length >= 3) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    curvePoints = curve.getPoints(Math.max(points.length * 4, 100));
  } else {
    curvePoints = points;
  }

  //crear colores: verde bajo el horizonte, dorado sobre el horizonte
  const colors: number[] = [];
  const aboveColor = new THREE.Color(TRAJECTORY_COLOR);
  const belowColor = new THREE.Color(HORIZON_COLOR);
  belowColor.multiplyScalar(0.3); //más tenue bajo el horizonte

  for (const p of curvePoints) {
    //en Three.js, Y es arriba (zenith), Y=0 es horizonte
    const isAbove = p.y >= 0;
    const color = isAbove ? aboveColor : belowColor;
    colors.push(color.r, color.g, color.b);
  }

  //geometría
  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  //material
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    linewidth: 2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const line = new THREE.Line(geometry, material);
  line.name = 'trajectory';
  line.frustumCulled = false;

  return line;
};

/**
 *actualizar una línea de trayectoria existente con nuevos puntos.
 */
export const updateTrajectoryPath = (
  line: THREE.Line,
  trajectoryPoints: TrajectoryPoint[],
  radius: number
): void => {
  if (trajectoryPoints.length < 2) return;

  const points: THREE.Vector3[] = [];

  for (const tp of trajectoryPoints) {
    const [px, py, pz] = horizontalToThreeJS(tp.azimuth, tp.altitude, radius * 0.9);
    points.push(new THREE.Vector3(px, py, pz));
  }

  let curvePoints: THREE.Vector3[];
  if (points.length >= 3) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    curvePoints = curve.getPoints(Math.max(points.length * 4, 100));
  } else {
    curvePoints = points;
  }

  //recrear geometría
  line.geometry.dispose();

  const colors: number[] = [];
  const aboveColor = new THREE.Color(TRAJECTORY_COLOR);
  const belowColor = new THREE.Color(HORIZON_COLOR);
  belowColor.multiplyScalar(0.3);

  for (const p of curvePoints) {
    const isAbove = p.y >= 0;
    const color = isAbove ? aboveColor : belowColor;
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  line.geometry = geometry;
};
