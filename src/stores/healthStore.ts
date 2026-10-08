import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ComponentHealth, ZoneHealth, HealthScore, ContributingFactor } from '../types/health';

export interface HealthStoreState {
  componentHealths: Map<string, ComponentHealth>;
  zoneHealths: Map<string, ZoneHealth>;
  overallHealth: HealthScore | null;
  sensorHealths: Map<string, number>;
  updateComponentHealth: (health: ComponentHealth) => void;
  updateZoneHealth: (health: ZoneHealth) => void;
  updateOverallHealth: (health: HealthScore) => void;
  updateSensorHealth: (sensorId: string, health: number) => void;
  clear: () => void;
}

export const useHealthStore = create<HealthStoreState>()(
  subscribeWithSelector((set) => ({
    componentHealths: new Map(),
    zoneHealths: new Map(),
    overallHealth: null,
    sensorHealths: new Map(),

    updateComponentHealth: (health) =>
      set((state) => {
        const newMap = new Map(state.componentHealths);
        newMap.set(health.componentId, health);
        return { componentHealths: newMap };
      }),

    updateZoneHealth: (health) =>
      set((state) => {
        const newMap = new Map(state.zoneHealths);
        newMap.set(health.zoneId, health);
        return { zoneHealths: newMap };
      }),

    updateOverallHealth: (health) =>
      set({ overallHealth: health }),

    updateSensorHealth: (sensorId, health) =>
      set((state) => {
        const newMap = new Map(state.sensorHealths);
        newMap.set(sensorId, health);
        return { sensorHealths: newMap };
      }),

    clear: () =>
      set({ componentHealths: new Map(), zoneHealths: new Map(), overallHealth: null, sensorHealths: new Map() }),
  }))
);

export const useComponentHealths = () => useHealthStore((s) => s.componentHealths);
export const useZoneHealths = () => useHealthStore((s) => s.zoneHealths);
export const useOverallHealth = () => useHealthStore((s) => s.overallHealth);
export const useSensorHealths = () => useHealthStore((s) => s.sensorHealths);
export const useHealthActions = () => useHealthStore((s) => ({
  updateComponentHealth: s.updateComponentHealth,
  updateZoneHealth: s.updateZoneHealth,
  updateOverallHealth: s.updateOverallHealth,
  updateSensorHealth: s.updateSensorHealth,
  clear: s.clear,
}));