import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useTrafficStore } from '../../stores/trafficStore';
import { useUIStore } from '../../stores/uiStore';
import { useBridgeStore } from '../../stores/bridgeStore';

const MAX_VEHICLES = 12;

export function TrafficFlowSystem() {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const density = useEnvironmentStore((state) => state.trafficDensity);
  const activeVehicles = useTrafficStore((state) => state.state.vehicles.length);
  const showVehicleMarkers = useUIStore((state) => state.showVehicleMarkers);
  const bridge = useBridgeStore((state) => state.coordinateSystem);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const targetCount = Math.max(0, Math.round((density / 100) * MAX_VEHICLES) - activeVehicles);
  const length = bridge
    ? bridge.boundingBox.max.x - bridge.boundingBox.min.x
    : 64;
  const deckLevel = bridge?.deckPlane.point.y ?? -3.8;

  useFrame((state) => {
    if (!bodyRef.current || !roofRef.current) return;
    const time = state.clock.elapsedTime;

    for (let index = 0; index < MAX_VEHICLES; index += 1) {
      const visible = showVehicleMarkers && index < targetCount;
      const progress = (time * 0.045 + index / Math.max(targetCount, 1)) % 1;
      const x = -length / 2 + progress * length;
      const lane = index % 2 === 0 ? -1.05 : 1.05;

      transform.position.set(x, visible ? deckLevel + 0.64 : 0, lane);
      transform.rotation.set(0, 0, 0);
      transform.scale.setScalar(visible ? 1 : 0);
      transform.updateMatrix();
      bodyRef.current.setMatrixAt(index, transform.matrix);

      transform.position.set(x - 0.25, visible ? deckLevel + 1.36 : 0, lane);
      transform.scale.set(0.48, visible ? 1 : 0, 0.78);
      transform.updateMatrix();
      roofRef.current.setMatrixAt(index, transform.matrix);
    }

    bodyRef.current.instanceMatrix.needsUpdate = true;
    roofRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX_VEHICLES]} frustumCulled={false}>
        <boxGeometry args={[5, 1.25, 2.1]} />
        <meshStandardMaterial color="#397da0" metalness={0.35} roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, MAX_VEHICLES]} frustumCulled={false}>
        <boxGeometry args={[2.4, 0.8, 1.7]} />
        <meshStandardMaterial color="#91b9c9" metalness={0.25} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}
