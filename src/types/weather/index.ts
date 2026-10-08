export type WeatherMode = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'HEAVY_RAIN' | 'FOG' | 'GOLDEN_HOUR';

export interface WeatherState {
  mode: WeatherMode;
  intensity: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  atmosphericPressure: number;
  transitionProgress: number;
  targetMode?: WeatherMode;
}

export interface WeatherConfiguration {
  mode: WeatherMode;
  intensity: number;
  temperatureRange: [number, number];
  humidityRange: [number, number];
  rainfallRange: [number, number];
  windSpeedRange: [number, number];
  transitionDuration: number;
}

export const WEATHER_CONFIGS: Record<WeatherMode, WeatherConfiguration> = {
  CLEAR: {
    mode: 'CLEAR',
    intensity: 0,
    temperatureRange: [15, 30],
    humidityRange: [30, 60],
    rainfallRange: [0, 0],
    windSpeedRange: [0, 10],
    transitionDuration: 30,
  },
  CLOUDY: {
    mode: 'CLOUDY',
    intensity: 0.3,
    temperatureRange: [10, 25],
    humidityRange: [50, 80],
    rainfallRange: [0, 0],
    windSpeedRange: [5, 20],
    transitionDuration: 30,
  },
  RAIN: {
    mode: 'RAIN',
    intensity: 0.6,
    temperatureRange: [8, 22],
    humidityRange: [70, 95],
    rainfallRange: [2, 15],
    windSpeedRange: [10, 30],
    transitionDuration: 20,
  },
  HEAVY_RAIN: {
    mode: 'HEAVY_RAIN',
    intensity: 1.0,
    temperatureRange: [5, 20],
    humidityRange: [85, 100],
    rainfallRange: [15, 50],
    windSpeedRange: [20, 50],
    transitionDuration: 15,
  },
  FOG: {
    mode: 'FOG',
    intensity: 0.8,
    temperatureRange: [5, 18],
    humidityRange: [90, 100],
    rainfallRange: [0, 1],
    windSpeedRange: [0, 5],
    transitionDuration: 30,
  },
  GOLDEN_HOUR: {
    mode: 'GOLDEN_HOUR',
    intensity: 0.2,
    temperatureRange: [15, 28],
    humidityRange: [40, 70],
    rainfallRange: [0, 0],
    windSpeedRange: [0, 10],
    transitionDuration: 60,
  },
};

export interface WeatherInfluence {
  sensorId: string;
  temperatureInfluence: number;
  humidityInfluence: number;
  rainfallInfluence: number;
  wetnessFactor: number;
  visibilityFactor: number;
}

export interface EnvironmentVisualization {
  rainParticles: boolean;
  wetMaterials: boolean;
  waterReflections: boolean;
  riverTurbulence: number;
  fogDensity: number;
  volumetricLighting: boolean;
  wetRocks: boolean;
}