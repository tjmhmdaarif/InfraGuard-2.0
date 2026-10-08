import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEnvironmentStore } from '../../stores/environmentStore';

const PARTICLE_COUNT = 900;

export function WeatherSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  const weatherMode = useEnvironmentStore((state) => state.weatherMode);
  const particles = useMemo(() => createRainParticles(), []);
  const background = useMemo(() => {
    if (weatherMode === 'HEAVY_RAIN') return new THREE.Color(0x1a2637);
    if (weatherMode === 'RAIN') return new THREE.Color(0x26364a);
    return new THREE.Color(0x2a3a5a);
  }, [weatherMode]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points || weatherMode === 'CLEAR') return;

    const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = weatherMode === 'HEAVY_RAIN' ? 55 : 38;
    const wind = weatherMode === 'HEAVY_RAIN' ? 4 : 1.5;

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const offset = i * 3;
      positions.array[offset] += wind * delta;
      positions.array[offset + 1] -= speed * delta;
      if (positions.array[offset + 1] < -10) {
        positions.array[offset] = (Math.random() - 0.5) * 120;
        positions.array[offset + 1] = 55 + Math.random() * 40;
        positions.array[offset + 2] = (Math.random() - 0.5) * 80;
      }
    }
    positions.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 75, 260]} />
      {weatherMode !== 'CLEAR' && <primitive ref={pointsRef} object={particles} />}
    </>
  );
}

function createRainParticles() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: '#8fc9e8',
    size: 0.18,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}
