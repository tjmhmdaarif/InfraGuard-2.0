import type { FilterConfiguration, TelemetryQuality } from '../telemetry';

export type SensorType =
  | 'MPU6050'
  | 'STRAIN'
  | 'LOAD_CELL'
  | 'HX711'
  | 'DHT22'
  | 'RAIN'
  | 'HC_SR04';

export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'STALE' | 'DEGRADED';

export interface SensorPosition {
  x: number;
  y: number;
  z: number;
}

export interface SensorRotation {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface CalibrationProfile {
  profileId: string;
  sensorType: SensorType;
  offset: number;
  scaleFactor: number;
  zeroOffset: number;
  sensitivity: number;
  samplingRate: number;
  filterConfiguration: FilterConfiguration;
  unit: string;
}

export interface SensorConfiguration {
  sensorId: string;
  sensorType: SensorType;
  bridgeId: string;
  zoneId: string;
  position: SensorPosition;
  rotation: SensorRotation;
  calibrationProfileId: string;
  componentId?: string;
  status: SensorStatus;
  healthScore: number;
  batteryLevel: number;
  signalStrength: number;
  lastUpdate: string;
  dataSource: DataSource;
  metadata?: Record<string, unknown>;
}

export type DataSource = 'SIMULATION' | 'STM32' | 'MQTT' | 'SERIAL' | 'REPLAY';

export interface SensorReading {
  sensorId: string;
  timestamp: string;
  sensorType: SensorType;
  values: SensorValues;
  status: SensorStatus;
  signalStrength: number;
  batteryLevel: number;
  dataSource: DataSource;
  quality: TelemetryQuality;
}

export interface SensorValues {
  vibration?: VibrationData;
  strain?: StrainData;
  load?: LoadData;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  displacement?: number;
  distance?: number;
}

export interface VibrationData {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  magnitude: number;
}

export interface StrainData {
  strain: number;
  unit: 'microstrain';
}

export interface LoadData {
  load: number;
  unit: 'kN' | 'kg';
}

export interface SensorMarkerState {
  sensorId: string;
  status: SensorStatus;
  isSelected: boolean;
  isHighlighted: boolean;
  pulse: boolean;
}

export const DEFAULT_SENSOR_IDS = {
  VIB: ['VIB-01', 'VIB-02', 'VIB-03'],
  STR: ['STR-01', 'STR-02', 'STR-03'],
  TEMP: ['TEMP-01'],
  RAIN: ['RAIN-01'],
  DIST: ['DIST-01'],
} as const;