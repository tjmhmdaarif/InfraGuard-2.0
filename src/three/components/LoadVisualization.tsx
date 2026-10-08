import { useMemo } from 'react';
import * as THREE from 'three';
import { useTrafficStore } from '../../stores/trafficStore';
import { useBridgeStore } from '../../stores/bridgeStore';
import { useSensorStore } from '../../stores/sensorStore';

export function LoadVisualization() {
  const vehicles = useTrafficStore((state) => state.state.vehicles);
  const { sensorAnchors } = useBridgeStore();
  const configurations = useSensorStore((state) => state.configurations);
  const sensorConfigs = useMemo(() => Array.from(configurations.values()), [configurations]);

  const loadVectors = useMemo(() => {
    const vectors: THREE.Vector3[] = [];
    vehicles.forEach((vehicle) => {
      sensorAnchors.forEach((sensor) => {
        const config = sensorConfigs.find((c) => c.sensorId === sensor.sensorId);
        if (!config) return;

        const sensorPos = new THREE.Vector3(sensor.position.x * 100, sensor.position.y * 100, sensor.position.z * 100);
        const vehiclePos = new THREE.Vector3(vehicle.position.x, vehicle.position.y, vehicle.position.z);
        const distance = sensorPos.distanceTo(vehiclePos);
        const influence = Math.max(0, 1 - distance / 40);

        if (influence > 0.1) {
          const direction = new THREE.Vector3().subVectors(sensorPos, vehiclePos).normalize();
          vectors.push(direction.multiplyScalar(influence * 5));
        }
      });
    });
    return vectors;
  }, [vehicles, sensorAnchors, sensorConfigs]);

  if (vehicles.length === 0) return null;

  return (
    <group>
      {loadVectors.map((vector, i) => (
        <mesh
          key={i}
          geometry={arrowGeometry}
          material={arrowMaterial}
          position={[vector.x, vector.y + 2, vector.z]}
          rotation={[0, Math.atan2(vector.x, vector.z), 0]}
          scale={[1, vector.length(), 1]}
        />
      ))}
    </group>
  );
}

const arrowGeometry = new THREE.ConeGeometry(0.3, 1, 8);
const arrowMaterial = new THREE.MeshBasicMaterial({
  color: '#f59e0b',
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthWrite: false,
});
