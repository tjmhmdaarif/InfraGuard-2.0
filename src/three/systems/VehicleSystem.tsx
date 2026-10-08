import { memo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTrafficStore } from '../../stores/trafficStore';
import { useBridgeStore } from '../../stores/bridgeStore';
import { useUIStore } from '../../stores/uiStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import type { Vehicle, VehicleType } from '../../types/traffic';

// ─── Colors ──────────────────────────────────────────────────────────────────
const VEHICLE_BODY_COLORS: Record<VehicleType, string[]> = {
  MOTORCYCLE: ['#c0392b', '#2980b9', '#16a085'],
  CAR:        ['#2471a3', '#1e8449', '#7d3c98', '#b7950b', '#c0392b', '#717d7e'],
  BUS:        ['#f39c12', '#e74c3c', '#2980b9'],
  LIGHT_TRUCK:['#566573', '#7f8c8d', '#4d5656'],
  HEAVY_TRUCK:['#6e2f1a', '#1a5276', '#1e8449'],
};
const GLASS   = new THREE.Color('#b3d9f7');
const TIRE    = new THREE.Color('#1a1c1e');
const RIM     = new THREE.Color('#c8d0d4');
const HEAD    = new THREE.Color('#fff8e1');
const TAIL    = new THREE.Color('#c0392b');
const CHROME  = new THREE.Color('#d5dbdb');

// Seeded color pick (stable per vehicleId)
function pickColor(vehicleId: string, colors: string[]): string {
  let h = 0;
  for (let i = 0; i < vehicleId.length; i++) h = (h * 31 + vehicleId.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export const VehicleSystem = memo(function VehicleSystem() {
  const vehicles = useTrafficStore((state) => state.state.vehicles);
  const showVehicleMarkers = useUIStore((state) => state.showVehicleMarkers);
  if (!showVehicleMarkers) return null;
  return (
    <group>
      {vehicles.map((v) => <VehicleMesh key={v.vehicleId} vehicle={v} />)}
    </group>
  );
});

const VehicleMesh = memo(function VehicleMesh({ vehicle }: { vehicle: Vehicle }) {
  const rootRef  = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);

  const bridgeLength = useBridgeStore((s) => {
    const cs = s.coordinateSystem;
    return cs ? cs.boundingBox.max.x - cs.boundingBox.min.x : 64;
  });
  const deckLevel = useBridgeStore((s) => s.coordinateSystem?.deckPlane.point.y ?? -3.82);
  const weatherMode = useEnvironmentStore((s) => s.weatherMode);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const spd = Math.abs(vehicle.speed);
    const bob = Math.sin(state.clock.elapsedTime * 7 + vehicle.position.x * 0.3) * spd * 0.012;
    root.position.set(vehicle.position.x - bridgeLength / 2, deckLevel + 0.04 + bob, vehicle.position.y);
    root.rotation.y = vehicle.speed < 0 ? Math.PI : 0;
    // Wheel spin
    wheelsRef.current?.traverse((obj) => {
      if (obj.userData.wheel) (obj as THREE.Mesh).rotation.x -= spd * delta * 1.8;
    });
    // Brake lights: slow vehicles
    root.traverse((obj) => {
      if (obj.userData.brakeLight) {
        const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = spd < 2 ? 1.2 : 0.1;
      }
    });
  });

  const color = pickColor(vehicle.vehicleId, VEHICLE_BODY_COLORS[vehicle.vehicleType]);
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.38 });
  const glassMat = new THREE.MeshStandardMaterial({ color: GLASS, metalness: 0.1, roughness: 0.15, transparent: true, opacity: weatherMode === 'FOG' ? 0.5 : 0.7 });
  const tireMat  = new THREE.MeshStandardMaterial({ color: TIRE, roughness: 0.95 });
  const rimMat   = new THREE.MeshStandardMaterial({ color: RIM, metalness: 0.8, roughness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: CHROME, metalness: 0.9, roughness: 0.1 });
  const headMat  = new THREE.MeshStandardMaterial({ color: HEAD, emissive: HEAD, emissiveIntensity: 0.12 });
  const tailMat  = new THREE.MeshStandardMaterial({ color: TAIL, emissive: TAIL, emissiveIntensity: 0.1, userData: { brakeLight: true } });

  const l = vehicle.length;
  const w = vehicle.width;

  return (
    <group ref={rootRef}>
      <group ref={wheelsRef}>
        {vehicle.vehicleType === 'MOTORCYCLE'
          ? <Motorcycle l={l} w={w} bodyMat={bodyMat} glassMat={glassMat} tireMat={tireMat} rimMat={rimMat} chromeMat={chromeMat} />
          : vehicle.vehicleType === 'BUS'
          ? <Bus l={l} w={w} bodyMat={bodyMat} glassMat={glassMat} tireMat={tireMat} rimMat={rimMat} chromeMat={chromeMat} headMat={headMat} tailMat={tailMat} />
          : vehicle.vehicleType === 'HEAVY_TRUCK'
          ? <HeavyTruck l={l} w={w} bodyMat={bodyMat} glassMat={glassMat} tireMat={tireMat} rimMat={rimMat} chromeMat={chromeMat} headMat={headMat} tailMat={tailMat} />
          : vehicle.vehicleType === 'LIGHT_TRUCK'
          ? <LightTruck l={l} w={w} bodyMat={bodyMat} glassMat={glassMat} tireMat={tireMat} rimMat={rimMat} chromeMat={chromeMat} headMat={headMat} tailMat={tailMat} />
          : <Car l={l} w={w} bodyMat={bodyMat} glassMat={glassMat} tireMat={tireMat} rimMat={rimMat} chromeMat={chromeMat} headMat={headMat} tailMat={tailMat} />
        }
      </group>
    </group>
  );
});

// ─── Wheel helper ─────────────────────────────────────────────────────────────
function Wheel({ pos, radius, width, tireMat, rimMat }: {
  pos: [number, number, number]; radius: number; width: number;
  tireMat: THREE.Material; rimMat: THREE.Material;
}) {
  return (
    <group position={pos}>
      {/* Tyre */}
      <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ wheel: true }} castShadow>
        <torusGeometry args={[radius * 0.82, radius * 0.22, 12, 24]} />
        <primitive object={tireMat} attach="material" />
      </mesh>
      {/* Inner disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.6, radius * 0.6, width * 0.7, 16]} />
        <primitive object={tireMat} attach="material" />
      </mesh>
      {/* Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.42, radius * 0.42, width * 0.72, 16]} />
        <primitive object={rimMat} attach="material" />
      </mesh>
      {/* Spokes */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 4]}>
          <boxGeometry args={[radius * 0.08, radius * 0.88, width * 0.12]} />
          <primitive object={rimMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Car ──────────────────────────────────────────────────────────────────────
function Car({ l, w, bodyMat, glassMat, tireMat, rimMat, chromeMat, headMat, tailMat }: any) {
  const wr = 0.4; const ww = 0.22; const bh = 0.5; const ch = 0.46;
  return (
    <>
      {/* Lower body */}
      <mesh position={[0, wr + bh * 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[l * 0.96, bh * 0.6, w * 0.92]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Cabin — tapered with beveled look */}
      <mesh position={[-l * 0.05, wr + bh * 0.6 + ch * 0.4, 0]} castShadow>
        <boxGeometry args={[l * 0.52, ch * 0.76, w * 0.82]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Windshield front */}
      <mesh position={[l * 0.19, wr + bh * 0.62 + ch * 0.25, 0]} rotation={[0, 0, -0.52]}>
        <boxGeometry args={[l * 0.18, ch * 0.65, w * 0.72]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Windshield rear */}
      <mesh position={[-l * 0.26, wr + bh * 0.62 + ch * 0.25, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[l * 0.14, ch * 0.55, w * 0.68]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Side windows */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-l * 0.05, wr + bh * 0.62 + ch * 0.4, s * w * 0.42]}>
          <boxGeometry args={[l * 0.3, ch * 0.44, 0.04]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      ))}
      {/* Bumpers */}
      <mesh position={[l * 0.49, wr + 0.1, 0]}>
        <boxGeometry args={[0.08, 0.18, w * 0.82]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      <mesh position={[-l * 0.49, wr + 0.1, 0]}>
        <boxGeometry args={[0.08, 0.18, w * 0.82]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Headlights */}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[l * 0.49, wr + bh * 0.42, s * w * 0.3]}>
          <boxGeometry args={[0.07, 0.14, 0.22]} />
          <primitive object={headMat} attach="material" />
        </mesh>
      ))}
      {/* Taillights */}
      {[-1, 1].map((s) => (
        <mesh key={`t${s}`} position={[-l * 0.49, wr + bh * 0.42, s * w * 0.3]} userData={{ brakeLight: true }}>
          <boxGeometry args={[0.07, 0.14, 0.22]} />
          <primitive object={tailMat} attach="material" />
        </mesh>
      ))}
      {/* Wheels */}
      {([-l * 0.31, l * 0.31] as number[]).flatMap((x) =>
        ([-w * 0.52, w * 0.52] as number[]).map((z, i) => (
          <Wheel key={`${x}${z}`} pos={[x, wr, z]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
        ))
      )}
    </>
  );
}

// ─── Bus ──────────────────────────────────────────────────────────────────────
function Bus({ l, w, bodyMat, glassMat, tireMat, rimMat, chromeMat, headMat, tailMat }: any) {
  const wr = 0.52; const ww = 0.26;
  return (
    <>
      {/* Main body */}
      <mesh position={[0, wr + 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[l * 0.96, 2.1, w * 0.92]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Roof ridge */}
      <mesh position={[0, wr + 2.25, 0]}>
        <boxGeometry args={[l * 0.9, 0.1, w * 0.6]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Windshield */}
      <mesh position={[l * 0.48, wr + 1.3, 0]}>
        <boxGeometry args={[0.06, 1.2, w * 0.76]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Side windows row */}
      {[-1, 1].map((s) =>
        [-0.28, -0.08, 0.12, 0.32].map((xOff, i) => (
          <mesh key={`${s}${i}`} position={[l * xOff, wr + 1.5, s * w * 0.47]}>
            <boxGeometry args={[l * 0.14, 0.7, 0.05]} />
            <primitive object={glassMat} attach="material" />
          </mesh>
        ))
      )}
      {/* Bumper */}
      <mesh position={[l * 0.49, wr + 0.22, 0]}>
        <boxGeometry args={[0.1, 0.3, w * 0.88]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Headlights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[l * 0.49, wr + 0.7, s * w * 0.33]}>
          <boxGeometry args={[0.06, 0.22, 0.3]} />
          <primitive object={headMat} attach="material" />
        </mesh>
      ))}
      {/* Taillights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-l * 0.49, wr + 0.7, s * w * 0.33]} userData={{ brakeLight: true }}>
          <boxGeometry args={[0.06, 0.22, 0.3]} />
          <primitive object={tailMat} attach="material" />
        </mesh>
      ))}
      {/* Wheels — 3 axles */}
      {([-l * 0.34, 0, l * 0.34] as number[]).flatMap((x) =>
        ([-w * 0.52, w * 0.52] as number[]).map((z) => (
          <Wheel key={`${x}${z}`} pos={[x, wr, z]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
        ))
      )}
    </>
  );
}

// ─── Heavy Truck ──────────────────────────────────────────────────────────────
function HeavyTruck({ l, w, bodyMat, glassMat, tireMat, rimMat, chromeMat, headMat, tailMat }: any) {
  const wr = 0.58; const ww = 0.28;
  const cabMat = new THREE.MeshStandardMaterial({ color: '#5d4037', metalness: 0.6, roughness: 0.35 });
  return (
    <>
      {/* Cab */}
      <mesh position={[l * 0.3, wr + 1.05, 0]} castShadow>
        <boxGeometry args={[l * 0.32, 1.9, w * 0.9]} />
        <primitive object={cabMat} attach="material" />
      </mesh>
      {/* Windshield */}
      <mesh position={[l * 0.46, wr + 1.4, 0]}>
        <boxGeometry args={[0.06, 0.9, w * 0.72]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Cab roof */}
      <mesh position={[l * 0.3, wr + 2.08, 0]}>
        <boxGeometry args={[l * 0.28, 0.24, w * 0.86]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Cargo box */}
      <mesh position={[-l * 0.22, wr + 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[l * 0.52, 1.85, w * 0.88]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Cargo box ribbing */}
      {[-0.36, -0.18, 0, 0.18].map((xOff, i) => (
        <mesh key={i} position={[-l * 0.22 + l * xOff * 0.5, wr + 1.1, 0]}>
          <boxGeometry args={[0.06, 1.7, w * 0.9]} />
          <primitive object={chromeMat} attach="material" />
        </mesh>
      ))}
      {/* Exhaust stack */}
      <mesh position={[l * 0.14, wr + 2.5, w * 0.36]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 8]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Front bumper */}
      <mesh position={[l * 0.49, wr + 0.3, 0]}>
        <boxGeometry args={[0.14, 0.4, w * 0.88]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Headlights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[l * 0.49, wr + 0.8, s * w * 0.32]}>
          <boxGeometry args={[0.08, 0.22, 0.3]} />
          <primitive object={headMat} attach="material" />
        </mesh>
      ))}
      {/* Taillights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-l * 0.49, wr + 0.7, s * w * 0.32]} userData={{ brakeLight: true }}>
          <boxGeometry args={[0.08, 0.28, 0.26]} />
          <primitive object={tailMat} attach="material" />
        </mesh>
      ))}
      {/* Wheels — 3 axles dual rear */}
      {[l * 0.34, 0, -l * 0.25].flatMap((x, ai) =>
        (ai === 0 ? [-w * 0.5, w * 0.5] : [-w * 0.56, -w * 0.44, w * 0.44, w * 0.56]).map((z) => (
          <Wheel key={`${x}${z}`} pos={[x, wr, z]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
        ))
      )}
    </>
  );
}

// ─── Light Truck (pickup) ─────────────────────────────────────────────────────
function LightTruck({ l, w, bodyMat, glassMat, tireMat, rimMat, chromeMat, headMat, tailMat }: any) {
  const wr = 0.44; const ww = 0.24;
  return (
    <>
      {/* Cab */}
      <mesh position={[l * 0.2, wr + 0.7, 0]} castShadow>
        <boxGeometry args={[l * 0.38, 1.2, w * 0.88]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Windshield */}
      <mesh position={[l * 0.38, wr + 0.88, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[l * 0.14, 0.7, w * 0.74]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Side windows */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[l * 0.18, wr + 0.9, s * w * 0.45]}>
          <boxGeometry args={[l * 0.2, 0.5, 0.04]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      ))}
      {/* Bed */}
      <mesh position={[-l * 0.24, wr + 0.35, 0]} castShadow>
        <boxGeometry args={[l * 0.44, 0.55, w * 0.86]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Bed walls */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-l * 0.24, wr + 0.68, s * w * 0.42]}>
          <boxGeometry args={[l * 0.44, 0.28, 0.08]} />
          <primitive object={bodyMat} attach="material" />
        </mesh>
      ))}
      <mesh position={[-l * 0.48, wr + 0.62, 0]}>
        <boxGeometry args={[0.08, 0.24, w * 0.88]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Front bumper */}
      <mesh position={[l * 0.49, wr + 0.18, 0]}>
        <boxGeometry args={[0.1, 0.22, w * 0.84]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Lights */}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[l * 0.49, wr + 0.52, s * w * 0.3]}>
          <boxGeometry args={[0.07, 0.16, 0.24]} />
          <primitive object={headMat} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`t${s}`} position={[-l * 0.49, wr + 0.4, s * w * 0.3]} userData={{ brakeLight: true }}>
          <boxGeometry args={[0.07, 0.16, 0.2]} />
          <primitive object={tailMat} attach="material" />
        </mesh>
      ))}
      {/* Wheels */}
      {([-l * 0.32, l * 0.32] as number[]).flatMap((x) =>
        ([-w * 0.52, w * 0.52] as number[]).map((z) => (
          <Wheel key={`${x}${z}`} pos={[x, wr, z]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
        ))
      )}
    </>
  );
}

// ─── Motorcycle ──────────────────────────────────────────────────────────────
function Motorcycle({ l, w, bodyMat, glassMat, tireMat, rimMat, chromeMat }: any) {
  const wr = 0.36; const ww = 0.18;
  return (
    <>
      {/* Tank / body */}
      <mesh position={[l * 0.04, wr + 0.44, 0]} castShadow>
        <boxGeometry args={[l * 0.42, 0.32, 0.28]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Engine block */}
      <mesh position={[0, wr + 0.3, 0]} castShadow>
        <boxGeometry args={[l * 0.28, 0.26, 0.32]} />
        <meshStandardMaterial color="#8d8d8d" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Fairing */}
      <mesh position={[l * 0.3, wr + 0.55, 0]}>
        <boxGeometry args={[l * 0.2, 0.38, 0.3]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Windshield */}
      <mesh position={[l * 0.36, wr + 0.72, 0]} rotation={[0, 0, -0.38]}>
        <boxGeometry args={[0.08, 0.28, 0.22]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Seat */}
      <mesh position={[-l * 0.06, wr + 0.58, 0]}>
        <boxGeometry args={[l * 0.34, 0.1, 0.24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Handlebar */}
      <mesh position={[l * 0.3, wr + 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.62, 8]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Fork tubes */}
      <mesh position={[l * 0.36, wr + 0.38, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.56, 8]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Exhaust */}
      <mesh position={[-l * 0.1, wr + 0.2, 0.22]} rotation={[0, 0.1, -0.22]}>
        <cylinderGeometry args={[0.04, 0.065, l * 0.5, 8]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* Headlight */}
      <mesh position={[l * 0.42, wr + 0.56, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={HEAD} emissive={HEAD} emissiveIntensity={0.4} />
      </mesh>
      {/* Wheels */}
      <Wheel pos={[l * 0.36, wr, 0]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
      <Wheel pos={[-l * 0.34, wr, 0]} radius={wr} width={ww} tireMat={tireMat} rimMat={rimMat} />
    </>
  );
}
