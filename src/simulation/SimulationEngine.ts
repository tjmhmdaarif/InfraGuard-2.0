import { SimulationClockManager, formatSimulationTime, SimulationClock, SimulationSpeed } from './SimulationClock';
import { TelemetryEngine } from './TelemetryEngine';
import { TrafficEngine } from './TrafficEngine';
import { WeatherEngine } from './WeatherEngine';
import { HealthEngine } from './HealthEngine';
import { AnomalyEngine } from './AnomalyEngine';
import { ScenarioEngine } from './ScenarioEngine';
import type { TelemetryBatch, TelemetryPacket } from '../types/telemetry';
import type { SensorConfiguration } from '../types/sensor';
import type { BridgeZone, StructuralComponent, BridgeCoordinateSystem } from '../types/bridge';
import type { Scenario } from '../types/scenario';
import type { TrafficState } from '../types/traffic';
import type { WeatherState } from '../types/weather';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useAlertStore } from '../stores/alertStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useSensorStore } from '../stores/sensorStore';
import { useScenarioStore } from '../stores/scenarioStore';

export interface SimulationEngineConfig {
  seed: string;
  bridgeId: string;
  coordinateSystem: BridgeCoordinateSystem;
  zones: BridgeZone[];
  components: StructuralComponent[];
  sensors: SensorConfiguration[];
  bridgeLength: number;
  bridgeWidth: number;
  lanes: number;
  publishSimulationClock?: boolean;
}

export class SimulationEngine {
  private config: SimulationEngineConfig;
  private clockManager: SimulationClockManager;
  private telemetryEngine: TelemetryEngine;
  private trafficEngine: TrafficEngine;
  private weatherEngine: WeatherEngine;
  private healthEngine: HealthEngine;
  private anomalyEngine: AnomalyEngine;
  private scenarioEngine: ScenarioEngine | null;
  private isInitialized: boolean;
  private lastUpdateTime: number;
  private updateInterval: number | null;
  private subscribers: Set<(state: SimulationState) => void>;
  private alertSeverityBySensor: Map<string, 'WARNING' | 'CRITICAL'>;

  constructor(config: SimulationEngineConfig) {
    this.config = config;
    this.clockManager = new SimulationClockManager(1);
    this.isInitialized = false;
    this.lastUpdateTime = 0;
    this.updateInterval = null;
    this.subscribers = new Set();
    this.alertSeverityBySensor = new Map();

    this.telemetryEngine = new TelemetryEngine({
      seed: config.seed,
      bridgeId: config.bridgeId,
      zones: config.zones,
      components: config.components,
      sensors: config.sensors,
      trafficInfluenceFactor: 1.0,
      weatherInfluenceFactor: 0.5,
      noiseMode: 'LOW',
      baselineVibration: 0.02,
      baselineStrain: 10,
      baselineDisplacement: 0.5,
      vehicleWeights: {
        MOTORCYCLE: 250,
        CAR: 1500,
        BUS: 15000,
        LIGHT_TRUCK: 5000,
        HEAVY_TRUCK: 30000,
      },
    });

    this.trafficEngine = new TrafficEngine({
      seed: config.seed + '-traffic',
      bridgeLength: config.bridgeLength,
      bridgeWidth: config.bridgeWidth,
      lanes: config.lanes,
      zones: config.zones,
    });

    this.weatherEngine = new WeatherEngine({
      seed: config.seed + '-weather',
      initialMode: 'CLEAR',
    });

    this.healthEngine = new HealthEngine();
    this.anomalyEngine = new AnomalyEngine();
    this.scenarioEngine = null;
  }

  setScenario(scenario: Scenario): void {
    if (this.scenarioEngine) {
      this.scenarioEngine.stop();
      this.scenarioEngine.reset();
    }
    this.scenarioEngine = new ScenarioEngine({
      scenario,
      trafficEngine: this.trafficEngine,
      weatherEngine: this.weatherEngine,
      telemetryEngine: this.telemetryEngine,
      sensors: this.config.sensors,
    });
    this.scenarioEngine.start();
    useScenarioStore.getState().startScenario(scenario.scenarioId);
    this.notifySubscribers();
  }

  clearScenario(): void {
    if (this.scenarioEngine) {
      this.scenarioEngine.stop();
      this.scenarioEngine.reset();
      this.scenarioEngine = null;
    }
    useScenarioStore.getState().resetScenario();
    this.notifySubscribers();
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.clockManager.subscribe((clock) => {
      this.notifySubscribers();
    });

    this.isInitialized = true;
  }

  start(): void {
    this.clockManager.play();
    this.startUpdateLoop();
  }

  pause(): void {
    this.clockManager.pause();
    this.stopUpdateLoop();
  }

  reset(): void {
    this.clockManager.reset();
    this.telemetryEngine = new TelemetryEngine({
      seed: this.config.seed,
      bridgeId: this.config.bridgeId,
      zones: this.config.zones,
      components: this.config.components,
      sensors: this.config.sensors,
      trafficInfluenceFactor: 1.0,
      weatherInfluenceFactor: 0.5,
      noiseMode: 'LOW',
      baselineVibration: 0.02,
      baselineStrain: 10,
      baselineDisplacement: 0.5,
      vehicleWeights: {
        MOTORCYCLE: 250,
        CAR: 1500,
        BUS: 15000,
        LIGHT_TRUCK: 5000,
        HEAVY_TRUCK: 30000,
      },
    });
    this.trafficEngine.reset();
    this.weatherEngine.reset();
    this.healthEngine.reset();
    this.anomalyEngine.reset();
    if (this.scenarioEngine) {
      this.scenarioEngine.reset();
    }
    useTelemetryStore.getState().clearHistory();
    this.alertSeverityBySensor.clear();
    useAlertStore.getState().updateSummary();
    this.notifySubscribers();
  }

  restart(): void {
    this.reset();
    this.start();
  }

  setSpeed(speed: SimulationSpeed): void {
    this.clockManager.setSpeed(speed);
    useSimulationStore.getState().setSpeed(speed);
  }

  private startUpdateLoop(): void {
    if (this.updateInterval) return;
    this.lastUpdateTime = performance.now();
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private update(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const clock = this.clockManager.getClock();
    if (!clock.isRunning) return;

    const simulationTime = clock.time;

    const trafficState = this.trafficEngine.update(deltaTime, simulationTime);
    this.telemetryEngine.setVehicles(trafficState.vehicles);

    const weatherState = this.weatherEngine.update(deltaTime, simulationTime);
    this.telemetryEngine.setWeather(weatherState);

    if (this.scenarioEngine) {
      this.scenarioEngine.update(simulationTime);
    }

    const batch = this.telemetryEngine.generateTelemetry(simulationTime);
    this.processBatch(batch);

    if (this.config.publishSimulationClock !== false) {
      useSimulationStore.getState().tick(deltaTime);
    }
    this.notifySubscribers();
  }

  private processBatch(batch: TelemetryBatch): void {
    const { addBatch, addPacket, updateStatistics } = useTelemetryStore.getState();
    const { addAlert } = useAlertStore.getState();
    const { updateHealth, updateStatus, updateSignal, updateBattery } = useSensorStore.getState();

    addBatch(batch);

    const telemetryMap = new Map<string, TelemetryPacket>();
    batch.packets.forEach((packet) => {
      addPacket(packet);
      updateStatistics(packet.sensorId);
      telemetryMap.set(packet.sensorId, packet);

      const sensorConfig = useSensorStore.getState().getConfiguration(packet.sensorId);
      if (sensorConfig) {
        updateHealth(packet.sensorId, packet.healthScore);
        updateStatus(packet.sensorId, packet.status);
        updateSignal(packet.sensorId, packet.signalStrength);
        updateBattery(packet.sensorId, packet.batteryLevel);
      }

      const previousSeverity = this.alertSeverityBySensor.get(packet.sensorId);
      if (packet.status === 'NORMAL') {
        this.alertSeverityBySensor.delete(packet.sensorId);
      } else if (
        (packet.status === 'WARNING' || packet.status === 'CRITICAL') &&
        (previousSeverity === undefined || previousSeverity === 'WARNING' && packet.status === 'CRITICAL')
      ) {
        addAlert({
          alertId: `ALERT-${packet.sensorId}-${Math.floor(packet.simulationTime * 10)}`,
          timestamp: packet.timestamp,
          simulationTime: packet.simulationTime,
          severity: packet.status === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          sensorId: packet.sensorId,
          zoneId: packet.zoneId,
          cause: this.getAlertCause(packet),
          value: this.getAlertValue(packet),
          threshold: this.getAlertThreshold(packet),
          healthScore: packet.healthScore,
          acknowledged: false,
          dismissed: false,
        });
        this.alertSeverityBySensor.set(packet.sensorId, packet.status);
      }
    });

    this.config.sensors.forEach((sensor) => {
      const telemetry = telemetryMap.get(sensor.sensorId);
      if (telemetry) {
        this.healthEngine.calculateSensorHealth(sensor, telemetry);
      }
    });

    this.config.components.forEach((component) => {
      this.healthEngine.calculateComponentHealth(component.componentId, this.config.sensors, telemetryMap);
    });

    this.config.zones.forEach((zone) => {
      this.healthEngine.calculateZoneHealth(zone.zoneId, this.config.sensors, telemetryMap);
    });

    this.anomalyEngine.detect(this.config.sensors, telemetryMap);
  }

  private getAlertCause(packet: TelemetryPacket): string {
    const causes: string[] = [];
    if (packet.vibration && packet.vibration.magnitude > 0.3) causes.push('High vibration');
    if (packet.strain && packet.strain.strain > 100) causes.push('High strain');
    if (packet.displacement !== undefined && packet.displacement > 5) causes.push('Excessive displacement');
    if (packet.weatherCondition !== 'CLEAR') causes.push(`Weather: ${packet.weatherCondition}`);
    return causes.join(' + ') || 'Anomaly detected';
  }

  private getAlertValue(packet: TelemetryPacket): number {
    if (packet.vibration && packet.vibration.magnitude > 0.3) return packet.vibration.magnitude;
    if (packet.strain && packet.strain.strain > 100) return packet.strain.strain;
    if (packet.displacement !== undefined && packet.displacement > 5) return packet.displacement;
    return packet.anomalyScore;
  }

  private getAlertThreshold(packet: TelemetryPacket): number {
    if (packet.vibration && packet.vibration.magnitude > 0.3) return 0.3;
    if (packet.strain && packet.strain.strain > 100) return 100;
    if (packet.displacement !== undefined && packet.displacement > 5) return 5;
    return 0.5;
  }

  getTelemetryEngine(): TelemetryEngine {
    return this.telemetryEngine;
  }

  getTrafficEngine(): TrafficEngine {
    return this.trafficEngine;
  }

  getWeatherEngine(): WeatherEngine {
    return this.weatherEngine;
  }

  getHealthEngine(): HealthEngine {
    return this.healthEngine;
  }

  getAnomalyEngine(): AnomalyEngine {
    return this.anomalyEngine;
  }

  getScenarioEngine(): ScenarioEngine | null {
    return this.scenarioEngine;
  }

  getClock(): SimulationClock {
    return this.clockManager.getClock();
  }

  getFormattedTime(): string {
    return formatSimulationTime(this.clockManager.getTime());
  }

  subscribe(callback: (state: SimulationState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach((cb) => cb(state));
  }

  getState() {
    return {
      clock: this.clockManager.getClock(),
      traffic: this.trafficEngine.getState(),
      weather: this.weatherEngine.getState(),
      scenario: this.scenarioEngine?.getState() || null,
      health: {
        overall: this.healthEngine.calculateOverallHealth(this.healthEngine.getAllZoneHealths()),
        components: this.healthEngine.getAllComponentHealths(),
        zones: this.healthEngine.getAllZoneHealths(),
      },
      anomalies: this.anomalyEngine.getActiveAnomalies(),
    };
  }

  destroy(): void {
    this.stopUpdateLoop();
    this.clockManager.destroy();
    this.subscribers.clear();
  }
}

export interface SimulationState {
  clock: SimulationClock;
  traffic: TrafficState;
  weather: WeatherState;
  scenario: ScenarioState | null;
  health: {
    overall: any;
    components: any[];
    zones: any[];
  };
  anomalies: any[];
}

export interface ScenarioState {
  currentScenario: Scenario | null;
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  progress: number;
  completedEvents: string[];
  activeAnomalies: string[];
  activeSensorFailures: string[];
}