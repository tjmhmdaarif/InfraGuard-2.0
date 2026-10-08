import { create } from 'zustand';

export type DemoWeatherMode = 'CLEAR' | 'RAIN' | 'HEAVY_RAIN' | 'CYCLONE';
export type SceneFinishMode = 'PBR' | 'WIREFRAME' | 'STRESS';
export type EmergencyStatus = 'NORMAL' | 'ATTENTION' | 'SAFETY_RESTRICTION' | 'CLOSED';

export interface EmergencyRequest {
  id: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  acknowledged: boolean;
}

export interface EnvironmentalControls {
  floodLevel: number; // 0-100, percentage of flood warning
  floodActive: boolean;
  atmosphericPressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // degrees
  visibility: number; // meters
  humidity: number; // percentage
  temperature: number; // celsius
  atmosphericDensity: number; // 0-1 for haze/fog density
  bridgeIntegrity: number; // 0-100 structural health
  emergencyStatus: EmergencyStatus;
  emergencyRequest: EmergencyRequest | null;
  unsafeRestrictions: string[];
}

export interface SceneLighting {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

interface EnvironmentState extends EnvironmentalControls {
  weatherMode: DemoWeatherMode;
  trafficDensity: number;
  lighting: SceneLighting;
  finishMode: SceneFinishMode;
  setWeatherMode: (mode: DemoWeatherMode) => void;
  setFloodActive: (active: boolean) => void;
  setFloodLevel: (level: number) => void;
  setTrafficDensity: (density: number) => void;
  setLighting: (lighting: Partial<SceneLighting>) => void;
  setFinishMode: (mode: SceneFinishMode) => void;
  // Environmental controls
  setAtmosphericPressure: (pressure: number) => void;
  setWindSpeed: (speed: number) => void;
  setWindDirection: (direction: number) => void;
  setVisibility: (visibility: number) => void;
  setHumidity: (humidity: number) => void;
  setTemperature: (temperature: number) => void;
  setAtmosphericDensity: (density: number) => void;
  // Bridge integrity
  setBridgeIntegrity: (integrity: number) => void;
  degradeBridge: (amount: number, duration: number) => void;
  // Emergency management
  setEmergencyStatus: (status: EmergencyStatus) => void;
  createEmergencyRequest: (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', message: string) => void;
  acknowledgeEmergency: (id?: string) => void;
  clearEmergency: () => void;
  resetAll: () => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  // Weather & traffic (existing)
  weatherMode: 'CLEAR',
  trafficDensity: 0,
  lighting: { x: 80, y: 110, z: 45, intensity: 1.35 },
  finishMode: 'PBR',

  // Environmental controls (new)
  floodLevel: 0,
  floodActive: false,
  atmosphericPressure: 1013,
  windSpeed: 5,
  windDirection: 0,
  visibility: 10000,
  humidity: 50,
  temperature: 22,
  atmosphericDensity: 0,
  bridgeIntegrity: 100,
  emergencyStatus: 'NORMAL',
  emergencyRequest: null,
  unsafeRestrictions: [],

  // Weather actions
  setWeatherMode: (weatherMode) => set({ weatherMode }),
  setFloodActive: (floodActive) => set({ floodActive }),
  setFloodLevel: (floodLevel) =>
    set({ floodLevel: Math.max(0, Math.min(100, floodLevel)) }),
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

  // Environmental controls actions
  setAtmosphericPressure: (atmosphericPressure) =>
    set({ atmosphericPressure: Math.max(950, Math.min(1050, atmosphericPressure)) }),
  setWindSpeed: (windSpeed) =>
    set({ windSpeed: Math.max(0, Math.min(200, windSpeed)) }),
  setWindDirection: (windDirection) =>
    set({ windDirection: ((windDirection % 360) + 360) % 360 }),
  setVisibility: (visibility) =>
    set({ visibility: Math.max(1, Math.min(50000, visibility)) }),
  setHumidity: (humidity) =>
    set({ humidity: Math.max(0, Math.min(100, humidity)) }),
  setTemperature: (temperature) =>
    set({ temperature: Math.max(-20, Math.min(60, temperature)) }),
  setAtmosphericDensity: (atmosphericDensity) =>
    set({ atmosphericDensity: Math.max(0, Math.min(1, atmosphericDensity)) }),

  // Bridge integrity actions
  setBridgeIntegrity: (bridgeIntegrity) => {
    const integrity = Math.max(0, Math.min(100, bridgeIntegrity));
    // Auto-adjust emergency status based on integrity
    let emergencyStatus: EmergencyStatus = 'NORMAL';
    const restrictions: string[] = [];
    if (integrity >= 90) {
      emergencyStatus = 'NORMAL';
    } else if (integrity >= 70) {
      emergencyStatus = 'ATTENTION';
      restrictions.push('Heavy vehicles restricted to slow speeds');
    } else if (integrity >= 40) {
      emergencyStatus = 'SAFETY_RESTRICTION';
      restrictions.push('Emergency vehicles only - Do Not Enter for normal traffic');
    } else {
      emergencyStatus = 'CLOSED';
      restrictions.push('BRIDGE CLOSED - Emergency vehicles only');
      restrictions.push('Structural failure imminent - Do Not Enter');
    }
    set({ bridgeIntegrity: integrity, emergencyStatus, unsafeRestrictions: restrictions });
  },
  degradeBridge: (amount, duration) => {
    const current = get().bridgeIntegrity;
    const decayInterval = setInterval(() => {
      const integrity = get().bridgeIntegrity;
      if (integrity <= 0) {
        clearInterval(decayInterval);
        return;
      }
      set((state) => {
        const newIntegrity = Math.max(0, state.bridgeIntegrity - amount / (duration / 1000));
        return { bridgeIntegrity: newIntegrity };
      });
    }, 100);
  },
  // Emergency actions
  setEmergencyStatus: (emergencyStatus) => set({ emergencyStatus }),
  createEmergencyRequest: (severity, message) => {
    const id = crypto.randomUUID();
    const emergencyRequest: EmergencyRequest = {
      id,
      timestamp: new Date().toISOString(),
      severity,
      message,
      acknowledged: false,
    };
    set({ emergencyRequest });
    // Auto-determine bridge integrity degradation for serious emergency
    if (severity === 'CRITICAL') {
      get().degradeBridge(2, 60000); // Rapid degradation
    }
  },
  acknowledgeEmergency: (id = get().emergencyRequest?.id) => {
    if (id) {
      set((state) => ({
        emergencyRequest: state.emergencyRequest
          ? { ...state.emergencyRequest, acknowledged: true }
          : null,
      }));
    }
  },
  clearEmergency: () => set({ emergencyRequest: null }),
  resetAll: () =>
    set({
      weatherMode: 'CLEAR',
      trafficDensity: 0,
      lighting: { x: 80, y: 110, z: 45, intensity: 1.35 },
      finishMode: 'PBR',
      floodLevel: 0,
      floodActive: false,
      atmosphericPressure: 1013,
      windSpeed: 5,
      windDirection: 0,
      visibility: 10000,
      humidity: 50,
      temperature: 22,
      atmosphericDensity: 0,
      bridgeIntegrity: 100,
      emergencyStatus: 'NORMAL',
      emergencyRequest: null,
      unsafeRestrictions: [],
    }),
}));

// Sync computed emergency status when bridge integrity changes
useEnvironmentStore.subscribe(
  (state) => state.bridgeIntegrity,
  (integrity) => {
    if (get().emergencyStatus === 'NORMAL' && integrity < 90) {
      get().setEmergencyStatus('ATTENTION');
    } else if (get().emergencyStatus === 'ATTENTION' && integrity >= 90) {
      get().setEmergencyStatus('NORMAL');
    } else if (get().emergencyStatus === 'ATTENTION' && integrity < 70) {
      get().setEmergencyStatus('SAFETY_RESTRICTION');
    } else if (get().emergencyStatus === 'SAFETY_RESTRICTION' && integrity >= 90) {
      get().setEmergencyStatus('NORMAL');
    } else if (get().emergencyStatus === 'SAFETY_RESTRICTION' && integrity < 40) {
      get().setEmergencyStatus('CLOSED');
    } else if (get().emergencyStatus === 'CLOSED' && integrity >= 70) {
      get().setEmergencyStatus('SAFETY_RESTRICTION');
    }
  }
);

export function applyScenarioEnvironment(scenario: any) {
  const weatherModes = [
    scenario.weather.initialMode,
    ...scenario.weather.transitions.map((transition: { targetMode: string }) => transition.targetMode),
  ].map((mode: string) => mode.toUpperCase());
  const weatherMode: DemoWeatherMode = weatherModes.includes('CYCLONE')
    ? 'CYCLONE'
    : weatherModes.includes('HEAVY_RAIN')
      ? 'HEAVY_RAIN'
      : weatherModes.includes('RAIN')
        ? 'RAIN'
        : 'CLEAR';

  useEnvironmentStore.setState({
    weatherMode,
    floodActive: scenario.traffic.specialVehicles?.some((sv: { vehicleType: string }) => sv.vehicleType === 'FLOOD_RELIEF') ?? false,
    trafficDensity: Math.max(0, Math.min(100, scenario.traffic.density)),
    windSpeed: weatherMode === 'CYCLONE' ? 180 : weatherMode === 'HEAVY_RAIN' ? 60 : 5,
    atmosphericDensity: weatherMode === 'CYCLONE' ? 0.7 : weatherMode === 'HEAVY_RAIN' ? 0.4 : 0,
    visibility: weatherMode === 'CYCLONE' ? 500 : weatherMode === 'HEAVY_RAIN' ? 2000 : 10000,
    humidity: weatherMode === 'CLEAR' ? 40 : weatherMode === 'RAIN' ? 75 : 92,
    atmosphericPressure: weatherMode === 'CYCLONE' ? 960 : weatherMode === 'HEAVY_RAIN' ? 995 : 1013,
  });
}
