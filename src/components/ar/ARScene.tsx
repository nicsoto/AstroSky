//============================================================
//astroSky — Escena Three.js principal
//============================================================

import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import type { ProcessedOrientation } from '../../engine/orientation';
import type { StarCatalog } from '../../data/loaders/starCatalog';
import type { ConstellationCatalog } from '../../data/loaders/constellationData';
import type { ObserverLocation, Planet } from '../../data/types';
import { createStarField, updateStarFieldPositions } from './StarField';
import {
  createConstellationLines,
  updateConstellationLinePositions,
} from './ConstellationLines';
import {
  createPlanetMarkers,
  updatePlanetMarkerPositions,
} from './PlanetMarker';
import {
  createTrajectoryPath,
  updateTrajectoryPath,
} from './TrajectoryPath';
import { batchEquatorialToThreeJS } from '../../engine/coordinates';
import { horizontalToThreeJS } from '../../engine/coordinates';
import { getBodyPosition } from '../../engine/astronomy';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';

const SPHERE_RADIUS = 500;
const CAMERA_FOV = 65;

interface ARSceneProps {
  orientation: ProcessedOrientation;
  starCatalog: StarCatalog | null;
  constellationCatalog: ConstellationCatalog | null;
  location: ObserverLocation | null;
  planets: Planet[];
}

export const ARScene: React.FC<ARSceneProps> = ({
  orientation,
  starCatalog,
  constellationCatalog,
  location,
  planets,
}) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const constellationGroupRef = useRef<THREE.Group | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const trajectoryRef = useRef<THREE.Line | null>(null);
  const animFrameRef = useRef<number>(0);
  const orientationRef = useRef(orientation);
  const glRef = useRef<any>(null);

  //store values
  const showConstellations = useSettingsStore((s) => s.showConstellations);
  const magnitudeLimit = useSettingsStore((s) => s.magnitudeLimit);
  const twinkleIntensity = useSettingsStore((s) => s.twinkleIntensity);
  const trajectoryPoints = useAppStore((s) => s.trajectoryPoints);

  //mantener orientación actualizada en ref (evita re-renders)
  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  const onContextCreate = useCallback(
    async (gl: any) => {
      glRef.current = gl;

      //crear renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0); //transparente
      renderer.setPixelRatio(1);
      rendererRef.current = renderer;

      //crear escena
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      //crear cámara
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 2000);
      camera.position.set(0, 0, 0);
      cameraRef.current = camera;

      //===== ESTRELLAS =====
      if (starCatalog && location) {
        const starPositions = new Float32Array(starCatalog.cartesianPositions.length);
        batchEquatorialToThreeJS(
          starCatalog.cartesianPositions,
          new Date(),
          location,
          SPHERE_RADIUS,
          starPositions
        );

        const starField = createStarField(
          starPositions,
          starCatalog.colors,
          starCatalog.magnitudes,
          magnitudeLimit
        );
        scene.add(starField);
        starFieldRef.current = starField;
      }

      //===== LINEAS DE CONSTELACIONES =====
      if (starCatalog && constellationCatalog && location) {
        const constellationGroup = createConstellationLines(
          starCatalog,
          constellationCatalog,
          location
        );
        constellationGroup.visible = showConstellations;
        scene.add(constellationGroup);
        constellationGroupRef.current = constellationGroup;
      }

      //===== PLANETAS =====
      const planetGroup = createPlanetMarkers(planets, location);
      scene.add(planetGroup);
      planetGroupRef.current = planetGroup;

      //===== LUZ AMBIENTAL (para debug) =====
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
      scene.add(ambientLight);

      //===== LOOP DE RENDERIZADO =====
      let lastPositionUpdate = 0;
      const POSITION_UPDATE_INTERVAL = 60000; //actualizar posiciones cada 60s

      const animate = (time: number) => {
        animFrameRef.current = requestAnimationFrame(animate);

        //actualizar cámara con orientación del dispositivo
        const { azimuth, altitude, roll } = orientationRef.current;

        //convertir orientación a rotación de cámara Three.js
        //euler: orden YXZ — Yaw (azimuth), Pitch (altitude), Roll
        const yaw = -((azimuth * Math.PI) / 180); //negativo porque Three.js usa CCW
        const pitch = (altitude * Math.PI) / 180;
        const rollRad = -((roll * Math.PI) / 180);

        camera.rotation.order = 'YXZ';
        camera.rotation.set(pitch, yaw, rollRad);

        //actualizar uniforms del shader de estrellas (centelleo)
        if (starFieldRef.current) {
          const material = starFieldRef.current.material as THREE.ShaderMaterial;
          if (material.uniforms?.uTime) {
            material.uniforms.uTime.value = time * 0.001;
          }
          if (material.uniforms?.uTwinkle) {
            material.uniforms.uTwinkle.value = twinkleIntensity;
          }
        }

        //actualizar posiciones astronómicas periódicamente
        if (time - lastPositionUpdate > POSITION_UPDATE_INTERVAL && starCatalog && location) {
          lastPositionUpdate = time;

          const newPositions = new Float32Array(starCatalog.cartesianPositions.length);
          batchEquatorialToThreeJS(
            starCatalog.cartesianPositions,
            new Date(),
            location,
            SPHERE_RADIUS,
            newPositions
          );
          updateStarFieldPositions(starFieldRef.current!, newPositions);

          if (constellationGroupRef.current && constellationCatalog) {
            updateConstellationLinePositions(
              constellationGroupRef.current,
              starCatalog,
              constellationCatalog,
              location
            );
          }
        }

        //visibilidad de constelaciones
        if (constellationGroupRef.current) {
          constellationGroupRef.current.visible = showConstellations;
        }

        //renderizar
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate(0);
    },
    [starCatalog, constellationCatalog, location, planets]
  );

  //limpiar al desmontar
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  //actualizar trayectoria cuando cambie
  useEffect(() => {
    if (!sceneRef.current || !location) return;

    //limpiar trayectoria anterior
    if (trajectoryRef.current) {
      sceneRef.current.remove(trajectoryRef.current);
      trajectoryRef.current.geometry.dispose();
      (trajectoryRef.current.material as THREE.Material).dispose();
      trajectoryRef.current = null;
    }

    //crear nueva trayectoria
    if (trajectoryPoints.length > 1) {
      const path = createTrajectoryPath(trajectoryPoints, SPHERE_RADIUS);
      sceneRef.current.add(path);
      trajectoryRef.current = path;
    }
  }, [trajectoryPoints, location]);

  return (
    <View style={styles.container} pointerEvents="none">
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
