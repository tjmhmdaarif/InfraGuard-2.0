import { create } from 'zustand';
import type { Scenario } from '../types/scenario';

export type DemoWeatherMode = 'CLEAR' | 'RAIN' | 'HEAVY_RAIN';
export type SceneFinishMode = 'PBR' | 'WIREFRAME' | 'STRESS';

export interface SceneLighting {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

interface EnvironmentState {
  weatherMode: DemoWeatherMode;
  floodActive: boolean;
  trafficDensity: number;
  lighting: SceneLighting;
  finishMode: SceneFinishMode;
  setWeatherMode: (mode: DemoWeatherMode) => void;
  setFloodActive: (active: boolean) => void;
  setTrafficDensity: (density: number) => void;
  setLighting: (lighting: Partial<SceneLighting>) => void;
  setFinishMode: (mode: SceneFinishMode) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  weatherMode: 'CLEAR',
  floodActive: false,
  trafficDensity: 0,
  lighting: { x: 80, y: 110, z: 45, intensity: 1.35 },
  finishMode: 'PBR',
  setWeatherMode: (weatherMode) => set({ weatherMode }),
  setFloodActive: (floodActive) => set({ floodActive }),
  setTrafficDensity: (trafficDensity) =>
    set({ trafficDensity: Math.max(0, Math.min(100, trafficDensity)) }),
  setLighting: (lighting) =>
    set((state) => ({
      lighting: {
        ...state.lighting,
        ...lighting,
        x: Math.max(-120, Math.min(120, lighting.x ?? state.lighting.x)),
        y: Math.max(10, Math.min(160, lighting.y ?? state.lighting.y)),
        z: Math.max(-120, Math.min(120, lighting.z ?? state.lighting.z)),
        intensity: Math.max(0.2, Math.min(3, lighting.intensity ?? state.lighting.intensity)),
      },
    })),
  setFinishMode: (finishMode) => set({ finishMode }),
}));

export function applyScenarioEnvironment(scenario: Scenario) {
  const weatherModes = [
    scenario.weather.initialMode,
    ...scenario.weather.transitions.map((transition) => transition.targetMode),
  ].map((mode) => mode.toUpperCase());
  const weatherMode: DemoWeatherMode = weatherModes.includes('HEAVY_RAIN')
    ? 'HEAVY_RAIN'
    : weatherModes.includes('RAIN')
      ? 'RAIN'
      : 'CLEAR';

  useEnvironmentStore.setState({
    weatherMode,
    floodActive: false,
    trafficDensity: Math.max(0, Math.min(100, scenario.traffic.density)),
  });
}
