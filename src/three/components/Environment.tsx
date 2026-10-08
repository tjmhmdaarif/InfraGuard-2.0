import { useEnvironmentStore } from '../../stores/environmentStore';

export function Environment() {
  const lighting = useEnvironmentStore((state) => state.lighting);
  const weatherMode = useEnvironmentStore((state) => state.weatherMode);
  const cloudFactor = weatherMode === 'HEAVY_RAIN' ? 0.55 : weatherMode === 'RAIN' ? 0.75 : 1;

  return (
    <>
      <ambientLight color="#8290a5" intensity={0.42} />
      <hemisphereLight args={['#b6d3e8', '#252a31', 0.75]} />
      <directionalLight
        color="#fff1d2"
        position={[lighting.x, lighting.y, lighting.z]}
        intensity={lighting.intensity * cloudFactor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />
      <directionalLight
        color="#a8c3d7"
        position={[-lighting.x * 0.6, Math.max(20, lighting.y * 0.55), -lighting.z * 0.6]}
        intensity={0.28}
      />
    </>
  );
}
