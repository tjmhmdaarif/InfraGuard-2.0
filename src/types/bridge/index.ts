export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface BridgeCoordinateSystem {
  origin: Vector3;
  scale: number;
  orientation: Quaternion;
  boundingBox: {
    min: Vector3;
    max: Vector3;
  };
  deckPlane: {
    point: Vector3;
    normal: Vector3;
  };
}

export interface BridgeZone {
  zoneId: string;
  name: string;
  description: string;
  color: string;
  bounds: {
    min: Vector3;
    max: Vector3;
  };
  center: Vector3;
}

export interface StructuralComponent {
  componentId: string;
  componentType: ComponentType;
  zoneId: string;
  meshName?: string;
  health: number;
  status: ComponentStatus;
  affectedSensors: string[];
  metadata?: Record<string, unknown>;
}

export type ComponentType =
  | 'MAIN_TRUSS_LEFT'
  | 'MAIN_TRUSS_RIGHT'
  | 'TOP_CHORD'
  | 'BOTTOM_CHORD'
  | 'DIAGONAL'
  | 'VERTICAL'
  | 'CROSS_BEAM'
  | 'GUSSET_PLATE'
  | 'SUPPORT'
  | 'ABUTMENT'
  | 'DECK'
  | 'GUARD_RAIL'
  | 'JOINT';

export type ComponentStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface BridgeModel {
  id: string;
  name: string;
  description: string;
  modelPath: string;
  previewImage?: string;
  coordinateSystem: BridgeCoordinateSystem;
  zones: BridgeZone[];
  components: StructuralComponent[];
  defaultSensors: SensorAnchor[];
  metadata: {
    span: number;
    width: number;
    height: number;
    material: string;
    yearBuilt?: number;
    location?: string;
    spanAxis?: 'x' | 'z';
    sourceUnit?: string;
    sourceFormat?: 'GLB' | 'GLTF' | 'OBJ';
  };
}

export interface SensorAnchor {
  sensorId: string;
  sensorType: string;
  position: Vector3;
  rotation?: Quaternion;
  zoneId: string;
  componentId?: string;
  mountingPosition: 'TOP' | 'BOTTOM' | 'SIDE' | 'CENTER';
  orientation: 'LONGITUDINAL' | 'TRANSVERSE' | 'VERTICAL';
}

export interface BridgeInstance {
  bridgeId: string;
  modelId: string;
  name: string;
  coordinateSystem: BridgeCoordinateSystem;
  zones: BridgeZone[];
  components: StructuralComponent[];
  sensors: SensorAnchor[];
  createdAt: string;
  updatedAt: string;
}