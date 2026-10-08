import type { HealthScore, HealthStatus, HealthWeights, HealthThresholds, ComponentHealth, ZoneHealth, ContributingFactor } from '../types/health';
import type { TelemetryPacket } from '../types/telemetry';
import type { SensorConfiguration } from '../types/sensor';
import { DEFAULT_HEALTH_WEIGHTS, DEFAULT_HEALTH_THRESHOLDS } from '../types/health';

export interface HealthEngineConfig {
  weights: HealthWeights;
  thresholds: HealthThresholds;
  enableEnvironmentFactor: boolean;
  enableSensorReliabilityFactor: boolean;
}

export class HealthEngine {
  private config: HealthEngineConfig;
  private sensorHealthCache: Map<string, number>;
  private componentHealthCache: Map<string, ComponentHealth>;
  private zoneHealthCache: Map<string, ZoneHealth>;

  constructor(config: Partial<HealthEngineConfig> = {}) {
    this.config = {
      weights: config.weights || DEFAULT_HEALTH_WEIGHTS,
      thresholds: config.thresholds || DEFAULT_HEALTH_THRESHOLDS,
      enableEnvironmentFactor: config.enableEnvironmentFactor ?? true,
      enableSensorReliabilityFactor: config.enableSensorReliabilityFactor ?? true,
    };
    this.sensorHealthCache = new Map();
    this.componentHealthCache = new Map();
    this.zoneHealthCache = new Map();
  }

  updateConfig(config: Partial<HealthEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  calculateSensorHealth(sensor: SensorConfiguration, telemetry: TelemetryPacket): number {
    let health = 100;

    const vibrationScore = telemetry.vibration ? this.scoreVibration(telemetry.vibration.magnitude) : 100;
    const strainScore = telemetry.strain ? this.scoreStrain(telemetry.strain.strain) : 100;
    const displacementScore = telemetry.displacement !== undefined ? this.scoreDisplacement(telemetry.displacement) : 100;

    health -= (100 - vibrationScore) * this.config.weights.vibration;
    health -= (100 - strainScore) * this.config.weights.strain;
    health -= (100 - displacementScore) * this.config.weights.displacement;

    if (this.config.enableEnvironmentFactor && telemetry.weatherCondition !== 'CLEAR') {
      const envScore = this.scoreEnvironment(telemetry.weatherCondition, telemetry.rainfall || 0);
      health -= (100 - envScore) * this.config.weights.environment;
    }

    if (this.config.enableSensorReliabilityFactor) {
      const reliabilityScore = this.scoreReliability(sensor);
      health -= (100 - reliabilityScore) * this.config.weights.sensorReliability;
    }

    health = Math.max(0, Math.min(100, health));
    this.sensorHealthCache.set(sensor.sensorId, health);
    return health;
  }

  private scoreVibration(magnitude: number): number {
    if (magnitude < 0.05) return 100;
    if (magnitude < 0.15) return 85;
    if (magnitude < 0.3) return 70;
    if (magnitude < 0.5) return 50;
    return 30;
  }

  private scoreStrain(strain: number): number {
    if (strain < 20) return 100;
    if (strain < 50) return 85;
    if (strain < 100) return 70;
    if (strain < 150) return 50;
    return 30;
  }

  private scoreDisplacement(displacement: number): number {
    if (displacement < 1) return 100;
    if (displacement < 3) return 85;
    if (displacement < 6) return 70;
    if (displacement < 10) return 50;
    return 30;
  }

  private scoreEnvironment(condition: string, rainfall: number): number {
    switch (condition) {
      case 'CLEAR': return 100;
      case 'CLOUDY': return 95;
      case 'GOLDEN_HOUR': return 95;
      case 'RAIN': return Math.max(70, 90 - rainfall * 2);
      case 'HEAVY_RAIN': return Math.max(50, 80 - rainfall);
      case 'FOG': return 85;
      default: return 90;
    }
  }

  private scoreReliability(sensor: SensorConfiguration): number {
    let score = 100;
    score -= (100 - sensor.signalStrength) * 0.5;
    score -= (100 - sensor.batteryLevel) * 0.3;
    if (sensor.status === 'OFFLINE' || sensor.status === 'STALE') score -= 30;
    if (sensor.status === 'DEGRADED') score -= 15;
    return Math.max(0, score);
  }

  getSensorHealth(sensorId: string): number | undefined {
    return this.sensorHealthCache.get(sensorId);
  }

  calculateComponentHealth(
    componentId: string,
    sensors: SensorConfiguration[],
    telemetryMap: Map<string, TelemetryPacket>
  ): ComponentHealth {
    const componentSensors = sensors.filter((s) => s.zoneId === componentId || s.componentId === componentId);
    if (componentSensors.length === 0) {
      return {
        componentId,
        health: 100,
        status: 'NORMAL',
        contributingFactors: [],
        affectedSensors: [],
      };
    }

    let totalHealth = 0;
    const factors: ContributingFactor[] = [];
    const affectedSensors: string[] = [];

    componentSensors.forEach((sensor) => {
      const telemetry = telemetryMap.get(sensor.sensorId);
      if (!telemetry) return;

      const health = this.calculateSensorHealth(sensor, telemetry);
      totalHealth += health;

      if (telemetry.vibration) {
        factors.push({
          factor: 'Vibration',
          weight: this.config.weights.vibration,
          value: telemetry.vibration.magnitude,
          threshold: 0.3,
          description: `Vibration magnitude: ${telemetry.vibration.magnitude.toFixed(3)}g`,
        });
      }
      if (telemetry.strain) {
        factors.push({
          factor: 'Strain',
          weight: this.config.weights.strain,
          value: telemetry.strain.strain,
          threshold: 100,
          description: `Strain: ${telemetry.strain.strain.toFixed(1)}µε`,
        });
      }
      if (telemetry.displacement !== undefined) {
        factors.push({
          factor: 'Displacement',
          weight: this.config.weights.displacement,
          value: telemetry.displacement,
          threshold: 5,
          description: `Displacement: ${telemetry.displacement.toFixed(2)}mm`,
        });
      }

      if (health < 90) affectedSensors.push(sensor.sensorId);
    });

    const avgHealth = totalHealth / componentSensors.length;
    const status = this.determineStatus(avgHealth);

    const result: ComponentHealth = {
      componentId,
      health: avgHealth,
      status,
      contributingFactors: factors,
      affectedSensors,
    };

    this.componentHealthCache.set(componentId, result);
    return result;
  }

  calculateZoneHealth(zoneId: string, sensors: SensorConfiguration[], telemetryMap: Map<string, TelemetryPacket>): ZoneHealth {
    const zoneSensors = sensors.filter((s) => s.zoneId === zoneId);
    if (zoneSensors.length === 0) {
      return { zoneId, health: 100, status: 'NORMAL', sensorCount: 0, offlineCount: 0, warningCount: 0, criticalCount: 0 };
    }

    let totalHealth = 0;
    let offlineCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    zoneSensors.forEach((sensor) => {
      const telemetry = telemetryMap.get(sensor.sensorId);
      if (!telemetry) {
        offlineCount++;
        return;
      }

      const health = this.calculateSensorHealth(sensor, telemetry);
      totalHealth += health;

      if (telemetry.status === 'OFFLINE' || telemetry.status === 'STALE') offlineCount++;
      else if (telemetry.status === 'WARNING') warningCount++;
      else if (telemetry.status === 'CRITICAL') criticalCount++;
    });

    const avgHealth = totalHealth / Math.max(1, zoneSensors.length - offlineCount);
    const status = this.determineStatus(avgHealth);

    const result: ZoneHealth = {
      zoneId,
      health: avgHealth,
      status,
      sensorCount: zoneSensors.length,
      offlineCount,
      warningCount,
      criticalCount,
    };

    this.zoneHealthCache.set(zoneId, result);
    return result;
  }

  calculateOverallHealth(zoneHealths: ZoneHealth[]): HealthScore {
    if (zoneHealths.length === 0) {
      return this.createHealthScore(100, 100, 100, 100, 100, 100);
    }

    const totalHealth = zoneHealths.reduce((sum, z) => sum + z.health, 0);
    const overall = totalHealth / zoneHealths.length;

    let vibration = 100, strain = 100, displacement = 100, environment = 100, sensorReliability = 100;
    let count = 0;

    zoneHealths.forEach((zh) => {
      if (zh.sensorCount > 0) {
        vibration += 0;
        strain += 0;
        displacement += 0;
        count++;
      }
    });

    return this.createHealthScore(overall, vibration, strain, displacement, environment, sensorReliability);
  }

  private createHealthScore(
    overall: number,
    vibration: number,
    strain: number,
    displacement: number,
    environment: number,
    sensorReliability: number
  ): HealthScore {
    return {
      overall,
      vibration,
      strain,
      displacement,
      environment,
      sensorReliability,
      status: this.determineStatus(overall),
      timestamp: new Date().toISOString(),
    };
  }

  private determineStatus(health: number): HealthStatus {
    if (health >= this.config.thresholds.normal[0]) return 'NORMAL';
    if (health >= this.config.thresholds.warning[0]) return 'WARNING';
    return 'CRITICAL';
  }

  getComponentHealth(componentId: string): ComponentHealth | undefined {
    return this.componentHealthCache.get(componentId);
  }

  getZoneHealth(zoneId: string): ZoneHealth | undefined {
    return this.zoneHealthCache.get(zoneId);
  }

  getAllComponentHealths(): ComponentHealth[] {
    return Array.from(this.componentHealthCache.values());
  }

  getAllZoneHealths(): ZoneHealth[] {
    return Array.from(this.zoneHealthCache.values());
  }

  reset(): void {
    this.sensorHealthCache.clear();
    this.componentHealthCache.clear();
    this.zoneHealthCache.clear();
  }
}