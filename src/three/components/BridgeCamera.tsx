import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CameraPreset } from '../../stores/uiStore';
import type { Vector3 } from '../../types';

const PRESETS: Record<CameraPreset, { position: Vector3; target: Vector3 }> = {
  'full-bridge': { position: { x: 0, y: 14, z: 58 }, target: { x: 0, y: -2, z: 0 } },
  'front-elevation': { position: { x: 0, y: 8, z: 54 }, target: { x: 0, y: -2, z: 0 } },
  'rear-elevation': { position: { x: 0, y: 8, z: -54 }, target: { x: 0, y: -2, z: 0 } },
  'side-profile': { position: { x: 58, y: 8, z: 0 }, target: { x: 0, y: -2, z: 0 } },
  'top-view': { position: { x: 0, y: 82, z: 0 }, target: { x: 0, y: -2, z: 0 } },
  'deck-view': { position: { x: 0, y: 2, z: 24 }, target: { x: 0, y: -3.6, z: 10 } },
  'underside': { position: { x: 0, y: -12, z: 30 }, target: { x: 0, y: -2, z: 10 } },
  'sensor-inspection': { position: { x: 5, y: 5, z: 15 }, target: { x: 0, y: -2, z: 0 } },
  'full-gorge': { position: { x: 0, y: 40, z: 100 }, target: { x: 0, y: -2, z: 0 } },
  'critical-sensor': { position: { x: 0, y: 5, z: 20 }, target: { x: 0, y: -2, z: 0 } },
};

interface BridgeCameraProps {
  preset: CameraPreset | null;
  coordinateSystem: any;
  focusModel: {
    id: string;
    span: number;
    width: number;
    height: number;
  } | null;
}

export function BridgeCamera({ preset, coordinateSystem, focusModel }: BridgeCameraProps) {
  const { camera, gl } = useThree();
  const controls = useThree((state) => isOrbitControls(state.controls) ? state.controls : null);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isTransitioning = useRef(false);
  const transitionStart = useRef(0);
  const transitionDuration = 1000;
  const focusModelId = focusModel?.id;
  const focusSpan = focusModel?.span;
  const focusWidth = focusModel?.width;
  const focusHeight = focusModel?.height;

  useEffect(() => {
    const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight;
    if (camera instanceof THREE.OrthographicCamera) {
      const frustumSize = 50;
      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
    } else if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
    }
    camera.updateProjectionMatrix();
  }, [camera, gl]);

  useEffect(() => {
    if (!preset || !controls) return;
    const p = PRESETS[preset];
    if (!p) return;

    startPosition.current.copy(camera.position);
    startTarget.current.copy(controls.target);
    targetPosition.current.set(p.position.x, p.position.y, p.position.z);
    targetLookAt.current.set(p.target.x, p.target.y, p.target.z);
    isTransitioning.current = true;
    transitionStart.current = performance.now();
  }, [preset, camera, controls]);

  useEffect(() => {
    if (
      !focusModelId ||
      focusSpan === undefined ||
      focusWidth === undefined ||
      focusHeight === undefined ||
      !controls
    ) return;
    const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight;
    const width = Math.max(focusSpan, focusWidth, 1);
    const height = Math.max(focusHeight, 1);
    const verticalFov = THREE.MathUtils.degToRad(
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 45,
    );
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const fitDistance = Math.max(
      width / (2 * Math.tan(horizontalFov / 2)),
      height / (2 * Math.tan(verticalFov / 2)),
      8,
    ) * 1.35;

    if (camera instanceof THREE.OrthographicCamera) {
      const frustumHeight = Math.max(height, width / aspect, 1) * 1.35;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.left = -frustumHeight * aspect / 2;
      camera.right = frustumHeight * aspect / 2;
      camera.updateProjectionMatrix();
    }

    startPosition.current.copy(camera.position);
    startTarget.current.copy(controls.target);
    targetPosition.current.set(0, Math.min(height * 0.25, fitDistance * 0.2), Math.min(fitDistance, 110));
    targetLookAt.current.set(0, 0, 0);
    isTransitioning.current = true;
    transitionStart.current = performance.now();
  }, [focusModelId, focusSpan, focusWidth, focusHeight, camera, controls, gl]);

  useFrame(() => {
    if (isTransitioning.current) {
      if (!controls) return;
      const elapsed = performance.now() - transitionStart.current;
      const t = Math.min(1, elapsed / transitionDuration);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);
      controls.target.lerpVectors(startTarget.current, targetLookAt.current, eased);
      controls.update();

      if (t >= 1) {
        isTransitioning.current = false;
      }
    }

    if (coordinateSystem && camera.position.y < -20) {
      camera.position.y = -20;
    }
    if (coordinateSystem && camera.position.length() > 120) {
      camera.position.normalize().multiplyScalar(120);
    }
  });

  return null;
}

function isOrbitControls(value: unknown): value is { target: THREE.Vector3; update: () => void } {
  return typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    value.target instanceof THREE.Vector3 &&
    'update' in value &&
    typeof value.update === 'function';
}