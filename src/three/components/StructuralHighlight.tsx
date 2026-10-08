import { useMemo } from 'react';
import * as THREE from 'three';
import { useHealthStore } from '../../stores/healthStore';
import { StructuralComponent, ComponentStatus } from '../../types/bridge';

interface StructuralHighlightProps {
  components: StructuralComponent[];
}

export function StructuralHighlight({ components }: StructuralHighlightProps) {
  const { componentHealths } = useHealthStore();

  const highlights = useMemo(() => {
    return components.map((comp) => {
      const health = componentHealths.get(comp.componentId);
      if (!health || health.status === 'NORMAL') return null;

      const color = health.status === 'CRITICAL' ? 0xef4444 : 0xf59e0b;
      const intensity = health.status === 'CRITICAL' ? 1 : 0.6;

      return (
        <mesh
          key={comp.componentId}
          geometry={new THREE.BoxGeometry(1.2, 1.2, 1.2)}
          material={createHighlightMaterial(color, intensity)}
          position={[0, 0, 0]}
        >
          <primitive object={createPulseEffect(color)} />
        </mesh>
      );
    });
  }, [components, componentHealths]);

  return <group>{highlights}</group>;
}

function createHighlightMaterial(color: number, intensity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3 * intensity,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

function createPulseEffect(color: number) {
  const geometry = new THREE.SphereGeometry(1.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

