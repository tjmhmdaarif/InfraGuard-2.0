import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';
import type { BridgeZone, StructuralComponent } from '../../types/bridge';

interface BridgeModelProps {
  zones: BridgeZone[];
  components: StructuralComponent[];
  coordinateSystem: { scale?: number } | null;
  showZoneBoundaries: boolean;
}

export function BridgeModel({ zones, components, coordinateSystem, showZoneBoundaries }: BridgeModelProps) {
  const showStructuralLabels = useUIStore((state) => state.showStructuralLabels);
  const setPanelState = useUIStore((state) => state.setPanelState);
  const bridgeRoot = useRef<THREE.Group>(null);
  const bridgeGroup = useRef<THREE.Group>(null);
  const weatherMode = useEnvironmentStore((state) => state.weatherMode);
  const floodActive = useEnvironmentStore((state) => state.floodActive);
  const trafficDensity = useEnvironmentStore((state) => state.trafficDensity);
  const finishMode = useEnvironmentStore((state) => state.finishMode);
  const stress = Math.min(
    1,
    (weatherMode === 'RAIN' ? 0.2 : weatherMode === 'HEAVY_RAIN' ? 0.35 : 0) +
      (floodActive ? 0.55 : 0) +
      (trafficDensity / 100) * 0.35,
  );

  useEffect(() => {
    const group = bridgeGroup.current;
    if (!group) return;
    buildBridge(group, coordinateSystem?.scale ?? 1, finishMode);
    return () => disposeGroup(group);
  }, [coordinateSystem, finishMode]);

  useFrame((state) => {
    if (!bridgeRoot.current) return;
    const time = state.clock.elapsedTime;
    bridgeRoot.current.position.y = Math.sin(time * (3 + stress * 5)) * stress * 0.035;
    bridgeRoot.current.rotation.z = Math.sin(time * (2 + stress * 4)) * stress * 0.0015;
  });

  return (
    <group
      ref={bridgeRoot}
      onClick={(event) => {
        event.stopPropagation();
        if (event.delta > 5) return;
        setPanelState('componentInspector', { isOpen: true });
        setPanelState('scenarioControl', { isOpen: false });
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <group ref={bridgeGroup} />
      {showZoneBoundaries && <ZoneBoundaries zones={zones} />}
      {showStructuralLabels && <StructuralLabels components={components} />}
    </group>
  );
}

function buildBridge(group: THREE.Group, scale: number, finishMode: 'PBR' | 'WIREFRAME' | 'STRESS') {
  disposeGroup(group);
  const length = 64 * scale;
  const height = 8 * scale;
  const trussSpacing = 4.8 * scale;
  const roadWidth = 6.4 * scale;
  const panels = 8;
  const deckY = -height / 2;
  const wireframe = finishMode === 'WIREFRAME';
  const steel = new THREE.MeshStandardMaterial({
    color: finishMode === 'STRESS' ? '#bd5549' : '#62717b',
    metalness: wireframe ? 0.18 : 0.78,
    roughness: wireframe ? 0.9 : 0.38,
    wireframe,
  });
  const weatheringSteel = new THREE.MeshStandardMaterial({
    color: finishMode === 'STRESS' ? '#ee725e' : '#a65e3f',
    metalness: 0.38,
    roughness: 0.74,
    wireframe,
  });
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: wireframe ? '#71808a' : '#303a40',
    metalness: 0.34,
    roughness: 0.76,
    wireframe,
  });
  const concrete = new THREE.MeshStandardMaterial({ color: '#50575a', roughness: 0.94 });
  const roadMarking = new THREE.MeshStandardMaterial({ color: '#d1b77c', roughness: 0.7, wireframe });

  const spanX = (index: number) => -length / 2 + (length * index) / panels;
  const chordY = (x: number) => {
    const normalized = x / (length / 2);
    return deckY + 0.38 * scale + height * (0.16 + 0.84 * (1 - normalized * normalized));
  };

  const addBeam = (
    parent: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    material: THREE.Material,
  ) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
      material,
    );
    beam.position.copy(start).add(end).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    beam.castShadow = true;
    beam.receiveShadow = true;
    parent.add(beam);
    return beam;
  };

  for (const side of [-1, 1]) {
    const z = side * trussSpacing / 2;
    const lower: THREE.Vector3[] = [];
    const upper: THREE.Vector3[] = [];
    for (let index = 0; index <= panels; index += 1) {
      const x = spanX(index);
      lower.push(new THREE.Vector3(x, deckY + 0.38 * scale, z));
      upper.push(new THREE.Vector3(x, chordY(x), z));
    }
    const topChord = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upper), panels * 12, 0.28 * scale, 10, false),
      steel,
    );
    topChord.castShadow = true;
    group.add(topChord);

    for (let index = 0; index < panels; index += 1) {
      addBeam(group, lower[index], lower[index + 1], 0.22 * scale, steel);
      addBeam(group, lower[index], upper[index], 0.12 * scale, steel);
      if (index % 2 === 0) {
        addBeam(group, lower[index], upper[index + 1], 0.115 * scale, weatheringSteel);
      } else {
        addBeam(group, upper[index], lower[index + 1], 0.115 * scale, weatheringSteel);
      }
      addGussetPlate(group, lower[index], side, scale, weatheringSteel, steel);
      addGussetPlate(group, upper[index], side, scale, weatheringSteel, steel);
    }
    addGussetPlate(group, lower[panels], side, scale, weatheringSteel, steel);
    addGussetPlate(group, upper[panels], side, scale, weatheringSteel, steel);
  }

  for (let index = 0; index <= panels; index += 1) {
    const x = spanX(index);
    const bottomLeft = new THREE.Vector3(x, deckY + 0.2 * scale, -trussSpacing / 2);
    const bottomRight = new THREE.Vector3(x, deckY + 0.2 * scale, trussSpacing / 2);
    const topLeft = new THREE.Vector3(x, chordY(x), -trussSpacing / 2);
    const topRight = new THREE.Vector3(x, chordY(x), trussSpacing / 2);
    addBeam(group, bottomLeft, bottomRight, 0.15 * scale, steel);
    addBeam(group, topLeft, topRight, 0.09 * scale, steel);
    if (index < panels) {
      const nextX = spanX(index + 1);
      const nextLeft = new THREE.Vector3(nextX, chordY(nextX), -trussSpacing / 2);
      const nextRight = new THREE.Vector3(nextX, chordY(nextX), trussSpacing / 2);
      addBeam(group, topLeft, nextRight, 0.065 * scale, weatheringSteel);
      addBeam(group, topRight, nextLeft, 0.065 * scale, weatheringSteel);
    }
  }

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.36 * scale, roadWidth),
    deckMaterial,
  );
  deck.position.y = deckY;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.04 * scale, 0.065 * scale),
      roadMarking,
    );
    edge.position.set(0, deckY + 0.2 * scale, side * roadWidth * 0.4);
    group.add(edge);
  }
  for (let index = 0; index < 22; index += 1) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(1.3 * scale, 0.035 * scale, 0.09 * scale),
      roadMarking,
    );
    marker.position.set(
      -length / 2 + (length * (index + 0.5)) / 22,
      deckY + 0.205 * scale,
      0,
    );
    group.add(marker);
  }

  for (const side of [-1, 1]) {
    const railZ = side * roadWidth * 0.48;
    for (const railY of [0.48, 0.98]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.09 * scale, 0.09 * scale),
        steel,
      );
      rail.position.set(0, deckY + railY * scale, railZ);
      group.add(rail);
    }
    for (let index = 0; index <= 32; index += 1) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.11 * scale, 1.02 * scale, 0.11 * scale),
        weatheringSteel,
      );
      post.position.set(-length / 2 + (length * index) / 32, deckY + 0.5 * scale, railZ);
      group.add(post);
    }
  }

  for (let index = 0; index <= panels; index += 1) {
    const x = spanX(index);
    const girder = new THREE.Mesh(
      new THREE.BoxGeometry(0.34 * scale, 0.42 * scale, roadWidth * 0.96),
      steel,
    );
    girder.position.set(x, deckY - 0.39 * scale, 0);
    girder.castShadow = true;
    group.add(girder);
  }

  for (const side of [-1, 1]) {
    const supportX = side * (length / 2 - 2 * scale);
    for (const z of [-trussSpacing * 0.34, trussSpacing * 0.34]) {
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(1.05 * scale, 4.3 * scale, 1.05 * scale),
        steel,
      );
      column.position.set(supportX, deckY - 2.35 * scale, z);
      column.castShadow = true;
      group.add(column);
      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(2.2 * scale, 0.65 * scale, 2.2 * scale),
        concrete,
      );
      footing.position.set(supportX, deckY - 4.8 * scale, z);
      group.add(footing);
    }
    const abutment = new THREE.Mesh(
      new THREE.BoxGeometry(4.5 * scale, 2.2 * scale, trussSpacing + 2.8 * scale),
      concrete,
    );
    abutment.position.set(side * (length / 2 + 2.4 * scale), deckY - 1.15 * scale, 0);
    abutment.receiveShadow = true;
    group.add(abutment);
  }

  group.updateMatrixWorld(true);
  mergeBridgeMeshes(group);
}

function addGussetPlate(
  group: THREE.Group,
  node: THREE.Vector3,
  side: number,
  scale: number,
  plateMaterial: THREE.Material,
  boltMaterial: THREE.Material,
) {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.62 * scale, 0.72 * scale, 0.1 * scale),
    plateMaterial,
  );
  plate.position.set(node.x, node.y, node.z + side * 0.08 * scale);
  group.add(plate);
  for (const xOffset of [-0.18, 0.18]) {
    for (const yOffset of [-0.2, 0.2]) {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045 * scale, 0.045 * scale, 0.045 * scale, 8),
        boltMaterial,
      );
      bolt.position.set(
        node.x + xOffset * scale,
        node.y + yOffset * scale,
        node.z + side * 0.145 * scale,
      );
      bolt.rotation.x = Math.PI / 2;
      group.add(bolt);
    }
  }
}

function mergeBridgeMeshes(group: THREE.Group) {
  const geometriesByMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (Array.isArray(object.material)) {
      throw new Error('Bridge mesh merging does not support material arrays.');
    }
    const geometries = geometriesByMaterial.get(object.material) ?? [];
    geometries.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
    geometriesByMaterial.set(object.material, geometries);
  });

  const sourceGeometries = new Set<THREE.BufferGeometry>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) sourceGeometries.add(object.geometry);
  });
  group.clear();
  sourceGeometries.forEach((geometry) => geometry.dispose());

  geometriesByMaterial.forEach((geometries, material) => {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) throw new Error('Unable to merge bridge mesh geometries.');
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
}

function disposeGroup(group: THREE.Group | null) {
  if (!group) return;
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
  group.clear();
}

function ZoneBoundaries({ zones }: { zones: BridgeZone[] }) {
  const meshes = useMemo(() => zones.map((zone) => {
    const size = new THREE.Vector3(
      zone.bounds.max.x - zone.bounds.min.x,
      zone.bounds.max.y - zone.bounds.min.y,
      zone.bounds.max.z - zone.bounds.min.z,
    );
    const center = new THREE.Vector3(
      (zone.bounds.max.x + zone.bounds.min.x) / 2,
      (zone.bounds.max.y + zone.bounds.min.y) / 2,
      (zone.bounds.max.z + zone.bounds.min.z) / 2,
    );
    const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const geometry = new THREE.EdgesGeometry(boxGeometry);
    boxGeometry.dispose();
    return { zoneId: zone.zoneId, center, color: zone.color, geometry };
  }), [zones]);

  return (
    <group>
      {meshes.map((zone) => (
        <lineSegments key={zone.zoneId} position={zone.center} geometry={zone.geometry} renderOrder={10}>
          <lineBasicMaterial color={zone.color} transparent opacity={0.3} linewidth={2} />
        </lineSegments>
      ))}
    </group>
  );
}

function StructuralLabels({ components }: { components: StructuralComponent[] }) {
  const labels = useMemo(() => components.map((component) => {
    const position = component.metadata?.position;
    if (
      typeof position !== 'object' ||
      position === null ||
      !('x' in position) ||
      !('y' in position) ||
      !('z' in position) ||
      typeof position.x !== 'number' ||
      typeof position.y !== 'number' ||
      typeof position.z !== 'number'
    ) return null;
    return (
      <sprite
        key={component.componentId}
        position={[position.x, position.y, position.z]}
        scale={2}
      >
        <Text
          color={component.status === 'CRITICAL' ? '#ef4444' : component.status === 'WARNING' ? '#f59e0b' : '#10b981'}
          fontSize={0.5}
        >
          {component.componentId}
        </Text>
      </sprite>
    );
  }), [components]);

  return <group>{labels}</group>;
}
