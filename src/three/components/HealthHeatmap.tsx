import { useMemo } from 'react';
import * as THREE from 'three';
import { useHealthStore } from '../../stores/healthStore';
import { useBridgeStore } from '../../stores/bridgeStore';

type HeatmapMode = 'health' | 'vibration' | 'strain' | 'load' | 'displacement' | 'temperature';

interface HealthHeatmapProps {
  mode: HeatmapMode;
}

export function HealthHeatmap({ mode }: HealthHeatmapProps) {
  const { componentHealths, zoneHealths } = useHealthStore();
  const { components } = useBridgeStore();

  const heatmapMeshes = useMemo(() => {
    if (mode === 'health') return [];

    return components.map((comp) => {
      const health = componentHealths.get(comp.componentId);
      if (!health) return null;

      let value = 0;
      switch (mode) {
        case 'vibration': value = health.contributingFactors.find((f) => f.factor === 'Vibration')?.value || 0; break;
        case 'strain': value = health.contributingFactors.find((f) => f.factor === 'Strain')?.value || 0; break;
        case 'displacement': value = health.contributingFactors.find((f) => f.factor === 'Displacement')?.value || 0; break;
        case 'load': value = health.health; break;
        case 'temperature': value = 22; break;
      }

      const color = getHeatmapColor(value, mode);
      const opacity = 0.4;

      return (
        <mesh
          key={comp.componentId}
          geometry={comp.meshName ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(1)}
          material={createHeatmapMaterial(color, opacity)}
          position={comp.meshName ? [0, 0, 0] : [0, 0, 0]}
        />
      );
    });
  }, [components, componentHealths, mode]);

  if (mode === 'health') return null;
  return <group>{heatmapMeshes}</group>;
}

function getHeatmapColor(value: number, mode: HeatmapMode) {
  let normalized = 0;
  switch (mode) {
    case 'vibration': normalized = Math.min(1, value / 0.5); break;
    case 'strain': normalized = Math.min(1, value / 200); break;
    case 'displacement': normalized = Math.min(1, value / 10); break;
    case 'load': normalized = 1 - value / 100; break;
    case 'temperature': normalized = Math.min(1, Math.abs(value - 20) / 20); break;
  }

  if (normalized < 0.3) return new THREE.Color(0x10b981);
  if (normalized < 0.6) return new THREE.Color(0xf59e0b);
  return new THREE.Color(0xef4444);
}

function createHeatmapMaterial(color: THREE.Color, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}