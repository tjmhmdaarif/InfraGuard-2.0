import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { BridgeModel, BridgeInstance, BridgeZone, StructuralComponent, SensorAnchor, Vector3 } from '../types';

export interface BridgeState {
  models: Map<string, BridgeModel>;
  instances: Map<string, BridgeInstance>;
  activeBridgeId: string | null;
  activeModelId: string | null;
  coordinateSystem: BridgeInstance['coordinateSystem'] | null;
  zones: BridgeZone[];
  components: StructuralComponent[];
  sensorAnchors: SensorAnchor[];
  loadModel: (model: BridgeModel) => void;
  removeModel: (modelId: string) => void;
  setActiveBridge: (bridgeId: string) => void;
  setActiveModel: (modelId: string) => void;
  updateComponentHealth: (componentId: string, health: number, status: StructuralComponent['status']) => void;
  updateComponentStatus: (componentId: string, status: StructuralComponent['status']) => void;
  addSensorAnchor: (anchor: SensorAnchor) => void;
  removeSensorAnchor: (sensorId: string) => void;
  updateSensorAnchor: (sensorId: string, updates: Partial<SensorAnchor>) => void;
  getComponent: (componentId: string) => StructuralComponent | undefined;
  getZone: (zoneId: string) => BridgeZone | undefined;
  getSensorAnchor: (sensorId: string) => SensorAnchor | undefined;
  worldToBridge: (worldPos: Vector3) => Vector3;
  bridgeToWorld: (bridgePos: Vector3) => Vector3;
}

const createDefaultCoordinateSystem = (): BridgeInstance['coordinateSystem'] => ({
  origin: { x: 0, y: 0, z: 0 },
  scale: 1,
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  boundingBox: {
    min: { x: -32, y: -8, z: -3.2 },
    max: { x: 32, y: 8, z: 3.2 },
  },
  deckPlane: {
    point: { x: 0, y: -3.82, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  },
});

const DEFAULT_ZONES: BridgeZone[] = [
  { zoneId: 'LEFT-SUPPORT', name: 'Left Support', description: 'Left abutment and support structure', color: '#3b82f6', bounds: { min: { x: -32, y: -8, z: -3.2 }, max: { x: -28, y: 8, z: 3.2 } }, center: { x: -30, y: 0, z: 0 } },
  { zoneId: 'LEFT-SPAN', name: 'Left Span', description: 'Left approach span', color: '#06b6d4', bounds: { min: { x: -28, y: -8, z: -3.2 }, max: { x: -12, y: 8, z: 3.2 } }, center: { x: -20, y: 0, z: 0 } },
  { zoneId: 'CENTER-SPAN', name: 'Center Span', description: 'Main central span', color: '#10b981', bounds: { min: { x: -12, y: -8, z: -3.2 }, max: { x: 12, y: 8, z: 3.2 } }, center: { x: 0, y: 0, z: 0 } },
  { zoneId: 'RIGHT-SPAN', name: 'Right Span', description: 'Right approach span', color: '#f59e0b', bounds: { min: { x: 12, y: -8, z: -3.2 }, max: { x: 28, y: 8, z: 3.2 } }, center: { x: 20, y: 0, z: 0 } },
  { zoneId: 'RIGHT-SUPPORT', name: 'Right Support', description: 'Right abutment and support structure', color: '#ef4444', bounds: { min: { x: 28, y: -8, z: -3.2 }, max: { x: 32, y: 8, z: 3.2 } }, center: { x: 30, y: 0, z: 0 } },
];

export const useBridgeStore = create<BridgeState>()(
  subscribeWithSelector((set, get) => ({
    models: new Map(),
    instances: new Map(),
    activeBridgeId: null,
    activeModelId: null,
    coordinateSystem: createDefaultCoordinateSystem(),
    zones: DEFAULT_ZONES,
    components: [],
    sensorAnchors: [],

    loadModel: (model: BridgeModel) =>
      set((state) => {
        const newModels = new Map(state.models);
        newModels.set(model.id, model);
        return { models: newModels };
      }),

    removeModel: (modelId: string) =>
      set((state) => {
        const model = state.models.get(modelId);
        if (model?.modelPath.startsWith('blob:')) URL.revokeObjectURL(model.modelPath);
        const models = new Map(state.models);
        models.delete(modelId);
        return {
          models,
          activeModelId: state.activeModelId === modelId ? null : state.activeModelId,
        };
      }),

    setActiveBridge: (bridgeId: string) =>
      set((state) => {
        const instance = state.instances.get(bridgeId);
        if (instance) {
          return {
            activeBridgeId: bridgeId,
            coordinateSystem: instance.coordinateSystem,
            zones: instance.zones,
            components: instance.components,
            sensorAnchors: instance.sensors,
          };
        }
        return { activeBridgeId: bridgeId };
      }),

    setActiveModel: (modelId: string) =>
      set((state) => {
        const model = state.models.get(modelId);
        if (model) {
          return {
            activeModelId: modelId,
            coordinateSystem: model.coordinateSystem,
            zones: model.zones,
            components: model.components,
            sensorAnchors: model.defaultSensors,
          };
        }
        return { activeModelId: modelId };
      }),

    updateComponentHealth: (componentId: string, health: number, status: StructuralComponent['status']) =>
      set((state) => ({
        components: state.components.map((c) =>
          c.componentId === componentId ? { ...c, health: Math.max(0, Math.min(100, health)), status } : c
        ),
      })),

    updateComponentStatus: (componentId: string, status: StructuralComponent['status']) =>
      set((state) => ({
        components: state.components.map((c) =>
          c.componentId === componentId ? { ...c, status } : c
        ),
      })),

    addSensorAnchor: (anchor: SensorAnchor) =>
      set((state) => ({
        sensorAnchors: [...state.sensorAnchors.filter((a) => a.sensorId !== anchor.sensorId), anchor],
      })),

    removeSensorAnchor: (sensorId: string) =>
      set((state) => ({
        sensorAnchors: state.sensorAnchors.filter((a) => a.sensorId !== sensorId),
      })),

    updateSensorAnchor: (sensorId: string, updates: Partial<SensorAnchor>) =>
      set((state) => ({
        sensorAnchors: state.sensorAnchors.map((a) =>
          a.sensorId === sensorId ? { ...a, ...updates } : a
        ),
      })),

    getComponent: (componentId: string) =>
      get().components.find((c) => c.componentId === componentId),

    getZone: (zoneId: string) =>
      get().zones.find((z) => z.zoneId === zoneId),

    getSensorAnchor: (sensorId: string) =>
      get().sensorAnchors.find((a) => a.sensorId === sensorId),

    worldToBridge: (worldPos: Vector3) => {
      const { coordinateSystem } = get();
      if (!coordinateSystem) return worldPos;
      const { origin, scale, orientation } = coordinateSystem;
      return {
        x: (worldPos.x - origin.x) / scale,
        y: (worldPos.y - origin.y) / scale,
        z: (worldPos.z - origin.z) / scale,
      };
    },

    bridgeToWorld: (bridgePos: Vector3) => {
      const { coordinateSystem } = get();
      if (!coordinateSystem) return bridgePos;
      const { origin, scale } = coordinateSystem;
      return {
        x: bridgePos.x * scale + origin.x,
        y: bridgePos.y * scale + origin.y,
        z: bridgePos.z * scale + origin.z,
      };
    },
  }))
);

export const useActiveBridge = () => useBridgeStore((state) => ({
  bridgeId: state.activeBridgeId,
  modelId: state.activeModelId,
  coordinateSystem: state.coordinateSystem,
  zones: state.zones,
  components: state.components,
  sensorAnchors: state.sensorAnchors,
}));

export const useBridgeActions = () => useBridgeStore((state) => ({
  loadModel: state.loadModel,
  removeModel: state.removeModel,
  setActiveBridge: state.setActiveBridge,
  setActiveModel: state.setActiveModel,
  updateComponentHealth: state.updateComponentHealth,
  updateComponentStatus: state.updateComponentStatus,
  addSensorAnchor: state.addSensorAnchor,
  removeSensorAnchor: state.removeSensorAnchor,
  updateSensorAnchor: state.updateSensorAnchor,
  getComponent: state.getComponent,
  getZone: state.getZone,
  getSensorAnchor: state.getSensorAnchor,
  worldToBridge: state.worldToBridge,
  bridgeToWorld: state.bridgeToWorld,
}));