import type { DataSource, SensorType } from '../sensor';

export interface TelemetryPacket {
  timestamp: string;
  simulationTime: number;
  bridgeId: string;
  zoneId: string;
  sensorId: string;
  sensorType: SensorType;

  vibration?: VibrationTelemetry;
  strain?: StrainTelemetry;
  load?: LoadTelemetry;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  displacement?: number;
  distance?: number;

  trafficDensity: number;
  vehicleLoad: number;
  weatherCondition: WeatherCondition;

  signalStrength: number;
  batteryLevel: number;

  anomalyScore: number;
  healthScore: number;

  status: TelemetryStatus;
  dataSource: DataSource;
  quality: TelemetryQuality;
}

export interface VibrationTelemetry {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  magnitude: number;
  dominantFrequency: number;
}

export interface StrainTelemetry {
  strain: number;
  unit: 'microstrain';
  baselineStrain: number;
  temperatureCompensation: number;
}

export interface LoadTelemetry {
  load: number;
  unit: 'kN';
  baselineLoad: number;
  trafficContribution: number;
  vehicleContribution: number;
}

export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'HEAVY_RAIN' | 'FOG' | 'GOLDEN_HOUR';

export type TelemetryStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'STALE' | 'DEGRADED';

export interface TelemetryQuality {
  noise: number;
  drift: number;
  packetLoss: number;
  timestampJitter: number;
  stale: boolean;
  communicationDelay: number;
}

export interface TelemetryBatch {
  bridgeId: string;
  timestamp: string;
  simulationTime: number;
  packets: TelemetryPacket[];
}

export interface TelemetryStreamConfig {
  frequency: TelemetryFrequency;
  noiseMode: NoiseMode;
  enableFiltering: boolean;
  filterConfig: FilterConfiguration;
}

export type TelemetryFrequency = 1 | 5 | 10 | 20 | 50;

export type NoiseMode = 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface FilterConfiguration {
  type: 'MOVING_AVERAGE' | 'LOW_PASS' | 'MEDIAN' | 'EMA' | 'NONE';
  windowSize?: number;
  alpha?: number;
  cutoffFrequency?: number;
}

export interface TelemetryStatistics {
  sensorId: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  lastUpdate: string;
}

export interface TelemetryTimeRange {
  start: string;
  end: string;
  simulationStart: number;
  simulationEnd: number;
}