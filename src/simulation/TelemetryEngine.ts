import { SeededRandom } from './SeededRandom';
import { calibrationEngine } from '../calibration/CalibrationEngine';
import type {
  TelemetryPacket,
  TelemetryBatch,
  VibrationTelemetry,
  StrainTelemetry,
  LoadTelemetry,
  WeatherCondition,
  TelemetryStatus,
  DataSource,
  TelemetryQuality,
  Vector3,
} from '../types';
import type { Vehicle } from '../types/traffic';
import type { WeatherState } from '../types/weather';
import type { SensorConfiguration } from '../types/sensor';
import type { BridgeZone, StructuralComponent } from '../types/bridge';

export interface TelemetryEngineConfig {
  seed: string;
  bridgeId: string;
  zones: BridgeZone[];
  components: StructuralComponent[];
  sensors: SensorConfiguration[];
  trafficInfluenceFactor: number;
  weatherInfluenceFactor: number;
  noiseMode: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH';
  baselineVibration: number;
  baselineStrain: number;
  baselineDisplacement: number;
  vehicleWeights: Record<string, number>;
}

export class TelemetryEngine {
  private config: TelemetryEngineConfig;
  private random: SeededRandom;
  private vehicleStates: Map<string, Vehicle>;
  private weatherState: WeatherState;
  private sensorBaselines: Map<string, { vibration: number; strain: number; displacement: number }>;
  private structuralCondition: Map<string, number>;
  private anomalyStates: Map<string, { type: string; intensity: number; startTime: number; duration: number }>;
  private sensorFailureStates: Map<string, { type: string; severity: number; startTime: number }>;
  private lastTelemetryTime: number;
  private packetCounter: number;
  private sensorBatteryLevels: Map<string, number>;

  constructor(config: TelemetryEngineConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
    this.vehicleStates = new Map();
    this.weatherState = this.getDefaultWeather();
    this.sensorBaselines = new Map();
    this.structuralCondition = new Map();
    this.anomalyStates = new Map();
    this.sensorFailureStates = new Map();
    this.lastTelemetryTime = 0;
    this.packetCounter = 0;
    this.sensorBatteryLevels = new Map();
    this.initializeBaselines();
  }

  private getDefaultWeather(): WeatherState {
    return {
      mode: 'CLEAR',
      intensity: 0,
      temperature: 22,
      humidity: 50,
      rainfall: 0,
      windSpeed: 5,
      windDirection: 0,
      visibility: 10000,
      atmosphericPressure: 1013,
      transitionProgress: 0,
    };
  }

  private initializeBaselines(): void {
    this.config.sensors.forEach((sensor) => {
      const zoneFactor = this.getZoneFactor(sensor.zoneId);
      this.sensorBaselines.set(sensor.sensorId, {
        vibration: this.config.baselineVibration * zoneFactor,
        strain: this.config.baselineStrain * zoneFactor,
        displacement: this.config.baselineDisplacement * zoneFactor,
      });
      this.structuralCondition.set(sensor.zoneId, 1.0);
    });
    // Initialize stable per-sensor battery levels (seeded, not random per packet)
    this.config.sensors.forEach((sensor, i) => {
      // Each sensor starts between 88–99% and drains at ~0.001% per second
      this.sensorBatteryLevels.set(sensor.sensorId, 88 + (i % 12));
    });
  }

  private getZoneFactor(zoneId: string): number {
    switch (zoneId) {
      case 'LEFT-SUPPORT':
      case 'RIGHT-SUPPORT':
        return 0.5;
      case 'LEFT-SPAN':
      case 'RIGHT-SPAN':
        return 0.8;
      case 'CENTER-SPAN':
        return 1.0;
      default:
        return 1.0;
    }
  }

  updateConfig(config: Partial<TelemetryEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.random = new SeededRandom(this.config.seed);
  }

  setVehicles(vehicles: Vehicle[]): void {
    this.vehicleStates.clear();
    vehicles.forEach((v) => this.vehicleStates.set(v.vehicleId, v));
  }

  setWeather(weather: WeatherState): void {
    this.weatherState = weather;
  }

  setAnomaly(anomalyId: string, type: string, intensity: number, duration: number, affectedSensors: string[]): void {
    affectedSensors.forEach((sensorId) => {
      this.anomalyStates.set(sensorId, { type, intensity, startTime: this.lastTelemetryTime, duration });
    });
  }

  clearAnomaly(sensorId: string): void {
    this.anomalyStates.delete(sensorId);
  }

  setSensorFailure(sensorId: string, type: string, severity: number): void {
    this.sensorFailureStates.set(sensorId, { type, severity, startTime: this.lastTelemetryTime });
  }

  clearSensorFailure(sensorId: string): void {
    this.sensorFailureStates.delete(sensorId);
  }

  generateTelemetry(simulationTime: number): TelemetryBatch {
    this.lastTelemetryTime = simulationTime;
    const packets: TelemetryPacket[] = [];

    this.config.sensors.forEach((sensor) => {
      const packet = this.generateSensorPacket(sensor, simulationTime);
      packets.push(packet);
    });

    return {
      bridgeId: this.config.bridgeId,
      timestamp: new Date().toISOString(),
      simulationTime,
      packets,
    };
  }

  private generateSensorPacket(sensor: SensorConfiguration, simulationTime: number): TelemetryPacket {
    const baseline = this.sensorBaselines.get(sensor.sensorId) || { vibration: 0, strain: 0, displacement: 0 };
    const zoneCondition = this.structuralCondition.get(sensor.zoneId) || 1.0;
    const failure = this.sensorFailureStates.get(sensor.sensorId);
    const anomaly = this.anomalyStates.get(sensor.sensorId);

    let vibration: VibrationTelemetry | undefined;
    let strain: StrainTelemetry | undefined;
    let load: LoadTelemetry | undefined;
    let temperature: number | undefined;
    let humidity: number | undefined;
    let rainfall: number | undefined;
    let displacement: number | undefined;
    let distance: number | undefined;

    const trafficInfluence = this.calculateTrafficInfluence(sensor, simulationTime);
    const weatherInfluence = this.calculateWeatherInfluence(sensor);
    const anomalyInfluence = anomaly ? this.calculateAnomalyInfluence(anomaly, simulationTime) : 0;
    const structuralInfluence = (zoneCondition - 1) * 0.5;

    const noise = this.getNoiseLevel();

    // Route through CalibrationEngine for pipeline parity
    const rawSensorData = {
      sensorId: sensor.sensorId,
      timestamp: Date.now(),
      rawValue: this.getRawValue(sensor, trafficInfluence, weatherInfluence, anomalyInfluence, structuralInfluence, noise),
      sensorType: sensor.sensorType,
    };
    calibrationEngine.calibrate(rawSensorData, sensor.calibrationProfileId, this.weatherState.temperature);

    switch (sensor.sensorType) {
      case 'MPU6050': {
        const baseVibration = baseline.vibration + trafficInfluence * 0.05 + weatherInfluence * 0.01 + anomalyInfluence + structuralInfluence;
        const mag = Math.max(0, baseVibration + this.random.nextGaussian(0, noise * 0.01));
        vibration = {
          accelerationX: this.random.nextGaussian(0, mag * 0.6),
          accelerationY: this.random.nextGaussian(0, mag * 0.6),
          accelerationZ: this.random.nextGaussian(9.81, mag * 0.3),
          angularVelocityX: this.random.nextGaussian(0, mag * 0.1),
          angularVelocityY: this.random.nextGaussian(0, mag * 0.1),
          angularVelocityZ: this.random.nextGaussian(0, mag * 0.1),
          magnitude: mag,
          dominantFrequency: 10 + this.random.nextFloat() * 40,
        };
        break;
      }
      case 'STRAIN':
      case 'HX711': {
        const baseStrain = baseline.strain + trafficInfluence * 20 + weatherInfluence * 2 + anomalyInfluence * 50 + structuralInfluence * 30;
        const strainValue = Math.max(0, baseStrain + this.random.nextGaussian(0, noise * 5));
        strain = {
          strain: strainValue,
          unit: 'microstrain',
          baselineStrain: baseline.strain,
          temperatureCompensation: this.weatherState.temperature * 0.1,
        };
        break;
      }
      case 'LOAD_CELL': {
        const baseLoad = baseline.displacement * 100 + trafficInfluence * 50 + weatherInfluence * 5 + structuralInfluence * 100;
        const loadValue = Math.max(0, baseLoad + this.random.nextGaussian(0, noise * 10));
        load = {
          load: loadValue,
          unit: 'kN',
          baselineLoad: baseline.displacement * 100,
          trafficContribution: trafficInfluence * 50,
          vehicleContribution: this.calculateVehicleContribution(sensor),
        };
        break;
      }
      case 'DHT22': {
        temperature = this.weatherState.temperature + this.random.nextGaussian(0, noise * 0.5);
        humidity = Math.max(0, Math.min(100, this.weatherState.humidity + this.random.nextGaussian(0, noise * 2)));
        break;
      }
      case 'RAIN': {
        rainfall = this.weatherState.rainfall + this.random.nextGaussian(0, noise * 0.5);
        break;
      }
      case 'HC_SR04': {
        displacement = baseline.displacement + trafficInfluence * 0.5 + anomalyInfluence * 2 + structuralInfluence * 1;
        displacement = Math.max(0, displacement + this.random.nextGaussian(0, noise * 0.1));
        distance = 1000 - displacement;
        break;
      }
    }

    if (failure) {
      return this.applyFailure(packet, sensor, failure, simulationTime);
    }

    const anomalyScore = this.calculateAnomalyScore(sensor, vibration, strain, displacement);
    const healthScore = this.calculateHealthScore(sensor, anomalyScore);
    const status = this.determineStatus(healthScore, anomalyScore);

    const packet: TelemetryPacket = {
      timestamp: new Date().toISOString(),
      simulationTime,
      bridgeId: this.config.bridgeId,
      zoneId: sensor.zoneId,
      sensorId: sensor.sensorId,
      sensorType: sensor.sensorType,
      vibration,
      strain,
      load,
      temperature,
      humidity,
      rainfall,
      displacement,
      distance,
      trafficDensity: this.calculateTrafficDensity(),
      vehicleLoad: this.calculateVehicleLoad(),
      weatherCondition: this.weatherState.mode as WeatherCondition,
      signalStrength: failure ? Math.max(0, 100 - failure.severity * 100) : 95 + this.random.nextFloat() * 5,
      batteryLevel: this.getStableBattery(sensor.sensorId, simulationTime),
      anomalyScore,
      healthScore,
      status,
      dataSource: 'SIMULATION' as DataSource,
      quality: this.generateQuality(noise),
    };

    return packet;
  }

  private applyFailure(
    packet: TelemetryPacket,
    sensor: SensorConfiguration,
    failure: { type: string; severity: number; startTime: number },
    simulationTime: number
  ): TelemetryPacket {
    const elapsed = simulationTime - failure.startTime;
    const packetLoss = failure.type === 'PACKET_LOSS' ? failure.severity : 0;
    const signalDegradation = failure.type === 'SIGNAL_DEGRADATION' ? failure.severity : 0;
    const stale = failure.type === 'STALE' || elapsed > 10;

    if (failure.type === 'OFFLINE' || failure.type === 'PACKET_LOSS' && this.random.nextFloat() < packetLoss) {
      return {
        ...packet,
        status: 'OFFLINE',
        signalStrength: 0,
        dataSource: 'SIMULATION',
        quality: { ...packet.quality, packetLoss: failure.severity, stale: true },
      };
    }

    return {
      ...packet,
      status: stale ? 'STALE' : 'DEGRADED',
      signalStrength: Math.max(0, 100 - signalDegradation * 100),
      quality: {
        ...packet.quality,
        packetLoss,
        communicationDelay: signalDegradation * 1000,
        stale,
      },
    };
  }

  private getRawValue(sensor: SensorConfiguration, trafficInfluence: number, weatherInfluence: number, anomalyInfluence: number, structuralInfluence: number, noise: number): number {
    const baseline = this.sensorBaselines.get(sensor.sensorId) || { vibration: 0, strain: 0, displacement: 0 };
    switch (sensor.sensorType) {
      case 'MPU6050':
        return (baseline.vibration + trafficInfluence * 0.05 + weatherInfluence * 0.01 + anomalyInfluence + structuralInfluence + this.random.nextGaussian(0, noise * 0.01)) * 16384;
      case 'STRAIN':
      case 'HX711':
        return baseline.strain + trafficInfluence * 20 + weatherInfluence * 2 + anomalyInfluence * 50 + structuralInfluence * 30 + this.random.nextGaussian(0, noise * 5);
      case 'LOAD_CELL':
        return baseline.displacement * 100 + trafficInfluence * 50 + weatherInfluence * 5 + structuralInfluence * 100 + this.random.nextGaussian(0, noise * 10);
      case 'DHT22':
        return this.weatherState.temperature + this.random.nextGaussian(0, noise * 0.5);
      case 'RAIN':
        return this.weatherState.rainfall + this.random.nextGaussian(0, noise * 0.5);
      case 'HC_SR04':
        return baseline.displacement + trafficInfluence * 0.5 + anomalyInfluence * 2 + structuralInfluence * 1 + this.random.nextGaussian(0, noise * 0.1);
      default:
        return 0;
    }
  }

  private calculateTrafficInfluence(sensor: SensorConfiguration, simulationTime: number): number {
    let totalInfluence = 0;
    this.vehicleStates.forEach((vehicle) => {
      const sensorPos = this.getSensorWorldPosition(sensor);
      const vehiclePos = this.getVehicleWorldPosition(vehicle, simulationTime);
      const distance = this.calculateDistance(sensorPos, vehiclePos);
      const proximityFactor = Math.max(0, 1 - distance / 50);
      const weightFactor = this.config.vehicleWeights[vehicle.vehicleType] || 1500;
      const speedFactor = Math.min(1, vehicle.speed / 50);
      totalInfluence += (weightFactor / 10000) * proximityFactor * speedFactor * this.config.trafficInfluenceFactor;
    });
    return totalInfluence;
  }

  private calculateVehicleContribution(sensor: SensorConfiguration): number {
    let contribution = 0;
    this.vehicleStates.forEach((vehicle) => {
      const sensorPos = this.getSensorWorldPosition(sensor);
      const vehiclePos = this.getVehicleWorldPosition(vehicle, this.lastTelemetryTime);
      const distance = this.calculateDistance(sensorPos, vehiclePos);
      const proximityFactor = Math.max(0, 1 - distance / 30);
      const weightFactor = this.config.vehicleWeights[vehicle.vehicleType] || 1500;
      contribution += (weightFactor / 1000) * proximityFactor;
    });
    return contribution;
  }

  private calculateWeatherInfluence(sensor: SensorConfiguration): number {
    let influence = 0;
    influence += this.weatherState.rainfall * 0.1;
    influence += (this.weatherState.humidity - 50) * 0.01;
    influence += Math.abs(this.weatherState.temperature - 20) * 0.02;
    return influence * this.config.weatherInfluenceFactor;
  }

  private calculateAnomalyInfluence(anomaly: { type: string; intensity: number; startTime: number; duration: number }, simulationTime: number): number {
    const elapsed = simulationTime - anomaly.startTime;
    if (elapsed > anomaly.duration) return 0;
    const progress = elapsed / anomaly.duration;
    const envelope = Math.sin(progress * Math.PI);
    return anomaly.intensity * envelope;
  }

  private calculateAnomalyScore(sensor: SensorConfiguration, vibration?: VibrationTelemetry, strain?: StrainTelemetry, displacement?: number): number {
    let score = 0;
    if (vibration) score += Math.min(1, vibration.magnitude / 0.5);
    if (strain) score += Math.min(1, strain.strain / 200);
    if (displacement !== undefined) score += Math.min(1, displacement / 15);
    return Math.min(1, score / 3);
  }

  private calculateHealthScore(sensor: SensorConfiguration, anomalyScore: number): number {
    const baseHealth = 100;
    const anomalyPenalty = anomalyScore * 40;
    const qualityPenalty = (1 - (sensor.signalStrength / 100)) * 10;
    return Math.max(0, baseHealth - anomalyPenalty - qualityPenalty);
  }

  private determineStatus(healthScore: number, anomalyScore: number): TelemetryStatus {
    if (anomalyScore > 0.7 || healthScore < 60) return 'CRITICAL';
    if (anomalyScore > 0.3 || healthScore < 90) return 'WARNING';
    return 'NORMAL';
  }

  private getStableBattery(sensorId: string, simTime: number): number {
    const base = this.sensorBatteryLevels.get(sensorId) || 95;
    // Slow battery drain: drops ~1% every 3600 sim seconds
    const current = base - (simTime / 3600);
    return Math.max(0, current);
  }

  private generateQuality(noise: number): TelemetryQuality {
    return {
      noise,
      drift: noise * 0.1,
      packetLoss: 0,
      timestampJitter: noise * 10,
      stale: false,
      communicationDelay: 10 + noise * 50,
    };
  }

  private getNoiseLevel(): number {
    switch (this.config.noiseMode) {
      case 'OFF':
        return 0;
      case 'LOW':
        return 0.05;
      case 'MEDIUM':
        return 0.15;
      case 'HIGH':
        return 0.3;
      default:
        return 0.05;
    }
  }

  private calculateTrafficDensity(): number {
    return Math.min(100, this.vehicleStates.size * 10);
  }

  private calculateVehicleLoad(): number {
    let total = 0;
    this.vehicleStates.forEach((v) => {
      total += this.config.vehicleWeights[v.vehicleType] || 1500;
    });
    return total;
  }

  private getSensorWorldPosition(sensor: SensorConfiguration): Vector3 {
    return {
      x: sensor.position.x * 100,
      y: sensor.position.y * 100,
      z: sensor.position.z * 100,
    };
  }

  private getVehicleWorldPosition(vehicle: Vehicle, simulationTime: number): Vector3 {
    return {
      x: vehicle.position.x * 100,
      y: (vehicle.lane - 1) * 3.5,
      z: vehicle.position.z * 100,
    };
  }

  private calculateDistance(a: Vector3, b: Vector3): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
  }
}