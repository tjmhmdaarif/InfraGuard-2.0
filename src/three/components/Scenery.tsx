import { useMemo } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import * as THREE from 'three';

export function Scenery() {
  const floodLevel = useEnvironmentStore(s => s.floodLevel);
  const weatherMode = useEnvironmentStore(s => s.weatherMode);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Ground plane with terrain texture color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#4a6741" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Hills / rolling terrain — simple box clusters */}
      <group position={[-40, 3, -40]}>
        <mesh position={[0, 0, 0]} receiveShadow castShadow>
          <sphereGeometry args={[12, 16, 16]} />
          <meshStandardMaterial color="#557944" roughness={0.95} />
        </mesh>
      </group>
      <group position={[50, 2, -55]}>
        <mesh position={[0, 0, 0]} receiveShadow castShadow>
          <sphereGeometry args={[14, 16, 16]} />
          <meshStandardMaterial color="#557944" roughness={0.95} />
        </mesh>
      </group>

      {/* Trees — instanced dark green cylinders with sphere tops */}
      <TreeCluster count={60} range={120} />

      {/* Sky gradient (simple dome) */}
      <SkyDome weatherMode={weatherMode} />

      {/* Cloud particles */}
      <CloudLayer count={40} />

      {/* Riverbank grass strips */}
      <Riverbank floodLevel={floodLevel} />
    </group>
  );
}

function TreeCluster({ count, range }: { count: number; range: number }) {
  const trees = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      const h = 3 + Math.random() * 4;
      const scale = 0.8 + Math.random() * 0.5;
      arr.push({ x, z, h, scale, key: i });
    }
    return arr;
  }, [count, range]);
  return (
    <group>
      {trees.map(t => (
        <group key={t.key} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.35, t.h, 8]} />
            <meshStandardMaterial color="#6b7c42" roughness={0.9} />
          </mesh>
          <mesh position={[0, t.h + 1, 0]} castShadow>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#3a4d22" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SkyDome({ weatherMode }: { weatherMode: string }) {
  const isStorm = weatherMode === 'CYCLONE' || weatherMode === 'HEAVY_RAIN';
  return (
    <mesh>
      <sphereGeometry args={[280, 32, 32]} />
      <meshBasicMaterial
        color={isStorm ? '#3a5a7a' : '#87ceeb'}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function CloudLayer({ count }: { count: number }) {
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 200,
        y: 30 + Math.random() * 30,
        z: (Math.random() - 0.5) * 200,
        scale: 2 + Math.random() * 3,
        key: i,
      });
    }
    return arr;
  }, [count]);
  return (
    <group>
      {clouds.map(c => (
        <mesh key={c.key} position={[c.x, c.y, c.z]} scale={c.scale}>
          <sphereGeometry args={[6, 8, 8]} />
          <meshStandardMaterial color="#e8f0fa" roughness={1} metalness={0} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Riverbank({ floodLevel }: { floodLevel: number }) {
  const height = 0.3 + (floodLevel / 100) * 2.5;
  return (
    <group position={[0, -0.2, -120]}>
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[180, height, 8]} />
        <meshStandardMaterial color="#4a6d52" roughness={0.95} />
      </mesh>
      <mesh position={[0, height / 2 + 0.05, 0]} receiveShadow>
        <boxGeometry args={[180, 0.1, 8]} />
        <meshStandardMaterial color="#7aa86e" roughness={0.8} />
      </mesh>
    </group>
  );
}
