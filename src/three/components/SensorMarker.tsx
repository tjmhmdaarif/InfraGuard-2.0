import { memo, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SensorStatus } from '../../types/sensor';

interface SensorMarkerProps {
  sensorId: string;
  sensorType: string;
  position: { x: number; y: number; z: number };
  status: SensorStatus;
  healthScore: number;
  isSelected: boolean;
  isHovered: boolean;
  pulse: boolean;
  heatmapMode: string;
  onClick: () => void;
  onHover: () => void;
  onUnhover: () => void;
}

const STATUS_COLORS: Record<SensorStatus, string> = {
  NORMAL: '#10b981',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
  OFFLINE: '#6b7280',
  STALE: '#9ca3af',
  DEGRADED: '#f97316',
};

const TYPE_ICONS: Record<string, string> = {
  MPU6050: 'vibration',
  STRAIN: 'strain',
  LOAD_CELL: 'load',
  HX711: 'load',
  DHT22: 'temperature',
  RAIN: 'rain',
  HC_SR04: 'distance',
};

export const SensorMarker = memo(function SensorMarker({
  sensorId,
  sensorType,
  position,
  status,
  healthScore,
  isSelected,
  isHovered,
  pulse,
  heatmapMode,
  onClick,
  onHover,
  onUnhover,
}: SensorMarkerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const pulsePhase = useRef(0);
  const baseScale = 1;

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = { sensorId, sensorType, onClick, onHover, onUnhover };
    }
  }, [sensorId, sensorType, onClick, onHover, onUnhover]);

  useFrame((state, delta) => {
    if (meshRef.current && pulse) {
      pulsePhase.current += delta * 3;
      const pulseScale = baseScale + Math.sin(pulsePhase.current) * 0.15;
      meshRef.current.scale.setScalar(pulseScale);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(baseScale);
    }
  });

  const color = useMemo(() => {
    if (heatmapMode !== 'none') {
      const normalizedHealth = healthScore / 100;
      if (normalizedHealth > 0.7) return '#10b981';
      if (normalizedHealth > 0.4) return '#f59e0b';
      return '#ef4444';
    }
    return STATUS_COLORS[status] || STATUS_COLORS.NORMAL;
  }, [status, healthScore, heatmapMode]);

  const ringColor = isSelected ? '#06b6d4' : isHovered ? '#ffffff' : color;

  return (
    <group
      ref={meshRef}
      position={[position.x * 100, position.y * 100, position.z * 100]}
      onClick={onClick}
      onPointerOver={onHover}
      onPointerOut={onUnhover}
    >
      <mesh geometry={outerRingGeometry} material={createRingMaterial(ringColor, isSelected)}>
        <primitive object={createGlowMesh(color)} />
      </mesh>
      <mesh geometry={coreGeometry} material={createCoreMaterial(color)}>
        <primitive object={createTypeIndicator(sensorType, color)} />
      </mesh>
      {isSelected && <SelectionHalo />}
      {status === 'OFFLINE' && <OfflineIndicator />}
    </group>
  );
});

const outerRingGeometry = new THREE.RingGeometry(0.6, 0.8, 16);
const coreGeometry = new THREE.CircleGeometry(0.5, 16);

function createRingMaterial(color: string, selected: boolean) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: selected ? 1 : 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function createCoreMaterial(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function createGlowMesh(color: string) {
  const geometry = new THREE.RingGeometry(0.8, 1.2, 16);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

function createTypeIndicator(sensorType: string, color: string) {
  const icons: Record<string, THREE.BufferGeometry> = {
    vibration: new THREE.CircleGeometry(0.25, 8),
    strain: new THREE.BoxGeometry(0.3, 0.3, 0.1),
    load: new THREE.ConeGeometry(0.2, 0.4, 6),
    temperature: new THREE.SphereGeometry(0.2, 8, 6),
    rain: new THREE.ConeGeometry(0.15, 0.5, 4),
    distance: new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8),
  };
  const geometry = icons[TYPE_ICONS[sensorType] || 'vibration'];
  const material = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 });
  return new THREE.Mesh(geometry, material);
}

function SelectionHalo() {
  return (
    <mesh geometry={haloGeometry} material={haloMaterial} />
  );
}

const haloGeometry = new THREE.RingGeometry(1.0, 1.3, 32);
const haloMaterial = new THREE.MeshBasicMaterial({
  color: '#06b6d4',
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function OfflineIndicator() {
  return (
    <mesh geometry={offlineGeometry} material={offlineMaterial} rotation={[-Math.PI / 2, 0, 0]} />
  );
}

const offlineGeometry = new THREE.PlaneGeometry(1.2, 0.15);
const offlineMaterial = new THREE.MeshBasicMaterial({
  color: '#6b7280',
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function group({ children, ref, position, onClick, onPointerOver, onPointerOut, rotation, scale }: any) {
  return (
    <group
      ref={ref}
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      rotation={rotation}
      scale={scale}
    >
      {children}
    </group>
  );
}

function mesh({ geometry, material, children, rotation, position }: any) {
  return (
    <mesh geometry={geometry} material={material} rotation={rotation} position={position}>
      {children}
    </mesh>
  );
}

function primitive({ object, ...props }: any) {
  return <primitive object={object} {...props} />;
}

function Text({ color, fontSize, children }: any) {
  return <Text color={color} fontSize={fontSize}>{children}</Text>;
}