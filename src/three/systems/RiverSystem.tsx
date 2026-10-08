import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEnvironmentStore } from '../../stores/environmentStore';

export function RiverSystem() {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const floodActive = useEnvironmentStore((state) => state.floodActive);
  const floodLevel = useEnvironmentStore((state) => state.floodLevel);
  const emergencyStatus = useEnvironmentStore((state) => state.emergencyStatus);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 80, 100, 30);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -4, 0); // raised so it sits at riverbed level (~y = -4)
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a3a5a',
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current || !meshRef.current.material) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    const heightFactor = Math.max(0, Math.min(100, floodLevel)) / 100;
    const targetHeight = floodActive ? 2.2 + heightFactor * 1.8 : heightFactor * 0.6;
    const turbulence = floodActive ? 1.8 + heightFactor * 2.2 : 0.5 + heightFactor * 1.0;

    meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetHeight, 0.7, delta);
    meshRef.current.position.y += Math.sin(timeRef.current * turbulence) * (floodActive ? 0.045 + heightFactor * 0.06 : 0.015 + heightFactor * 0.02);

    mat.color.set(floodActive || heightFactor > 0 ? '#2983a3' : '#1a3a5a');
    mat.emissive.set(floodActive || heightFactor > 0 ? '#0d3f4c' : '#000000');
    mat.emissiveIntensity = floodActive || heightFactor > 0 ? 0.5 + heightFactor * 0.4 : 0;
    mat.roughness = floodActive || heightFactor > 0 ? 0.18 + heightFactor * 0.15 : 0.1;
    mat.opacity = floodActive || heightFactor > 0 ? 0.92 + heightFactor * 0.06 : 0.8;
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={material} receiveShadow />
      {/* Riverbank warning markers when restricted */}
      {emergencyStatus !== 'NORMAL' && (
        <group position={[0, 0.2, -40]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[2, 0.1, 0.5]} />
            <meshBasicMaterial color={emergencyStatus === 'CLOSED' ? '#ef4444' : '#f59e0b'} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.4, 0.6, 8]} />
            <meshBasicMaterial color={emergencyStatus === 'CLOSED' ? '#ef4444' : '#f59e0b'} />
          </mesh>
        </group>
      )}
    </>
  );
}
