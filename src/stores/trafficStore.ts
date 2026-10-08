import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TrafficState, Vehicle, TrafficConfiguration, TrafficLevel } from '../types/traffic';

export interface TrafficStoreState {
  state: TrafficState;
  config: TrafficConfiguration;
  setConfig: (config: Partial<TrafficConfiguration>) => void;
  updateState: (state: Partial<TrafficState>) => void;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  clearVehicles: () => void;
}

const INITIAL_STATE: TrafficState = {
  vehicles: [],
  density: 50,
  level: 'MEDIUM',
  totalVehicleCount: 0,
  vehiclesOnBridge: 0,
  spawnTimer: 0,
};

const INITIAL_CONFIG: TrafficConfiguration = {
  density: 50,
  level: 'MEDIUM',
  vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 },
  spawnRate: 5,
  maxVehicles: 20,
};

export const useTrafficStore = create<TrafficStoreState>()(
  subscribeWithSelector((set) => ({
    state: INITIAL_STATE,
    config: INITIAL_CONFIG,

    setConfig: (config) =>
      set((state) => ({ config: { ...state.config, ...config } })),

    updateState: (newState) =>
      set((state) => ({ state: { ...state.state, ...newState } })),

    addVehicle: (vehicle) =>
      set((state) => ({
        state: { ...state.state, vehicles: [...state.state.vehicles, vehicle], vehiclesOnBridge: state.state.vehicles.length + 1 },
      })),

    removeVehicle: (vehicleId) =>
      set((state) => ({
        state: { ...state.state, vehicles: state.state.vehicles.filter((v) => v.vehicleId !== vehicleId), vehiclesOnBridge: state.state.vehicles.length - 1 },
      })),

    clearVehicles: () =>
      set((state) => ({ state: { ...state.state, vehicles: [], vehiclesOnBridge: 0 } })),
  }))
);

export const useTrafficState = () => useTrafficStore((s) => s.state);
export const useTrafficConfig = () => useTrafficStore((s) => s.config);
export const useTrafficActions = () => useTrafficStore((s) => ({
  setConfig: s.setConfig,
  updateState: s.updateState,
  addVehicle: s.addVehicle,
  removeVehicle: s.removeVehicle,
  clearVehicles: s.clearVehicles,
}));