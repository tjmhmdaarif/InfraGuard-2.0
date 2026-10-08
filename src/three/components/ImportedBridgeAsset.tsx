import { Component, useMemo } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { useUIStore } from '../../stores/uiStore';
import type { BridgeModel } from '../../types/bridge';

interface ImportedBridgeAssetProps {
  model: BridgeModel;
}

interface LoadBoundaryProps {
  children: ReactNode;
  modelName: string;
}

interface LoadBoundaryState {
  error: Error | null;
}

export class ImportedBridgeLoadBoundary extends Component<LoadBoundaryProps, LoadBoundaryState> {
  state: LoadBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LoadBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Unable to render imported bridge "${this.props.modelName}".`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Html center>
        <div role="alert" className="max-w-xs rounded-lg border border-red-400/40 bg-slate-950/95 p-3 text-sm text-red-200">
          Could not render {this.props.modelName}. Check the selected file and import it again.
        </div>
      </Html>
    );
  }
}

export function ImportedBridgeAsset({ model }: ImportedBridgeAssetProps) {
  const isObj = model.metadata.sourceFormat === 'OBJ' || model.description.includes('· OBJ ·');
  return isObj
    ? <ImportedObj model={model} />
    : <ImportedGltf model={model} />;
}

function ImportedGltf({ model }: ImportedBridgeAssetProps) {
  const { scene } = useGLTF(model.modelPath);
  return <ImportedAsset model={model} scene={scene} />;
}

function ImportedObj({ model }: ImportedBridgeAssetProps) {
  const scene = useLoader(OBJLoader, model.modelPath);
  return <ImportedAsset model={model} scene={scene} />;
}

function ImportedAsset({ model, scene }: ImportedBridgeAssetProps & { scene: THREE.Object3D }) {
  const setPanelState = useUIStore((state) => state.setPanelState);
  const asset = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);
  const orientation = model.coordinateSystem.orientation;
  const rotation = useMemo(() => new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w),
  ), [orientation]);

  return (
    <group
      position={[0, -model.metadata.height / 2, 0]}
      rotation={rotation}
      scale={model.coordinateSystem.scale}
      onClick={(event) => {
        event.stopPropagation();
        if (event.delta > 5) return;
        setPanelState('componentInspector', { isOpen: true });
        setPanelState('scenarioControl', { isOpen: false });
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <primitive object={asset} />
    </group>
  );
}
