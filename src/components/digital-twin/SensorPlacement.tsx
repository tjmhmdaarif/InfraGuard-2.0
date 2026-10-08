import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MousePointer2, X, Check, RotateCcw, Move, RotateCw, Search, Save, Trash2 } from 'lucide-react';
import { useSensorStore } from '../../stores/sensorStore';
import { useBridgeStore } from '../../stores/bridgeStore';
import { SensorType, SensorConfiguration } from '../../types/sensor';

interface PlacementModeState {
  isActive: boolean;
  sensorType: SensorType | null;
  tempPosition: { x: number; y: number; z: number } | null;
  selectedSensorId: string | null;
}

export function useSensorPlacement() {
  const [state, setState] = useState<PlacementModeState>({
    isActive: false,
    sensorType: null,
    tempPosition: null,
    selectedSensorId: null,
  });

  const startPlacement = (sensorType: SensorType) => {
    setState((s) => ({ ...s, isActive: true, sensorType }));
  };

  const cancelPlacement = () => {
    setState({ isActive: false, sensorType: null, tempPosition: null, selectedSensorId: null });
  };

  const setTempPosition = (pos: { x: number; y: number; z: number }) => {
    setState((s) => ({ ...s, tempPosition: pos }));
  };

  const confirmPlacement = () => {
    setState((s) => ({ ...s, isActive: false, tempPosition: null }));
  };

  return {
    state,
    startPlacement,
    cancelPlacement,
    setTempPosition,
    confirmPlacement,
  };
}

interface SensorPlacementToolbarProps {
  isActive: boolean;
  sensorType: SensorType | null;
  tempPosition: { x: number; y: number; z: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRotate: () => void;
  onDelete?: () => void;
}

export function SensorPlacementToolbar({ isActive, sensorType, tempPosition, onConfirm, onCancel, onRotate, onDelete }: SensorPlacementToolbarProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border-primary)] rounded-xl shadow-xl">
        <span className="px-2 py-1 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded text-xs font-medium">PLACEMENT MODE</span>
        <span className="text-sm font-medium text-[var(--fg-primary)]">
          {sensorType ? `Placing: ${sensorType}` : 'Select sensor type'}
        </span>
        {tempPosition && (
          <span className="font-mono text-xs text-[var(--fg-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded">
            ({tempPosition.x.toFixed(2)}, {tempPosition.y.toFixed(2)}, {tempPosition.z.toFixed(2)})
          </span>
        )}
        <div className="w-px h-6 bg-[var(--border-primary)]" />
        <button onClick={onRotate} className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]" title="Rotate 45°">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={onConfirm} disabled={!tempPosition} className="p-2 rounded hover:bg-[var(--accent-green)]/20 text-[var(--accent-green)] disabled:opacity-30 disabled:cursor-not-allowed" title="Confirm">
          <Check className="w-4 h-4" />
        </button>
        {onDelete && (
          <button onClick={onDelete} className="p-2 rounded hover:bg-[var(--accent-red)]/20 text-[var(--accent-red)]" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button onClick={onCancel} className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function SensorPlacementHandler() {
  const { gl, scene, camera, raycaster, pointer } = useThree();
  const { addConfiguration, setPlacementMode, placementMode, placementSensorType } = useSensorStore();
  const { worldToBridge } = useBridgeStore();
  const tempRef = useRef<THREE.Mesh | null>(null);
  const [placementState, setPlacementState] = useState({ isActive: false, sensorType: null as SensorType | null, tempPos: null as { x: number; y: number; z: number } | null });

  useEffect(() => {
    if (!placementMode) return;
    const onPointerMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => (i.object as THREE.Mesh).geometry?.type === 'BoxGeometry' || i.object.name.includes('truss'));
      if (hit) {
        const point = hit.point;
        const bridgePos = worldToBridge({ x: point.x / 100, y: point.y / 100, z: point.z / 100 });
        setPlacementState((s) => ({ ...s, tempPos: bridgePos }));
        if (tempRef.current) {
          tempRef.current.position.set(point.x, point.y, point.z);
        }
      }
    };
    const onClick = (e: MouseEvent) => {
      if (placementMode && placementSensorType && placementState.tempPos) {
        const sensorId = `${placementSensorType.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
        const config: SensorConfiguration = {
          sensorId,
          sensorType: placementSensorType,
          bridgeId: 'BRIDGE-001',
          zoneId: 'CENTER-SPAN',
          position: placementState.tempPos,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          calibrationProfileId: `${placementSensorType}-DEFAULT`,
          status: 'NORMAL',
          healthScore: 100,
          batteryLevel: 100,
          signalStrength: 100,
          lastUpdate: new Date().toISOString(),
          dataSource: 'SIMULATION',
        };
        addConfiguration(config);
        setPlacementMode(false);
        setPlacementState({ isActive: false, sensorType: null, tempPos: null });
        if (tempRef.current) {
          scene.remove(tempRef.current);
        }
      }
    };
    gl.domElement.addEventListener('pointermove', onPointerMove);
    gl.domElement.addEventListener('click', onClick);
    return () => {
      gl.domElement.removeEventListener('pointermove', onPointerMove);
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [placementMode, placementSensorType, gl, raycaster, pointer, camera, placementState.tempPos, scene, worldToBridge, addConfiguration, setPlacementMode]);

  useEffect(() => {
    if (placementMode && !tempRef.current) {
      const geo = new THREE.SphereGeometry(0.3, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
      tempRef.current = new THREE.Mesh(geo, mat);
      scene.add(tempRef.current);
    }
    if (!placementMode && tempRef.current) {
      scene.remove(tempRef.current);
      tempRef.current = null;
    }
  }, [placementMode, scene]);

  return null;
}