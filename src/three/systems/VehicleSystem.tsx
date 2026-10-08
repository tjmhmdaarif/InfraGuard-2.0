import { memo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTrafficStore } from '../../stores/trafficStore';
import { useBridgeStore } from '../../stores/bridgeStore';
import { useUIStore } from '../../stores/uiStore';
import type { Vehicle, VehicleType } from '../../types/traffic';

const VEHICLE_COLORS: Record<VehicleType, string> = {
  MOTORCYCLE: '#cf7849',
  CAR: '#397d93',
  BUS: '#d1a85c',
  LIGHT_TRUCK: '#81907f',
  HEAVY_TRUCK: '#77838c',
};

const GLASS = '#8fb7c1';
const TIRE = '#171b1d';
const WHEEL_RIM = '#aab3b4';
const HEADLIGHT = '#f4e6b5';
const TAILLIGHT = '#c65b48';

export const VehicleSystem = memo(function VehicleSystem() {
  const vehicles = useTrafficStore((state) => state.state.vehicles);
  const showVehicleMarkers = useUIStore((state) => state.showVehicleMarkers);

  if (!showVehicleMarkers) return null;
  return (
    <group>
      {vehicles.map((vehicle) => (
        <VehicleMesh key={vehicle.vehicleId} vehicle={vehicle} />
      ))}
    </group>
  );
});

const VehicleMesh = memo(function VehicleMesh({ vehicle }: { vehicle: Vehicle }) {
  const rootRef = useRef<THREE.Group>(null);
  const bridgeLength = useBridgeStore((state) => {
    const coordinateSystem = state.coordinateSystem;
    return coordinateSystem
      ? coordinateSystem.boundingBox.max.x - coordinateSystem.boundingBox.min.x
      : 64;
  });
  const deckLevel = useBridgeStore((state) => state.coordinateSystem?.deckPlane.point.y ?? -3.82);
  const color = VEHICLE_COLORS[vehicle.vehicleType];
  const largeVehicle = vehicle.vehicleType === 'BUS' || vehicle.vehicleType === 'HEAVY_TRUCK';
  const length = vehicle.length;
  const width = vehicle.width;
  const bodyHeight = vehicle.vehicleType === 'MOTORCYCLE' ? 0.55 : largeVehicle ? 2.25 : 0.86;
  const cabinHeight = vehicle.vehicleType === 'BUS' ? 2.35 : largeVehicle ? 1.5 : 0.9;
  const wheelRadius = largeVehicle ? 0.55 : vehicle.vehicleType === 'MOTORCYCLE' ? 0.39 : 0.43;
  const wheelPositions = vehicle.vehicleType === 'MOTORCYCLE'
    ? [-length * 0.34, length * 0.34].map((x) => [x, wheelRadius, 0] as const)
    : largeVehicle
      ? [-length * 0.34, 0, length * 0.34].flatMap((x) => [
        [x, wheelRadius, -width * 0.55] as const,
        [x, wheelRadius, width * 0.55] as const,
      ])
      : [-length * 0.31, length * 0.31].flatMap((x) => [
        [x, wheelRadius, -width * 0.56] as const,
        [x, wheelRadius, width * 0.56] as const,
      ]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;
    root.position.set(vehicle.position.x - bridgeLength / 2, deckLevel + 0.04, vehicle.position.y);
    root.rotation.y = vehicle.speed < 0 ? Math.PI : 0;
    root.traverse((part) => {
      if (part.userData.vehicleWheel) part.rotation.z -= Math.abs(vehicle.speed) * delta * 0.035;
    });
  });

  return (
    <group ref={rootRef} userData={{ vehicleId: vehicle.vehicleId }}>
      {vehicle.vehicleType === 'MOTORCYCLE' ? (
        <>
          <mesh position={[0, 0.76, 0]} castShadow>
            <boxGeometry args={[length * 0.32, 0.22, width * 0.28]} />
            <meshStandardMaterial color={color} metalness={0.48} roughness={0.42} />
          </mesh>
          <mesh position={[-length * 0.12, 1.02, 0]} castShadow>
            <boxGeometry args={[length * 0.24, 0.2, width * 0.32]} />
            <meshStandardMaterial color="#292c2d" roughness={0.76} />
          </mesh>
          <mesh position={[length * 0.06, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.72, 8]} />
            <meshStandardMaterial color="#bdc8c5" metalness={0.7} roughness={0.34} />
          </mesh>
          <mesh position={[length * 0.39, 0.85, 0]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.72]} />
            <meshStandardMaterial color="#c5c9bf" metalness={0.54} roughness={0.45} />
          </mesh>
        </>
      ) : vehicle.vehicleType === 'BUS' ? (
        <>
          <mesh position={[-length * 0.02, wheelRadius + cabinHeight * 0.47, 0]} castShadow receiveShadow>
            <boxGeometry args={[length * 0.92, cabinHeight, width * 0.92]} />
            <meshStandardMaterial color={color} metalness={0.22} roughness={0.57} />
          </mesh>
          <mesh position={[length * 0.46, wheelRadius + cabinHeight * 0.47, 0]} castShadow>
            <boxGeometry args={[0.035, cabinHeight * 0.55, width * 0.82]} />
            <meshStandardMaterial color={GLASS} metalness={0.16} roughness={0.24} />
          </mesh>
          {[-1, 1].map((side) => [-0.3, -0.05, 0.2].map((position) => (
            <mesh key={`${side}-${position}`} position={[length * position, wheelRadius + cabinHeight * 0.64, side * width * 0.465]}>
              <boxGeometry args={[length * 0.13, cabinHeight * 0.31, 0.035]} />
              <meshStandardMaterial color={GLASS} metalness={0.1} roughness={0.26} />
            </mesh>
          )))}
          <mesh position={[-length * 0.28, wheelRadius + cabinHeight * 0.1, 0]}>
            <boxGeometry args={[length * 0.18, 0.12, width * 0.94]} />
            <meshStandardMaterial color="#e0d4b9" roughness={0.65} />
          </mesh>
        </>
      ) : vehicle.vehicleType === 'LIGHT_TRUCK' || vehicle.vehicleType === 'HEAVY_TRUCK' ? (
        <>
          <mesh position={[length * 0.17, wheelRadius + bodyHeight * 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[length * 0.42, bodyHeight * 0.74, width * 0.88]} />
            <meshStandardMaterial color={color} metalness={0.24} roughness={0.56} />
          </mesh>
          <mesh position={[length * 0.3, wheelRadius + cabinHeight * 0.72, 0]} castShadow>
            <boxGeometry args={[length * 0.18, cabinHeight * 0.72, width * 0.82]} />
            <meshStandardMaterial color={color} metalness={0.2} roughness={0.52} />
          </mesh>
          <mesh position={[length * 0.305, wheelRadius + cabinHeight * 0.9, 0]}>
            <boxGeometry args={[length * 0.105, cabinHeight * 0.38, width * 0.74]} />
            <meshStandardMaterial color={GLASS} metalness={0.12} roughness={0.24} />
          </mesh>
          <mesh position={[-length * 0.23, wheelRadius + bodyHeight * 0.52, 0]} castShadow>
            <boxGeometry args={[length * 0.48, bodyHeight * 0.65, width * 0.87]} />
            <meshStandardMaterial color={vehicle.vehicleType === 'HEAVY_TRUCK' ? '#8b969b' : '#657369'} roughness={0.7} />
          </mesh>
          {vehicle.vehicleType === 'LIGHT_TRUCK' && [-1, 1].map((side) => (
            <mesh key={side} position={[-length * 0.23, wheelRadius + bodyHeight * 0.83, side * width * 0.4]}>
              <boxGeometry args={[length * 0.5, 0.12, 0.1]} />
              <meshStandardMaterial color="#a7b0a7" metalness={0.35} roughness={0.6} />
            </mesh>
          ))}
          {vehicle.vehicleType === 'HEAVY_TRUCK' && [-1, 1].map((side) => (
            <mesh key={side} position={[-length * 0.22, wheelRadius + bodyHeight * 0.5, side * width * 0.46]}>
              <boxGeometry args={[length * 0.44, bodyHeight * 0.48, 0.08]} />
              <meshStandardMaterial color="#657178" roughness={0.82} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh position={[0, wheelRadius + bodyHeight * 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[length * 0.9, bodyHeight * 0.68, width * 0.9]} />
            <meshStandardMaterial color={color} metalness={0.32} roughness={0.42} />
          </mesh>
          <mesh position={[-length * 0.06, wheelRadius + bodyHeight * 0.88, 0]} castShadow>
            <boxGeometry args={[length * 0.46, bodyHeight * 0.52, width * 0.78]} />
            <meshStandardMaterial color={color} metalness={0.26} roughness={0.38} />
          </mesh>
          <mesh position={[length * 0.15, wheelRadius + bodyHeight * 0.91, 0]}>
            <boxGeometry args={[length * 0.14, bodyHeight * 0.34, width * 0.72]} />
            <meshStandardMaterial color={GLASS} metalness={0.1} roughness={0.21} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[-length * 0.2, wheelRadius + bodyHeight * 0.9, side * width * 0.405]}>
              <boxGeometry args={[length * 0.15, bodyHeight * 0.31, 0.035]} />
              <meshStandardMaterial color={GLASS} roughness={0.24} />
            </mesh>
          ))}
        </>
      )}

      {wheelPositions.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh userData={{ vehicleWheel: true }} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, vehicle.vehicleType === 'MOTORCYCLE' ? 0.24 : 0.28, 18]} />
            <meshStandardMaterial color={TIRE} roughness={0.94} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[wheelRadius * 0.54, wheelRadius * 0.54, 0.29, 12]} />
            <meshStandardMaterial color={WHEEL_RIM} metalness={0.68} roughness={0.34} />
          </mesh>
          {vehicle.vehicleType !== 'MOTORCYCLE' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[wheelRadius * 0.2, wheelRadius * 0.2, 0.31, 10]} />
              <meshStandardMaterial color="#59656a" metalness={0.72} roughness={0.31} />
            </mesh>
          )}
        </group>
      ))}
      {vehicle.vehicleType !== 'MOTORCYCLE' && (
        <>
          {[-1, 1].map((side) => (
            <mesh key={`head-${side}`} position={[length * 0.46, wheelRadius + bodyHeight * 0.35, side * width * 0.32]}>
              <boxGeometry args={[0.08, 0.16, 0.28]} />
              <meshStandardMaterial color={HEADLIGHT} emissive={HEADLIGHT} emissiveIntensity={0.12} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={`tail-${side}`} position={[-length * 0.46, wheelRadius + bodyHeight * 0.35, side * width * 0.32]}>
              <boxGeometry args={[0.08, 0.16, 0.22]} />
              <meshStandardMaterial color={TAILLIGHT} emissive={TAILLIGHT} emissiveIntensity={0.1} />
            </mesh>
          ))}
          <mesh position={[length * 0.49, wheelRadius + bodyHeight * 0.14, 0]}>
            <boxGeometry args={[0.12, 0.12, width * 0.66]} />
            <meshStandardMaterial color="#30373a" metalness={0.42} roughness={0.48} />
          </mesh>
        </>
      )}
    </group>
  );
});
