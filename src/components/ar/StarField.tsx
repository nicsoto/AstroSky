//============================================================
//astroSky — Campo de estrellas (partículas Three.js)
//============================================================

import * as THREE from 'three';
import { magnitudeToPointSize, magnitudeToFlux } from '../../utils/magnitude';

//===== VERTEX SHADER =====
const STAR_VERTEX_SHADER = `
  attribute float aMagnitude;
  attribute float aFlux;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vFlux;

  uniform float uTime;
  uniform float uTwinkle;
  uniform float uMagnitudeLimit;
  uniform float uPixelRatio;

  //pseudo-random basado en posición
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vColor = aColor;
    vFlux = aFlux;

    //ocultar estrellas por encima del límite de magnitud
    if (aMagnitude > uMagnitudeLimit) {
      gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    //tamaño del punto basado en magnitud
    float baseSize = 3.0 * aFlux * uPixelRatio;
    
    //centelleo (twinkle)
    float twinkle = 1.0;
    if (uTwinkle > 0.0) {
      float seed = rand(position.xy);
      float freq = 2.0 + seed * 4.0;
      twinkle = 1.0 - uTwinkle * 0.3 * sin(uTime * freq + seed * 6.283);
    }

    //distancia-based atenuación (más lejos = más chico)
    float dist = -mvPosition.z;
    float attenuation = 300.0 / dist;

    gl_PointSize = max(1.0, baseSize * attenuation * twinkle);
  }
`;

//===== FRAGMENT SHADER =====
const STAR_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vFlux;

  void main() {
    //distancia al centro del punto (para efecto circular suave)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    //disco suave con glow
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    //glow extra para estrellas brillantes
    float glow = exp(-dist * dist * 8.0) * vFlux;
    
    //color final: centro blanco, bordes coloreados
    vec3 color = mix(vColor, vec3(1.0), glow * 0.5);
    float finalAlpha = alpha * (0.4 + vFlux * 0.6) + glow * 0.3;

    if (finalAlpha < 0.01) discard;

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

/**
 *crear el sistema de partículas de estrellas.
 *
 * @param positions - Float32Array de posiciones Three.js [x,y,z, ...]
 * @param colors - Float32Array de colores RGB [r,g,b, ...]
 * @param magnitudes - Float32Array de magnitudes aparentes
 * @param magnitudeLimit - Magnitud máxima a mostrar
 */
export const createStarField = (
  positions: Float32Array,
  colors: Float32Array,
  magnitudes: Float32Array,
  magnitudeLimit: number = 6.5
): THREE.Points => {
  const numStars = magnitudes.length;
  const geometry = new THREE.BufferGeometry();

  //posiciones
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  //colores
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  //magnitudes
  geometry.setAttribute('aMagnitude', new THREE.BufferAttribute(magnitudes, 1));

  //pre-calcular flujo (brillo relativo para el shader)
  const flux = new Float32Array(numStars);
  for (let i = 0; i < numStars; i++) {
    flux[i] = Math.min(3.0, magnitudeToFlux(magnitudes[i]) * 2);
  }
  geometry.setAttribute('aFlux', new THREE.BufferAttribute(flux, 1));

  //material con shaders personalizados
  const material = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX_SHADER,
    fragmentShader: STAR_FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uTwinkle: { value: 0.5 },
      uMagnitudeLimit: { value: magnitudeLimit },
      uPixelRatio: { value: 2 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'starField';
  points.frustumCulled = false; //siempre renderizar (esfera envolvente)

  return points;
};

/**
 *actualizar las posiciones del campo de estrellas.
 */
export const updateStarFieldPositions = (
  starField: THREE.Points,
  newPositions: Float32Array
): void => {
  const posAttr = starField.geometry.getAttribute('position') as THREE.BufferAttribute;
  posAttr.array = newPositions;
  posAttr.needsUpdate = true;
  starField.geometry.computeBoundingSphere();
};

/**
 *actualizar el límite de magnitud en el shader.
 */
export const updateMagnitudeLimit = (
  starField: THREE.Points,
  limit: number
): void => {
  const material = starField.material as THREE.ShaderMaterial;
  if (material.uniforms?.uMagnitudeLimit) {
    material.uniforms.uMagnitudeLimit.value = limit;
  }
};
