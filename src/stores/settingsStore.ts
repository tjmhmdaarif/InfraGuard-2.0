import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TelemetryFrequency, NoiseMode } from '../types';

export interface SimulationSettings {
  baselineVibration: number;
  baselineStrain: number;
  baselineDisplacement: number;
  vehicleWeights: Record<string, number>;
  trafficInfluence: number;
  weatherInfluence: number;
  noiseLevel: number;
  sensorFailureProbability: number;
  communicationLossProbability: number;
  healthWeights: {
    vibration: number;
    strain: number;
    displacement: number;
    environment: number;
    sensorReliability: number;
  };
  anomalyThresholds: {
    vibration: number;
    strain: number;
    displacement: number;
    temperature: number;
    drift: number;
    communicationTimeout: number;
  };
}

export interface RenderSettings {
  antialias: boolean;
  shadows: boolean;
  toneMapping: 'none' | 'aces' | 'reinhard' | 'cineon';
  exposure: number;
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  ssaoEnabled: boolean;
  ssaoRadius: number;
  ssaoIntensity: number;
  lodEnabled: boolean;
  frustumCulling: boolean;
  instancingEnabled: boolean;
  maxPixelRatio: number;
}

export interface TelemetrySettings {
  frequency: TelemetryFrequency;
  noiseMode: NoiseMode;
  enableFiltering: boolean;
  filterType: 'MOVING_AVERAGE' | 'LOW_PASS' | 'MEDIAN' | 'EMA' | 'NONE';
  filterWindowSize: number;
  filterAlpha: number;
  maxHistoryLength: number;
  enableRecording: boolean;
}

export interface UISettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  units: 'metric' | 'imperial';
  timeFormat: '12h' | '24h';
  showTooltips: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  panelPositions: Record<string, { x: number; y: number; width: number; height: number }>;
}

export interface ConnectionSettings {
  mqttWebSocketUrl: string;
  mqttTopic: string;
  databaseEndpoint: string;
  databaseOrganization: string;
  databaseBucket: string;
}

export interface SettingsState {
  simulation: SimulationSettings;
  render: RenderSettings;
  telemetry: TelemetrySettings;
  ui: UISettings;
  connections: ConnectionSettings;
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  updateRenderSettings: (settings: Partial<RenderSettings>) => void;
  updateTelemetrySettings: (settings: Partial<TelemetrySettings>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  updateConnectionSettings: (settings: Partial<ConnectionSettings>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  baselineVibration: 0.02,
  baselineStrain: 10,
  baselineDisplacement: 0.5,
  vehicleWeights: {
    MOTORCYCLE: 250,
    CAR: 1500,
    BUS: 15000,
    LIGHT_TRUCK: 5000,
    HEAVY_TRUCK: 30000,
  },
  trafficInfluence: 1.0,
  weatherInfluence: 0.5,
  noiseLevel: 0.05,
  sensorFailureProbability: 0.001,
  communicationLossProbability: 0.005,
  healthWeights: { vibration: 0.3, strain: 0.3, displacement: 0.25, environment: 0.1, sensorReliability: 0.05 },
  anomalyThresholds: { vibration: 2.5, strain: 150, displacement: 10, temperature: 15, drift: 0.1, communicationTimeout: 5000 },
};

const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  antialias: true,
  shadows: true,
  toneMapping: 'aces',
  exposure: 1.0,
  bloomEnabled: true,
  bloomStrength: 0.5,
  bloomRadius: 0.5,
  bloomThreshold: 0.8,
  ssaoEnabled: false,
  ssaoRadius: 0.5,
  ssaoIntensity: 1.0,
  lodEnabled: true,
  frustumCulling: true,
  instancingEnabled: true,
  maxPixelRatio: 2,
};

const DEFAULT_TELEMETRY_SETTINGS: TelemetrySettings = {
  frequency: 10,
  noiseMode: 'LOW',
  enableFiltering: true,
  filterType: 'MOVING_AVERAGE',
  filterWindowSize: 5,
  filterAlpha: 0.1,
  maxHistoryLength: 10000,
  enableRecording: true,
};

const DEFAULT_UI_SETTINGS: UISettings = {
  theme: 'dark',
  language: 'en',
  units: 'metric',
  timeFormat: '24h',
  showTooltips: true,
  animationsEnabled: true,
  reducedMotion: false,
  compactMode: false,
  panelPositions: {},
};

const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  mqttWebSocketUrl: 'ws://localhost:9001/mqtt',
  mqttTopic: 'infraguard/+/telemetry',
  databaseEndpoint: 'http://localhost:8086',
  databaseOrganization: '',
  databaseBucket: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      simulation: DEFAULT_SIMULATION_SETTINGS,
      render: DEFAULT_RENDER_SETTINGS,
      telemetry: DEFAULT_TELEMETRY_SETTINGS,
      ui: DEFAULT_UI_SETTINGS,
      connections: DEFAULT_CONNECTION_SETTINGS,

      updateSimulationSettings: (settings: Partial<SimulationSettings>) =>
        set((state) => ({ simulation: { ...state.simulation, ...settings } })),

      updateRenderSettings: (settings: Partial<RenderSettings>) =>
        set((state) => ({ render: { ...state.render, ...settings } })),

      updateTelemetrySettings: (settings: Partial<TelemetrySettings>) =>
        set((state) => ({ telemetry: { ...state.telemetry, ...settings } })),

      updateUISettings: (settings: Partial<UISettings>) =>
        set((state) => ({ ui: { ...state.ui, ...settings } })),

      updateConnectionSettings: (settings: Partial<ConnectionSettings>) =>
        set((state) => ({ connections: { ...state.connections, ...settings } })),

      resetToDefaults: () =>
        set({
          simulation: DEFAULT_SIMULATION_SETTINGS,
          render: DEFAULT_RENDER_SETTINGS,
          telemetry: DEFAULT_TELEMETRY_SETTINGS,
          ui: DEFAULT_UI_SETTINGS,
          connections: DEFAULT_CONNECTION_SETTINGS,
        }),

      exportSettings: () => {
        const { simulation, render, telemetry, ui, connections } = get();
        return JSON.stringify({ simulation, render, telemetry, ui, connections }, null, 2);
      },

      importSettings: (json: string) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.simulation) set({ simulation: { ...DEFAULT_SIMULATION_SETTINGS, ...parsed.simulation } });
          if (parsed.render) set({ render: { ...DEFAULT_RENDER_SETTINGS, ...parsed.render } });
          if (parsed.telemetry) set({ telemetry: { ...DEFAULT_TELEMETRY_SETTINGS, ...parsed.telemetry } });
          if (parsed.ui) set({ ui: { ...DEFAULT_UI_SETTINGS, ...parsed.ui } });
          if (parsed.connections) set({ connections: { ...DEFAULT_CONNECTION_SETTINGS, ...parsed.connections } });
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'infraguard-settings', version: 1 }
  )
);

export const useSimulationSettings = () => useSettingsStore((state) => state.simulation);
export const useRenderSettings = () => useSettingsStore((state) => state.render);
export const useTelemetrySettings = () => useSettingsStore((state) => state.telemetry);
export const useUISettings = () => useSettingsStore((state) => state.ui);
export const useSettingsActions = () => useSettingsStore((state) => ({
  updateSimulationSettings: state.updateSimulationSettings,
  updateRenderSettings: state.updateRenderSettings,
  updateTelemetrySettings: state.updateTelemetrySettings,
  updateUISettings: state.updateUISettings,
  resetToDefaults: state.resetToDefaults,
  exportSettings: state.exportSettings,
  importSettings: state.importSettings,
}));