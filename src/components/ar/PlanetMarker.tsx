//============================================================
//astroSky — Marcadores de planetas (Three.js sprites)
//============================================================

import * as THREE from 'three';
import type { Planet, ObserverLocation } from '../../data/types';
import { horizontalToThreeJS } from '../../engine/coordinates';
import { equatorialToHorizontal } from '../../engine/coordinates';
import { PLANET_COLORS } from '../../utils/colors';
import { magnitudeToPointSize } from '../../utils/magnitude';

const SPHERE_RADIUS = 500;
const BASE_SPRITE_SIZE = 18;

/**
 *crear un canvas texture para un planeta (billboard circular).
 */
const createPlanetTexture = (
  color: string,
  size: number = 64
): THREE.CanvasTexture => {
  //crear el canvas como OffscreenCanvas o via document si disponible
  //en React Native/expo-gl usamos DataTexture como alternativa
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = center - 2;
      const idx = (y * size + x) * 4;

      if (dist < maxRadius) {
        //interior del planeta con gradiente radial
        const factor = 1 - (dist / maxRadius) * 0.4;
        data[idx] = Math.min(255, Math.floor(r * factor));
        data[idx + 1] = Math.min(255, Math.floor(g * factor));
        data[idx + 2] = Math.min(255, Math.floor(b * factor));
        data[idx + 3] = 255;
      } else if (dist < maxRadius + 2) {
        //borde suave
        const alpha = Math.max(0, 1 - (dist - maxRadius) / 2);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.floor(alpha * 200);
      } else {
        //fuera - transparente
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture as any;
};

/**
 *crear marcadores de planetas como sprites 3D.
 */
export const createPlanetMarkers = (
  planets: Planet[],
  location: ObserverLocation | null
): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'planets';

  if (!location) return group;

  const now = new Date();

  for (const planet of planets) {
    //calcular posición horizontal desde RA/Dec
    const horiz = equatorialToHorizontal(planet.ra, planet.dec, now, location);

    //no mostrar planetas bajo el horizonte
    if (horiz.altitude < -5) continue;

    //convertir a posición Three.js
    const [px, py, pz] = horizontalToThreeJS(horiz.azimuth, horiz.altitude, SPHERE_RADIUS * 0.95);

    //determinar color
    const colorHex =
      PLANET_COLORS[planet.name as keyof typeof PLANET_COLORS] || '#FFFFFF';

    //crear textura
    const texture = createPlanetTexture(colorHex, 64);

    //crear sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(px, py, pz);

    //tamaño basado en magnitud
    const baseSize = magnitudeToPointSize(planet.magnitude) * 2.5;
    const size = Math.max(BASE_SPRITE_SIZE, baseSize);
    sprite.scale.set(size, size, 1);

    sprite.name = `planet_${planet.name}`;
    sprite.userData = {
      planetName: planet.name,
      magnitude: planet.magnitude,
    };

    group.add(sprite);
  }

  return group;
};

/**
 *actualizar posiciones de planetas.
 *reconstruye el grupo completo (los planetas se mueven lentamente).
 */
export const updatePlanetMarkerPositions = (
  group: THREE.Group,
  planets: Planet[],
  location: ObserverLocation | null
): void => {
  if (!location) return;

  //limpiar sprites anteriores
  while (group.children.length > 0) {
    const child = group.children[0];
    if (child instanceof THREE.Sprite) {
      (child.material as THREE.SpriteMaterial).map?.dispose();
      (child.material as THREE.SpriteMaterial).dispose();
    }
    group.remove(child);
  }

  //recrear
  const now = new Date();

  for (const planet of planets) {
    const horiz = equatorialToHorizontal(planet.ra, planet.dec, now, location);

    if (horiz.altitude < -5) continue;

    const [px, py, pz] = horizontalToThreeJS(horiz.azimuth, horiz.altitude, SPHERE_RADIUS * 0.95);
    const colorHex =
      PLANET_COLORS[planet.name as keyof typeof PLANET_COLORS] || '#FFFFFF';

    const texture = createPlanetTexture(colorHex, 64);

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(px, py, pz);

    const baseSize = magnitudeToPointSize(planet.magnitude) * 2.5;
    const size = Math.max(BASE_SPRITE_SIZE, baseSize);
    sprite.scale.set(size, size, 1);

    sprite.name = `planet_${planet.name}`;
    sprite.userData = {
      planetName: planet.name,
      magnitude: planet.magnitude,
    };

    group.add(sprite);
  }
};
