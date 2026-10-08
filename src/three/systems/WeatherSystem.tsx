import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEnvironmentStore } from '../../stores/environmentStore';

const PARTICLE_COUNT = 1400;

export function WeatherSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  const backgroundRef = useRef<THREE.Color>(new THREE.Color(0x2a3a5a));
  const fogRef = useRef<THREE.Color>(new THREE.Color(0x2a3a5a));

  const { weatherMode, windSpeed, atmosphericPressure, visibility, humidity, floodActive } = useEnvironmentStore();
  const isCyclone = weatherMode === 'CYCLONE';
  const isHeavyRain = weatherMode === 'HEAVY_RAIN';
  const isRain = weatherMode === 'RAIN';
  const isFog = weatherMode === 'FOG';

  const particleColor = useMemo(() => {
    if (isCyclone) return '#6b7f9e';
    if (isHeavyRain) return '#8fb8d4';
    if (isRain) return '#9ecef0';
    return '#8fc9e8';
  }, [isCyclone, isHeavyRain, isRain]);

  const background = useMemo(() => {
    if (isCyclone) return new THREE.Color(0x0b1018);
    if (isHeavyRain) return new THREE.Color(0x1a2637);
    if (isRain) return new THREE.Color(0x26364a);
    if (isFog) return new THREE.Color(0x9aaaac);
    return new THREE.Color(0x2a3a5a);
  }, [isCyclone, isHeavyRain, isRain, isFog]);

  const fogColor = useMemo(() => {
    if (isCyclone) return new THREE.Color(0x0d1420);
    if (isFog) return new THREE.Color(0x9aaaac);
    return background;
  }, [isCyclone, isFog, background]);

  const fogDensity = useMemo(() => {
    if (isCyclone) return 0.045;
    if (isFog) return 0.065;
    return 0.012;
  }, [isCyclone, isFog]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points || weatherMode === 'CLEAR') return;

    const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = isCyclone ? 95 : isHeavyRain ? 55 : isRain ? 38 : 22;
    const wind = isCyclone ? windSpeed * 0.08 : isHeavyRain ? 4 : 1.5;
    const currentDir = useEnvironmentStore.getState().windDirection;
    const windX = Math.sin((currentDir * Math.PI) / 180) * wind;
    const windZ = Math.cos((currentDir * Math.PI) / 180) * wind * 0.4;

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const offset = i * 3;
      positions.array[offset] += (windX + (Math.random() - 0.5) * 3) * delta;
      positions.array[offset + 1] -= speed * delta;
      positions.array[offset + 2] += windZ * delta;
      if (positions.array[offset + 1] < -10) {
        positions.array[offset] = (Math.random() - 0.5) * 120;
        positions.array[offset + 1] = 55 + Math.random() * 40;
        positions.array[offset + 2] = (Math.random() - 0.5) * 80;
      }
    }
    positions.needsUpdate = true;

    // Sync background & fog for cyclone live wind changes
    backgroundRef.current.copy(background);
    fogRef.current.copy(fogColor);
  });

  return (
    <>
      <color ref={backgroundRef as any} attach="background" args={[background]} />
      <fog attach="fog" args={[fogColor, isCyclone ? 55 : 75, isCyclone ? 160 : 260]} />
      {/* Volumetric-looking ambient for cyclone */}
      {isCyclone && (
        <ambientLight intensity={0.15} color="#3a4a5a" />
      )}
      {weatherMode !== 'CLEAR' && <primitive ref={pointsRef} object={createRainParticles(particleColor, isCyclone)} />}
    </>
  );
}

function createRainParticles(color: string, cyclone: boolean) {
  const count = cyclone ? 2000 : 900;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size: cyclone ? 0.26 : 0.18,
    transparent: true,
    opacity: cyclone ? 0.85 : 0.72,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}
