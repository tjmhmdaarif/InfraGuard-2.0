export type AnomalyType =
  | 'HIGH_VIBRATION'
  | 'HIGH_STRAIN'
  | 'EXCESSIVE_DISPLACEMENT'
  | 'UNUSUAL_TEMPERATURE'
  | 'SENSOR_DRIFT'
  | 'SENSOR_FAILURE'
  | 'COMMUNICATION_FAILURE'
  | 'COMBINED_ANOMALY';

export interface Anomaly {
  anomalyId: string;
  type: AnomalyType;
  score: number;
  confidence: number;
  affectedSensors: string[];
  affectedZones: string[];
  description: string;
  timestamp: string;
  simulationTime: number;
  acknowledged: boolean;
}

export interface AnomalyDetectorConfig {
  thresholds: AnomalyThresholds;
  enabledTypes: AnomalyType[];
  sensitivity: number;
}

export interface AnomalyThresholds {
  vibration: number;
  strain: number;
  displacement: number;
  temperature: number;
  drift: number;
  communicationTimeout: number;
}

export const DEFAULT_ANOMALY_THRESHOLDS: AnomalyThresholds = {
  vibration: 2.5,
  strain: 150,
  displacement: 10,
  temperature: 15,
  drift: 0.1,
  communicationTimeout: 5000,
};

export interface AnomalyRule {
  type: AnomalyType;
  condition: (telemetry: TelemetryInput) => boolean;
  score: number;
  description: string;
}

export interface TelemetryInput {
  vibration?: { magnitude: number };
  strain?: { strain: number };
  displacement?: number;
  temperature?: number;
  signalStrength?: number;
  lastUpdate?: string;
  batteryLevel?: number;
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  overallScore: number;
  affectedComponents: string[];
  recommendations: string[];
}