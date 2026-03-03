# AstroSky 🌌

Aplicación de astronomía en realidad aumentada. Apunta tu teléfono al cielo y descubre estrellas, planetas, constelaciones, nebulosas y galaxias en tiempo real.

## Características

- **Realidad aumentada** — Superpone objetos celestes sobre la imagen de la cámara
- **Catálogo estelar** — Más de 100 estrellas con nombres, magnitudes y tipos espectrales
- **Planetas del sistema solar** — Posiciones calculadas en tiempo real con astronomy-engine
- **40 constelaciones** — Líneas y nombres dibujados sobre el cielo
- **36 objetos Messier** — Galaxias, nebulosas, cúmulos globulares y más
- **Brújula integrada** — Detección automática del norte usando el magnetómetro
- **Trayectorias** — Visualiza el recorrido de cualquier objeto durante 24 horas
- **Búsqueda** — Encuentra objetos por nombre en español o inglés
- **Modo planetario** — Vista sin cámara con fondo oscuro
- **Interfaz en español**

## Tecnologías

| Tecnología | Uso |
|---|---|
| React Native (Expo SDK 55) | Framework principal |
| TypeScript | Tipado estático |
| Three.js + expo-gl | Renderizado 3D de la esfera celeste |
| astronomy-engine | Cálculos de posiciones planetarias |
| expo-camera | Fondo de realidad aumentada |
| expo-sensors | Orientación del dispositivo (giroscopio + magnetómetro) |
| expo-location | Ubicación del observador |
| Zustand | Estado global |
| react-native-mmkv | Caché local |
| Expo Router | Navegación basada en archivos |

## Estructura del proyecto

```
astrosky/
├── app/                          # pantallas (Expo Router)
│   ├── _layout.tsx               # layout raíz
│   ├── index.tsx                 # vista principal AR
│   ├── settings.tsx              # ajustes
│   ├── calibration.tsx           # calibración de brújula
│   ├── search.tsx                # búsqueda de objetos
│   └── object/[id].tsx           # detalle de objeto
├── src/
│   ├── components/
│   │   ├── ar/                   # componentes de realidad aumentada
│   │   │   ├── ARScene.tsx       # escena Three.js principal
│   │   │   ├── CameraBackground.tsx
│   │   │   ├── StarField.tsx     # campo de estrellas (partículas)
│   │   │   ├── ConstellationLines.tsx
│   │   │   ├── PlanetMarker.tsx
│   │   │   ├── TrajectoryPath.tsx
│   │   │   └── ObjectLabel.tsx
│   │   └── ui/                   # componentes de interfaz
│   │       ├── CompassHUD.tsx
│   │       ├── InfoPanel.tsx
│   │       ├── SearchBar.tsx
│   │       └── MagnitudeSlider.tsx
│   ├── data/
│   │   ├── catalogs/             # datos astronómicos (JSON)
│   │   │   ├── stars.json
│   │   │   ├── constellations.json
│   │   │   └── messier.json
│   │   ├── loaders/              # cargadores de catálogos
│   │   └── types.ts              # tipos TypeScript
│   ├── engine/                   # motor astronómico
│   │   ├── astronomy.ts          # posiciones planetarias
│   │   ├── coordinates.ts        # conversión de coordenadas
│   │   ├── orientation.ts        # procesamiento de sensores
│   │   ├── projection.ts         # proyección cielo → pantalla
│   │   └── time.ts               # utilidades de tiempo sideral
│   ├── hooks/                    # hooks de React
│   ├── store/                    # estado global (Zustand)
│   ├── services/                 # APIs externas y caché
│   ├── i18n/                     # traducciones
│   └── utils/                    # utilidades generales
└── assets/                       # iconos y splash screen
```

## Requisitos

- Node.js 18+
- Expo CLI
- Dispositivo Android o iOS con cámara, GPS y giroscopio

## Instalación

```bash
git clone https://github.com/nicsoto/AstroSky.git
cd AstroSky
npm install --legacy-peer-deps
```

## Ejecución

```bash
npx expo start
```

Escanea el código QR con Expo Go o genera un development build:

```bash
npx expo run:android
```

## Arquitectura

La app usa una arquitectura de 3 capas superpuestas:

1. **Capa de cámara** — Fondo en vivo capturado con expo-camera
2. **Capa 3D** — Escena Three.js transparente con estrellas, líneas de constelaciones y planetas renderizados como partículas y geometrías
3. **Capa UI** — Componentes React Native para brújula, panel de información, búsqueda y controles

Las posiciones de los objetos celestes se calculan usando:
- Coordenadas ecuatoriales (RA/Dec) de los catálogos
- Conversión a coordenadas horizontales (azimut/altitud) según la ubicación y hora del observador
- Proyección a coordenadas Three.js para renderizado en la esfera celeste

## Licencia

MIT
