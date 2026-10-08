import type { Anomaly, AnomalyType, AnomalyThresholds, AnomalyDetectionResult, TelemetryInput } from '../types/anomaly';
import type { TelemetryPacket } from '../types/telemetry';
import type { SensorConfiguration } from '../types/sensor';
import { DEFAULT_ANOMALY_THRESHOLDS } from '../types/anomaly';

export interface AnomalyEngineConfig {
  thresholds: AnomalyThresholds;
  enabledTypes: AnomalyType[];
  sensitivity: number;
}

export class AnomalyEngine {
  private config: AnomalyEngineConfig;
  private activeAnomalies: Map<string, Anomaly>;
  private anomalyHistory: Anomaly[];
  private anomalyCounter: number;

  constructor(config: Partial<AnomalyEngineConfig> = {}) {
    this.config = {
      thresholds: config.thresholds || DEFAULT_ANOMALY_THRESHOLDS,
      enabledTypes: config.enabledTypes || [
        'HIGH_VIBRATION',
        'HIGH_STRAIN',
        'EXCESSIVE_DISPLACEMENT',
        'UNUSUAL_TEMPERATURE',
        'SENSOR_DRIFT',
        'SENSOR_FAILURE',
        'COMMUNICATION_FAILURE',
        'COMBINED_ANOMALY',
      ],
      sensitivity: config.sensitivity || 1.0,
    };
    this.activeAnomalies = new Map();
    this.anomalyHistory = [];
    this.anomalyCounter = 0;
  }

  updateConfig(config: Partial<AnomalyEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  detect(sensors: SensorConfiguration[], telemetryMap: Map<string, TelemetryPacket>): AnomalyDetectionResult {
    const newAnomalies: Anomaly[] = [];
    const affectedComponents: string[] = [];
    const affectedSensors: string[] = [];

    sensors.forEach((sensor) => {
      const telemetry = telemetryMap.get(sensor.sensorId);
      if (!telemetry) return;

      const input: TelemetryInput = {
        vibration: telemetry.vibration ? { magnitude: telemetry.vibration.magnitude } : undefined,
        strain: telemetry.strain ? { strain: telemetry.strain.strain } : undefined,
        displacement: telemetry.displacement,
        temperature: telemetry.temperature,
        signalStrength: telemetry.signalStrength,
        lastUpdate: telemetry.timestamp,
        batteryLevel: telemetry.batteryLevel,
      };

      const anomalies = this.runDetection(sensor, input, telemetry);
      anomalies.forEach((anomaly) => {
        const existing = this.activeAnomalies.get(anomaly.anomalyId);
        if (!existing || anomaly.confidence > existing.confidence) {
          this.activeAnomalies.set(anomaly.anomalyId, anomaly);
          newAnomalies.push(anomaly);
          affectedSensors.push(sensor.sensorId);
          if (sensor.componentId) affectedComponents.push(sensor.componentId);
          affectedComponents.push(sensor.zoneId);
        }
      });
    });

    this.cleanupOldAnomalies();
    this.anomalyHistory.push(...newAnomalies);
    if (this.anomalyHistory.length > 1000) {
      this.anomalyHistory = this.anomalyHistory.slice(-1000);
    }

    const overallScore = this.calculateOverallScore();
    const recommendations = this.generateRecommendations(newAnomalies);

    return {
      anomalies: newAnomalies,
      overallScore,
      affectedComponents: [...new Set(affectedComponents)],
      recommendations,
    };
  }

  private runDetection(sensor: SensorConfiguration, input: TelemetryInput, telemetry: TelemetryPacket): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date().toISOString();
    const simTime = telemetry.simulationTime;

    if (this.config.enabledTypes.includes('HIGH_VIBRATION') && input.vibration) {
      if (input.vibration.magnitude > this.config.thresholds.vibration * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'HIGH_VIBRATION',
          sensor,
          input.vibration.magnitude / this.config.thresholds.vibration,
          `High vibration detected: ${input.vibration.magnitude.toFixed(3)}g`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('HIGH_STRAIN') && input.strain) {
      if (input.strain.strain > this.config.thresholds.strain * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'HIGH_STRAIN',
          sensor,
          input.strain.strain / this.config.thresholds.strain,
          `High strain detected: ${input.strain.strain.toFixed(1)}µε`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('EXCESSIVE_DISPLACEMENT') && input.displacement !== undefined) {
      if (input.displacement > this.config.thresholds.displacement * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'EXCESSIVE_DISPLACEMENT',
          sensor,
          input.displacement / this.config.thresholds.displacement,
          `Excessive displacement: ${input.displacement.toFixed(2)}mm`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('UNUSUAL_TEMPERATURE') && input.temperature !== undefined) {
      if (Math.abs(input.temperature - 20) > this.config.thresholds.temperature * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'UNUSUAL_TEMPERATURE',
          sensor,
          Math.abs(input.temperature - 20) / this.config.thresholds.temperature,
          `Unusual temperature: ${input.temperature.toFixed(1)}°C`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('SENSOR_DRIFT')) {
      if (telemetry.quality.drift > this.config.thresholds.drift * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'SENSOR_DRIFT',
          sensor,
          telemetry.quality.drift / this.config.thresholds.drift,
          `Sensor drift detected: ${(telemetry.quality.drift * 100).toFixed(1)}%`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('SENSOR_FAILURE')) {
      if (telemetry.status === 'OFFLINE' || telemetry.status === 'STALE') {
        anomalies.push(this.createAnomaly(
          'SENSOR_FAILURE',
          sensor,
          1.0,
          `Sensor ${telemetry.status.toLowerCase()}`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('COMMUNICATION_FAILURE')) {
      if (telemetry.quality.communicationDelay > this.config.thresholds.communicationTimeout * this.config.sensitivity) {
        anomalies.push(this.createAnomaly(
          'COMMUNICATION_FAILURE',
          sensor,
          telemetry.quality.communicationDelay / this.config.thresholds.communicationTimeout,
          `Communication delay: ${telemetry.quality.communicationDelay.toFixed(0)}ms`,
          simTime
        ));
      } else if (telemetry.quality.packetLoss > 0.1) {
        anomalies.push(this.createAnomaly(
          'COMMUNICATION_FAILURE',
          sensor,
          telemetry.quality.packetLoss,
          `Packet loss: ${(telemetry.quality.packetLoss * 100).toFixed(1)}%`,
          simTime
        ));
      }
    }

    if (this.config.enabledTypes.includes('COMBINED_ANOMALY')) {
      const vibrationHigh = input.vibration && input.vibration.magnitude > this.config.thresholds.vibration * 0.7;
      const strainHigh = input.strain && input.strain.strain > this.config.thresholds.strain * 0.7;
      const displacementHigh = input.displacement !== undefined && input.displacement > this.config.thresholds.displacement * 0.7;

      if ((vibrationHigh && strainHigh) || (vibrationHigh && displacementHigh) || (strainHigh && displacementHigh)) {
        anomalies.push(this.createAnomaly(
          'COMBINED_ANOMALY',
          sensor,
          1.2,
          'Combined structural anomaly detected',
          simTime
        ));
      }
    }

    return anomalies;
  }

  private createAnomaly(
    type: AnomalyType,
    sensor: SensorConfiguration,
    score: number,
    description: string,
    simulationTime: number
  ): Anomaly {
    const anomalyId = `ANOM-${++this.anomalyCounter}-${type}`;
    const confidence = Math.min(1, score * 0.8 + 0.2);

    return {
      anomalyId,
      type,
      score: Math.min(1, score),
      confidence,
      affectedSensors: [sensor.sensorId],
      affectedZones: [sensor.zoneId],
      description,
      timestamp: now,
      simulationTime,
      acknowledged: false,
    };
  }

  private cleanupOldAnomalies(): void {
    const now = Date.now();
    this.activeAnomalies.forEach((anomaly, id) => {
      const anomalyTime = new Date(anomaly.timestamp).getTime();
      if (now - anomalyTime > 300000) {
        this.activeAnomalies.delete(id);
      }
    });
  }

  private calculateOverallScore(): number {
    if (this.activeAnomalies.size === 0) return 0;
    let maxScore = 0;
    this.activeAnomalies.forEach((anomaly) => {
      maxScore = Math.max(maxScore, anomaly.score);
    });
    return maxScore;
  }

  private generateRecommendations(anomalies: Anomaly[]): string[] {
    const recommendations: string[] = [];
    const types = new Set(anomalies.map((a) => a.type));

    if (types.has('HIGH_VIBRATION')) recommendations.push('Inspect structural connections and bearings');
    if (types.has('HIGH_STRAIN')) recommendations.push('Check for overloading or structural damage in affected zone');
    if (types.has('EXCESSIVE_DISPLACEMENT')) recommendations.push('Monitor foundation settlement and support conditions');
    if (types.has('UNUSUAL_TEMPERATURE')) recommendations.push('Verify thermal expansion effects on structural behavior');
    if (types.has('SENSOR_DRIFT')) recommendations.push('Schedule sensor recalibration');
    if (types.has('SENSOR_FAILURE')) recommendations.push('Replace or repair failed sensor');
    if (types.has('COMMUNICATION_FAILURE')) recommendations.push('Check LoRa/Wi-Fi connectivity and gateway status');
    if (types.has('COMBINED_ANOMALY')) recommendations.push('URGENT: Multiple anomaly types detected - immediate structural inspection required');

    return recommendations;
  }

  acknowledgeAnomaly(anomalyId: string): void {
    const anomaly = this.activeAnomalies.get(anomalyId);
    if (anomaly) {
      anomaly.acknowledged = true;
    }
  }

  getActiveAnomalies(): Anomaly[] {
    return Array.from(this.activeAnomalies.values());
  }

  getAnomalyHistory(): Anomaly[] {
    return [...this.anomalyHistory];
  }

  getAnomaliesByType(type: AnomalyType): Anomaly[] {
    return this.anomalyHistory.filter((a) => a.type === type);
  }

  getAnomaliesBySensor(sensorId: string): Anomaly[] {
    return this.anomalyHistory.filter((a) => a.affectedSensors.includes(sensorId));
  }

  getAnomaliesByZone(zoneId: string): Anomaly[] {
    return this.anomalyHistory.filter((a) => a.affectedZones.includes(zoneId));
  }

  clearAnomaly(anomalyId: string): void {
    this.activeAnomalies.delete(anomalyId);
  }

  clearAllAnomalies(): void {
    this.activeAnomalies.clear();
  }

  reset(): void {
    this.activeAnomalies.clear();
    this.anomalyHistory = [];
    this.anomalyCounter = 0;
  }
}