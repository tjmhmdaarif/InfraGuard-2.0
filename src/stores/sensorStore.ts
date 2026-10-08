import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SensorConfiguration, SensorStatus, SensorType, DataSource, SensorPosition, SensorRotation, CalibrationProfile, FilterConfiguration } from '../types';

export interface SensorState {
  configurations: Map<string, SensorConfiguration>;
  calibrationProfiles: Map<string, CalibrationProfile>;
  selectedSensorId: string | null;
  hoveredSensorId: string | null;
  placementMode: boolean;
  placementSensorType: SensorType | null;
  filterConfigs: Map<string, FilterConfiguration>;
  addConfiguration: (config: SensorConfiguration) => void;
  removeConfiguration: (sensorId: string) => void;
  updateConfiguration: (sensorId: string, updates: Partial<SensorConfiguration>) => void;
  updateStatus: (sensorId: string, status: SensorStatus) => void;
  updateHealth: (sensorId: string, health: number) => void;
  updateBattery: (sensorId: string, level: number) => void;
  updateSignal: (sensorId: string, strength: number) => void;
  updateDataSource: (sensorId: string, source: DataSource) => void;
  selectSensor: (sensorId: string | null) => void;
  hoverSensor: (sensorId: string | null) => void;
  setPlacementMode: (enabled: boolean, sensorType?: SensorType) => void;
  addCalibrationProfile: (profile: CalibrationProfile) => void;
  updateCalibrationProfile: (profileId: string, updates: Partial<CalibrationProfile>) => void;
  getConfiguration: (sensorId: string) => SensorConfiguration | undefined;
  getConfigurationsByZone: (zoneId: string) => SensorConfiguration[];
  getConfigurationsByType: (type: SensorType) => SensorConfiguration[];
  getOnlineCount: () => number;
  getTotalCount: () => number;
}

const DEFAULT_CALIBRATION_PROFILES: CalibrationProfile[] = [
  { profileId: 'MPU6050-DEFAULT', sensorType: 'MPU6050', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 16384, samplingRate: 100, filterConfiguration: { type: 'LOW_PASS', cutoffFrequency: 10 }, unit: 'g' },
  { profileId: 'STRAIN-DEFAULT', sensorType: 'STRAIN', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 50, filterConfiguration: { type: 'MOVING_AVERAGE', windowSize: 5 }, unit: 'µε' },
  { profileId: 'LOAD_CELL-DEFAULT', sensorType: 'LOAD_CELL', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 10, filterConfiguration: { type: 'EMA', alpha: 0.1 }, unit: 'kN' },
  { profileId: 'HX711-DEFAULT', sensorType: 'HX711', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 80, filterConfiguration: { type: 'MOVING_AVERAGE', windowSize: 10 }, unit: 'kg' },
  { profileId: 'DHT22-DEFAULT', sensorType: 'DHT22', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 0.5, filterConfiguration: { type: 'NONE' }, unit: '°C/%' },
  { profileId: 'RAIN-DEFAULT', sensorType: 'RAIN', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 1, filterConfiguration: { type: 'NONE' }, unit: 'mm/h' },
  { profileId: 'HC_SR04-DEFAULT', sensorType: 'HC_SR04', offset: 0, scaleFactor: 1, zeroOffset: 0, sensitivity: 1, samplingRate: 20, filterConfiguration: { type: 'MEDIAN', windowSize: 3 }, unit: 'mm' },
];

export const useSensorStore = create<SensorState>()(
  subscribeWithSelector((set, get) => ({
    configurations: new Map(),
    calibrationProfiles: new Map(DEFAULT_CALIBRATION_PROFILES.map((p) => [p.profileId, p])),
    selectedSensorId: null,
    hoveredSensorId: null,
    placementMode: false,
    placementSensorType: null,
    filterConfigs: new Map(),

    addConfiguration: (config: SensorConfiguration) =>
      set((state) => {
        const newConfigs = new Map(state.configurations);
        newConfigs.set(config.sensorId, config);
        return { configurations: newConfigs };
      }),

    removeConfiguration: (sensorId: string) =>
      set((state) => {
        const newConfigs = new Map(state.configurations);
        newConfigs.delete(sensorId);
        return { configurations: newConfigs, selectedSensorId: state.selectedSensorId === sensorId ? null : state.selectedSensorId };
      }),

    updateConfiguration: (sensorId: string, updates: Partial<SensorConfiguration>) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, ...updates });
        return { configurations: newConfigs };
      }),

    updateStatus: (sensorId: string, status: SensorStatus) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, status, lastUpdate: new Date().toISOString() });
        return { configurations: newConfigs };
      }),

    updateHealth: (sensorId: string, health: number) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, healthScore: Math.max(0, Math.min(100, health)) });
        return { configurations: newConfigs };
      }),

    updateBattery: (sensorId: string, level: number) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, batteryLevel: Math.max(0, Math.min(100, level)) });
        return { configurations: newConfigs };
      }),

    updateSignal: (sensorId: string, strength: number) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, signalStrength: Math.max(0, Math.min(100, strength)) });
        return { configurations: newConfigs };
      }),

    updateDataSource: (sensorId: string, source: DataSource) =>
      set((state) => {
        const config = state.configurations.get(sensorId);
        if (!config) return state;
        const newConfigs = new Map(state.configurations);
        newConfigs.set(sensorId, { ...config, dataSource: source });
        return { configurations: newConfigs };
      }),

    selectSensor: (sensorId: string | null) =>
      set({ selectedSensorId: sensorId }),

    hoverSensor: (sensorId: string | null) =>
      set({ hoveredSensorId: sensorId }),

    setPlacementMode: (enabled: boolean, sensorType?: SensorType) =>
      set({ placementMode: enabled, placementSensorType: sensorType || null }),

    addCalibrationProfile: (profile: CalibrationProfile) =>
      set((state) => {
        const newProfiles = new Map(state.calibrationProfiles);
        newProfiles.set(profile.profileId, profile);
        return { calibrationProfiles: newProfiles };
      }),

    updateCalibrationProfile: (profileId: string, updates: Partial<CalibrationProfile>) =>
      set((state) => {
        const profile = state.calibrationProfiles.get(profileId);
        if (!profile) return state;
        const newProfiles = new Map(state.calibrationProfiles);
        newProfiles.set(profileId, { ...profile, ...updates });
        return { calibrationProfiles: newProfiles };
      }),

    getConfiguration: (sensorId: string) =>
      get().configurations.get(sensorId),

    getConfigurationsByZone: (zoneId: string) =>
      Array.from(get().configurations.values()).filter((c) => c.zoneId === zoneId),

    getConfigurationsByType: (type: SensorType) =>
      Array.from(get().configurations.values()).filter((c) => c.sensorType === type),

    getOnlineCount: () =>
      Array.from(get().configurations.values()).filter((c) => c.status !== 'OFFLINE').length,

    getTotalCount: () =>
      get().configurations.size,
  }))
);

export const useSensorConfigurations = () => useSensorStore((state) => state.configurations);
export const useSelectedSensor = () => useSensorStore((state) => state.selectedSensorId);
export const useSensorActions = () => useSensorStore((state) => ({
  addConfiguration: state.addConfiguration,
  removeConfiguration: state.removeConfiguration,
  updateConfiguration: state.updateConfiguration,
  updateStatus: state.updateStatus,
  updateHealth: state.updateHealth,
  updateBattery: state.updateBattery,
  updateSignal: state.updateSignal,
  updateDataSource: state.updateDataSource,
  selectSensor: state.selectSensor,
  hoverSensor: state.hoverSensor,
  setPlacementMode: state.setPlacementMode,
  addCalibrationProfile: state.addCalibrationProfile,
  getConfiguration: state.getConfiguration,
  getConfigurationsByZone: state.getConfigurationsByZone,
  getConfigurationsByType: state.getConfigurationsByType,
}));