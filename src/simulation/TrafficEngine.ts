import { SeededRandom } from './SeededRandom';
import type { Vehicle, VehicleType, TrafficConfiguration, VehicleDistribution, TrafficState, LoadInfluence, TrafficLevel } from '../types/traffic';
import type { BridgeZone } from '../types/bridge';
import { VEHICLE_SPECS, DEFAULT_DISTRIBUTIONS } from '../types/traffic';

const VEHICLE_TYPE_BY_DISTRIBUTION_KEY: Record<keyof VehicleDistribution, VehicleType> = {
  motorcycle: 'MOTORCYCLE',
  car: 'CAR',
  bus: 'BUS',
  lightTruck: 'LIGHT_TRUCK',
  heavyTruck: 'HEAVY_TRUCK',
};

export interface TrafficEngineConfig {
  seed: string;
  bridgeLength: number;
  bridgeWidth: number;
  lanes: number;
  zones: BridgeZone[];
}

export class TrafficEngine {
  private config: TrafficEngineConfig;
  private random: SeededRandom;
  private state: TrafficState;
  private trafficConfig: TrafficConfiguration;
  private vehicleCounter: number;
  private spawnTimer: number;
  private lanePositions: number[];

  constructor(config: TrafficEngineConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
    this.vehicleCounter = 0;
    this.spawnTimer = 0;
    const laneSpacing = Math.min(3.5, config.bridgeWidth / (config.lanes + 2));
    this.lanePositions = Array.from(
      { length: config.lanes },
      (_, index) => (index - (config.lanes - 1) / 2) * laneSpacing,
    );

    this.trafficConfig = {
      density: 50,
      level: 'MEDIUM',
      vehicleDistribution: DEFAULT_DISTRIBUTIONS.MEDIUM,
      spawnRate: 5,
      maxVehicles: 20,
    };

    this.state = {
      vehicles: [],
      density: this.trafficConfig.density,
      level: this.trafficConfig.level,
      totalVehicleCount: 0,
      vehiclesOnBridge: 0,
      spawnTimer: 0,
    };
  }

  setTrafficConfig(config: Partial<TrafficConfiguration>): void {
    this.trafficConfig = { ...this.trafficConfig, ...config };
    if (config.level && DEFAULT_DISTRIBUTIONS[config.level as TrafficLevel]) {
      this.trafficConfig.vehicleDistribution = DEFAULT_DISTRIBUTIONS[config.level as TrafficLevel];
    }
    this.state.density = this.trafficConfig.density;
    this.state.level = this.trafficConfig.level;
  }

  update(deltaTime: number, simulationTime: number): TrafficState {
    this.spawnTimer += deltaTime;
    const spawnInterval = 60 / Math.max(1, this.trafficConfig.spawnRate);

    if (this.spawnTimer >= spawnInterval && this.state.vehicles.length < this.trafficConfig.maxVehicles) {
      this.spawnVehicle(simulationTime);
      this.spawnTimer = 0;
    }

    this.state.vehicles.forEach((vehicle) => {
      const specs = VEHICLE_SPECS[vehicle.vehicleType];
      const speedPerSecond = (specs.speedRange[0] + specs.speedRange[1]) / 2 / 3.6;
      const distance = speedPerSecond * deltaTime;
      vehicle.position.x += distance;
      vehicle.position.progress = Math.min(1, vehicle.position.x / this.config.bridgeLength);
    });

    this.state.vehicles = this.state.vehicles.filter((v) => v.position.x < this.config.bridgeLength + v.length);
    this.state.vehiclesOnBridge = this.state.vehicles.length;

    return this.getState();
  }

  private spawnVehicle(simulationTime: number): void {
    const rand = this.random.nextFloat();
    let cumulative = 0;
    let selectedType: VehicleType = 'CAR';

    for (const [type, distribution] of Object.entries(this.trafficConfig.vehicleDistribution)) {
      cumulative += distribution;
      if (rand <= cumulative) {
        selectedType = VEHICLE_TYPE_BY_DISTRIBUTION_KEY[type as keyof VehicleDistribution];
        break;
      }
    }

    const specs = VEHICLE_SPECS[selectedType];
    const weight = this.random.nextInt(specs.weightRange[0], specs.weightRange[1]);
    const speed = this.random.nextInt(specs.speedRange[0], specs.speedRange[1]);
    const lane = this.random.nextInt(0, this.config.lanes - 1);

    const vehicle: Vehicle = {
      vehicleId: `VEH-${++this.vehicleCounter}`,
      vehicleType: selectedType,
      weight,
      speed,
      lane,
      position: { x: -specs.length, y: this.lanePositions[lane], z: 0, progress: 0 },
      length: specs.length,
      width: specs.width,
      spawnTime: simulationTime,
    };

    this.state.vehicles.push(vehicle);
    this.state.totalVehicleCount++;
  }

  spawnSpecialVehicle(vehicle: Omit<Vehicle, 'vehicleId' | 'spawnTime'>, simulationTime: number): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      vehicleId: `SPC-${++this.vehicleCounter}`,
      spawnTime: simulationTime,
    };
    this.state.vehicles.push(newVehicle);
    this.state.totalVehicleCount++;
    return newVehicle;
  }

  calculateLoadInfluence(sensorPosition: { x: number; y: number; z: number }): LoadInfluence[] {
    const influences: LoadInfluence[] = [];

    this.state.vehicles.forEach((vehicle) => {
      const vehiclePos = { x: vehicle.position.x, y: vehicle.position.y, z: vehicle.position.z };
      const distance = Math.sqrt(
        (sensorPosition.x - vehiclePos.x) ** 2 +
        (sensorPosition.y - vehiclePos.y) ** 2 +
        (sensorPosition.z - vehiclePos.z) ** 2
      );

      const specs = VEHICLE_SPECS[vehicle.vehicleType];
      const weightFactor = specs.loadFactor;
      const proximityFactor = Math.max(0, 1 - distance / 30);
      const speedFactor = Math.min(1, vehicle.speed / 60);
      const influence = weightFactor * proximityFactor * speedFactor;

      const zone = this.config.zones.find((z) =>
        sensorPosition.x >= z.bounds.min.x && sensorPosition.x <= z.bounds.max.x
      );

      influences.push({
        sensorId: '',
        influence,
        distance,
        zoneId: zone?.zoneId || 'UNKNOWN',
      });
    });

    return influences;
  }

  getState(): TrafficState {
    return { ...this.state, vehicles: [...this.state.vehicles] };
  }

  getVehicles(): Vehicle[] {
    return [...this.state.vehicles];
  }

  getVehicleCount(): number {
    return this.state.vehicles.length;
  }

  reset(): void {
    this.state.vehicles = [];
    this.state.totalVehicleCount = 0;
    this.state.vehiclesOnBridge = 0;
    this.spawnTimer = 0;
    this.vehicleCounter = 0;
  }

  setDensity(density: number): void {
    this.trafficConfig.density = Math.max(0, Math.min(100, density));
    this.state.density = this.trafficConfig.density;
  }

  setLevel(level: TrafficLevel): void {
    this.trafficConfig.level = level;
    this.trafficConfig.vehicleDistribution = DEFAULT_DISTRIBUTIONS[level];
    this.state.level = level;
  }
}