export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'BUS' | 'LIGHT_TRUCK' | 'HEAVY_TRUCK';

export interface Vehicle {
  vehicleId: string;
  vehicleType: VehicleType;
  weight: number;
  speed: number;
  lane: number;
  position: VehiclePosition;
  length: number;
  width: number;
  spawnTime: number;
  exitTime?: number;
}

export interface VehiclePosition {
  x: number;
  y: number;
  z: number;
  progress: number;
}

export interface VehicleSpecs {
  type: VehicleType;
  weightRange: [number, number];
  speedRange: [number, number];
  length: number;
  width: number;
  loadFactor: number;
}

export const VEHICLE_SPECS: Record<VehicleType, VehicleSpecs> = {
  MOTORCYCLE: { type: 'MOTORCYCLE', weightRange: [150, 300], speedRange: [40, 100], length: 2.2, width: 0.8, loadFactor: 0.1 },
  CAR: { type: 'CAR', weightRange: [1200, 2000], speedRange: [40, 100], length: 4.5, width: 1.8, loadFactor: 0.5 },
  BUS: { type: 'BUS', weightRange: [12000, 18000], speedRange: [30, 70], length: 12, width: 2.5, loadFactor: 3.0 },
  LIGHT_TRUCK: { type: 'LIGHT_TRUCK', weightRange: [3500, 7500], speedRange: [40, 80], length: 6, width: 2.2, loadFactor: 1.5 },
  HEAVY_TRUCK: { type: 'HEAVY_TRUCK', weightRange: [20000, 40000], speedRange: [30, 60], length: 16, width: 2.5, loadFactor: 5.0 },
};

export type TrafficDensity = 0 | 25 | 50 | 75 | 100;
export type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface TrafficConfiguration {
  density: TrafficDensity;
  level: TrafficLevel;
  vehicleDistribution: VehicleDistribution;
  spawnRate: number;
  maxVehicles: number;
}

export interface VehicleDistribution {
  motorcycle: number;
  car: number;
  bus: number;
  lightTruck: number;
  heavyTruck: number;
}

export const DEFAULT_DISTRIBUTIONS: Record<TrafficLevel, VehicleDistribution> = {
  LOW: { motorcycle: 0.15, car: 0.60, bus: 0.05, lightTruck: 0.15, heavyTruck: 0.05 },
  MEDIUM: { motorcycle: 0.10, car: 0.50, bus: 0.10, lightTruck: 0.20, heavyTruck: 0.10 },
  HIGH: { motorcycle: 0.05, car: 0.40, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.15 },
  EXTREME: { motorcycle: 0.05, car: 0.30, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.25 },
};

export interface TrafficState {
  vehicles: Vehicle[];
  density: TrafficDensity;
  level: TrafficLevel;
  totalVehicleCount: number;
  vehiclesOnBridge: number;
  spawnTimer: number;
}

export interface LoadInfluence {
  sensorId: string;
  influence: number;
  distance: number;
  zoneId: string;
}