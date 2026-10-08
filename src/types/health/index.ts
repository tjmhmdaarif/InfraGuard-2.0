export type HealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface HealthThresholds {
  normal: [number, number];
  warning: [number, number];
  critical: [number, number];
}

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  normal: [90, 100],
  warning: [60, 89],
  critical: [0, 59],
};

export interface HealthWeights {
  vibration: number;
  strain: number;
  displacement: number;
  environment: number;
  sensorReliability: number;
}

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  vibration: 0.30,
  strain: 0.30,
  displacement: 0.25,
  environment: 0.10,
  sensorReliability: 0.05,
};

export interface HealthScore {
  overall: number;
  vibration: number;
  strain: number;
  displacement: number;
  environment: number;
  sensorReliability: number;
  status: HealthStatus;
  timestamp: string;
}

export interface ComponentHealth {
  componentId: string;
  health: number;
  status: HealthStatus;
  contributingFactors: ContributingFactor[];
  affectedSensors: string[];
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  value: number;
  threshold: number;
  description: string;
}

export interface HealthEngineConfig {
  thresholds: HealthThresholds;
  weights: HealthWeights;
  enableEnvironmentFactor: boolean;
  enableSensorReliabilityFactor: boolean;
}

export interface ZoneHealth {
  zoneId: string;
  health: number;
  status: HealthStatus;
  sensorCount: number;
  offlineCount: number;
  warningCount: number;
  criticalCount: number;
}