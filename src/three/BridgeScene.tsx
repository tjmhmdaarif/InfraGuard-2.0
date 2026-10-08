import { createContext, Suspense, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BridgeModel } from './components/BridgeModel';
import { ImportedBridgeAsset, ImportedBridgeLoadBoundary } from './components/ImportedBridgeAsset';
import { SensorLayer } from './components/SensorLayer';
import { VehicleSystem } from './systems/VehicleSystem';
import { TrafficFlowSystem } from './systems/TrafficFlowSystem';
import { WeatherSystem } from './systems/WeatherSystem';
import { RiverSystem } from './systems/RiverSystem';
import { Environment } from './components/Environment';
import { HealthHeatmap } from './components/HealthHeatmap';
import { StructuralHighlight } from './components/StructuralHighlight';
import { LoadVisualization } from './components/LoadVisualization';
import { BridgeCamera } from './components/BridgeCamera';
import { useBridgeStore } from '../stores/bridgeStore';
import { useSensorStore } from '../stores/sensorStore';
import { useUIStore } from '../stores/uiStore';

interface BridgeSceneContextValue {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null;
  scene: THREE.Scene | null;
  gl: THREE.WebGLRenderer | null;
  setCamera: (camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => void;
  setScene: (scene: THREE.Scene) => void;
  setGL: (gl: THREE.WebGLRenderer) => void;
}

const BridgeSceneContext = createContext<BridgeSceneContextValue | null>(null);

export function useBridgeScene() {
  const context = useContext(BridgeSceneContext);
  if (!context) throw new Error('useBridgeScene must be used within BridgeSceneProvider');
  return context;
}

interface BridgeSceneProps {
  children: ReactNode;
  mode: 'perspective' | 'orthographic';
  onLoad?: () => void;
}

export function BridgeSceneProvider({ children, mode, onLoad }: BridgeSceneProps) {
  const previousCamera = useRef<THREE.Camera | null>(null);
  const camera = useMemo(() => {
    const aspect = window.innerWidth / window.innerHeight;
    let nextCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (mode === 'orthographic') {
      const frustumSize = 50;
      nextCamera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        500,
      );
    } else {
      nextCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    }
    if (previousCamera.current) {
      nextCamera.position.copy(previousCamera.current.position);
      nextCamera.quaternion.copy(previousCamera.current.quaternion);
    } else {
      nextCamera.position.set(0, 14, 58);
      nextCamera.lookAt(0, -2, 0);
    }
    previousCamera.current = nextCamera;
    return nextCamera;
  }, [mode]);
  const scene = useMemo(() => new THREE.Scene(), []);
  const [gl, setGL] = useState<THREE.WebGLRenderer | null>(null);

  const value = useMemo(() => ({
    camera,
    scene,
    gl,
    setCamera: (nextCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => {
      camera.position.copy(nextCamera.position);
      camera.quaternion.copy(nextCamera.quaternion);
      camera.scale.copy(nextCamera.scale);
      camera.zoom = nextCamera.zoom;
      camera.updateProjectionMatrix();
    },
    setScene: (s: THREE.Scene) => { scene.copy(s); },
    setGL,
  }), [camera, scene, gl]);

  return (
    <BridgeSceneContext.Provider value={value}>
      <Canvas
        camera={camera}
        scene={scene}
        dpr={[1, 1.5]}
        onCreated={({ gl: renderer }) => {
          setGL(renderer);
          onLoad?.();
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <OrbitControls
          makeDefault
          target={[0, -2, 0]}
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={120}
          maxPolarAngle={Math.PI * 0.49}
        />
        {children}
      </Canvas>
    </BridgeSceneContext.Provider>
  );
}

export function BridgeScene({ children }: { children?: ReactNode }) {
  const { zones, components, sensorAnchors, coordinateSystem } = useBridgeStore((s) => s);
  const activeModel = useBridgeStore((state) =>
    state.activeModelId ? state.models.get(state.activeModelId) ?? null : null,
  );
  const { heatmapMode, heatmapEnabled, showSensorMarkers, showVehicleMarkers, showZoneBoundaries, cameraMode, cameraPreset } = useUIStore((s) => s);
  const { configurations } = useSensorStore((s) => s);

  return (
    <BridgeSceneProvider mode={cameraMode}>
      <Environment />
      <BridgeCamera
        preset={cameraPreset}
        coordinateSystem={coordinateSystem}
        focusModel={activeModel ? {
          id: activeModel.id,
          span: activeModel.metadata.span,
          width: activeModel.metadata.width,
          height: activeModel.metadata.height,
        } : null}
      />
      {activeModel ? (
        <Suspense fallback={<Html center>Loading imported bridge geometry…</Html>}>
          <ImportedBridgeLoadBoundary modelName={activeModel.name}>
            <ImportedBridgeAsset model={activeModel} />
          </ImportedBridgeLoadBoundary>
        </Suspense>
      ) : (
        <BridgeModel
          zones={zones}
          components={components}
          coordinateSystem={coordinateSystem}
          showZoneBoundaries={showZoneBoundaries}
        />
      )}
      {showSensorMarkers && (
        <SensorLayer
          sensors={sensorAnchors}
          sensorConfigs={Array.from(configurations.values())}
          heatmapMode={heatmapEnabled ? heatmapMode : 'none'}
        />
      )}
      {showVehicleMarkers && <VehicleSystem />}
      <TrafficFlowSystem />
      <WeatherSystem />
      <RiverSystem />
      {heatmapEnabled && heatmapMode !== 'none' && <HealthHeatmap mode={heatmapMode} />}
      <StructuralHighlight components={components} />
      <LoadVisualization />
      {children}
    </BridgeSceneProvider>
  );
}

export function BridgeSceneWrapper({ children }: { children?: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <BridgeScene>{children}</BridgeScene>
    </div>
  );
}