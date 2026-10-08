import type { Scenario, ScenarioState, SpecialVehicle } from '../types/scenario';
import type { TrafficEngine } from './TrafficEngine';
import type { WeatherEngine } from './WeatherEngine';
import type { TelemetryEngine } from './TelemetryEngine';
import type { SensorConfiguration } from '../types/sensor';

export interface ScenarioEngineConfig {
  scenario: Scenario;
  trafficEngine: TrafficEngine;
  weatherEngine: WeatherEngine;
  telemetryEngine: TelemetryEngine;
  sensors: SensorConfiguration[];
}

export class ScenarioEngine {
  private config: ScenarioEngineConfig;
  private state: ScenarioState;
  private startTime: number;
  private eventTimers: Map<string, number>;
  private specialVehiclesSpawned: Set<string>;

  constructor(config: ScenarioEngineConfig) {
    this.config = config;
    this.startTime = 0;
    this.eventTimers = new Map();
    this.specialVehiclesSpawned = new Set();
    this.state = {
      currentScenario: config.scenario,
      isRunning: false,
      isPaused: false,
      elapsedTime: 0,
      progress: 0,
      completedEvents: [],
      activeAnomalies: [],
      activeSensorFailures: [],
    };
  }

  start(): void {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.startTime = this.getSimulationTime();
    this.applyInitialConditions();
  }

  pause(): void {
    this.state.isPaused = true;
    this.state.isRunning = false;
  }

  resume(): void {
    this.state.isPaused = false;
    this.state.isRunning = true;
    this.startTime = this.getSimulationTime() - this.state.elapsedTime;
  }

  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
  }

  reset(): void {
    this.stop();
    this.state.elapsedTime = 0;
    this.state.progress = 0;
    this.state.completedEvents = [];
    this.state.activeAnomalies = [];
    this.state.activeSensorFailures = [];
    this.eventTimers.clear();
    this.specialVehiclesSpawned.clear();
    this.config.trafficEngine.reset();
    this.config.weatherEngine.reset();
    this.config.telemetryEngine.setVehicles([]);
  }

  update(simulationTime: number): ScenarioState {
    if (!this.state.isRunning || this.state.isPaused) return this.getState();

    this.state.elapsedTime = simulationTime - this.startTime;
    this.state.progress = Math.min(1, this.state.elapsedTime / this.config.scenario.duration);

    this.processEvents();
    this.processTraffic();
    this.processWeather();
    this.processAnomalies();
    this.processSensorFailures();

    if (this.state.progress >= 1) {
      this.stop();
    }

    return this.getState();
  }

  private getSimulationTime(): number {
    return Date.now() / 1000;
  }

  private applyInitialConditions(): void {
    const { scenario } = this.config;
    this.config.trafficEngine.setTrafficConfig({
      density: scenario.traffic.density,
      level: scenario.traffic.level as any,
      vehicleDistribution: scenario.traffic.vehicleDistribution,
      spawnRate: scenario.traffic.spawnRate,
    });

    this.config.weatherEngine.setMode(scenario.weather.initialMode, 0);
  }

  private processEvents(): void {
    const { scenario } = this.config;

    scenario.expectedEvents.forEach((event) => {
      if (this.state.elapsedTime >= event.time && !this.state.completedEvents.includes(event.type)) {
        this.state.completedEvents.push(event.type);
        this.triggerEvent(event);
      }
    });
  }

  private triggerEvent(event: { type: string; description: string; affectedSensors?: string[]; expectedHealthChange?: number }): void {
    console.log(`[Scenario Event] ${event.type}: ${event.description}`);
  }

  private processTraffic(): void {
    const { scenario } = this.config;

    scenario.traffic.specialVehicles?.forEach((sv) => {
      if (this.state.elapsedTime >= sv.spawnTime && !this.specialVehiclesSpawned.has(sv.vehicleId)) {
        const vehicle: Omit<SpecialVehicle, 'vehicleId' | 'spawnTime'> & { vehicleId: string; spawnTime: number } = {
          vehicleId: sv.vehicleId,
          vehicleType: sv.vehicleType as any,
          weight: sv.weight,
          speed: sv.speed,
          lane: sv.lane,
          position: { x: -100, y: (sv.lane - 1) * 3.5, z: 0, progress: 0 },
          length: 16,
          width: 2.5,
          spawnTime: this.getSimulationTime(),
        };
        this.config.trafficEngine.spawnSpecialVehicle(vehicle, this.getSimulationTime());
        this.specialVehiclesSpawned.add(sv.vehicleId);
      }
    });
  }

  private processWeather(): void {
    const { scenario } = this.config;

    scenario.weather.transitions.forEach((transition) => {
      if (this.state.elapsedTime >= transition.time) {
        this.config.weatherEngine.setMode(transition.targetMode as any, transition.duration);
      }
    });
  }

  private processAnomalies(): void {
    const { scenario } = this.config;

    scenario.anomalies.forEach((anomaly) => {
      if (this.state.elapsedTime >= anomaly.time && this.state.elapsedTime < anomaly.time + anomaly.duration) {
        if (!this.state.activeAnomalies.includes(anomaly.type)) {
          this.state.activeAnomalies.push(anomaly.type);
          this.config.telemetryEngine.setAnomaly(
            anomaly.type,
            anomaly.type,
            anomaly.intensity,
            anomaly.duration,
            anomaly.affectedSensors
          );
        }
      } else if (this.state.elapsedTime >= anomaly.time + anomaly.duration) {
        const idx = this.state.activeAnomalies.indexOf(anomaly.type);
        if (idx >= 0) {
          this.state.activeAnomalies.splice(idx, 1);
          anomaly.affectedSensors.forEach((sensorId) => {
            this.config.telemetryEngine.clearAnomaly(sensorId);
          });
        }
      }
    });
  }

  private processSensorFailures(): void {
    const { scenario } = this.config;

    scenario.sensorFailures.forEach((failure) => {
      if (this.state.elapsedTime >= failure.time && (!failure.duration || this.state.elapsedTime < failure.time + failure.duration)) {
        if (!this.state.activeSensorFailures.includes(failure.sensorId)) {
          this.state.activeSensorFailures.push(failure.sensorId);
          this.config.telemetryEngine.setSensorFailure(failure.sensorId, failure.type, failure.severity || 1);
        }
      } else if (failure.duration && this.state.elapsedTime >= failure.time + failure.duration) {
        const idx = this.state.activeSensorFailures.indexOf(failure.sensorId);
        if (idx >= 0) {
          this.state.activeSensorFailures.splice(idx, 1);
          this.config.telemetryEngine.clearSensorFailure(failure.sensorId);
        }
      }
    });
  }

  getState(): ScenarioState {
    return { ...this.state };
  }

  getScenario(): Scenario {
    return this.config.scenario;
  }

  skipToTime(time: number): void {
    this.state.elapsedTime = time;
    this.startTime = this.getSimulationTime() - time;
  }
}