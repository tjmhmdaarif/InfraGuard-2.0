export interface Scenario {
  scenarioId: string;
  name: string;
  description: string;
  duration: number;
  traffic: TrafficConfig;
  weather: WeatherConfig;
  anomalies: AnomalyConfig[];
  sensorFailures: SensorFailureConfig[];
  expectedEvents: ExpectedEvent[];
  metadata?: Record<string, unknown>;
}

export interface TrafficConfig {
  density: number;
  level: string;
  vehicleDistribution: Record<string, number>;
  spawnRate: number;
  specialVehicles?: SpecialVehicle[];
}

export interface SpecialVehicle {
  vehicleId: string;
  vehicleType: string;
  weight: number;
  speed: number;
  lane: number;
  spawnTime: number;
  path?: 'DEFAULT' | 'CENTER' | 'LEFT' | 'RIGHT';
}

export interface WeatherConfig {
  initialMode: string;
  transitions: WeatherTransition[];
}

export interface WeatherTransition {
  time: number;
  targetMode: string;
  duration: number;
}

export interface AnomalyConfig {
  type: string;
  time: number;
  duration: number;
  intensity: number;
  affectedSensors: string[];
  affectedZones: string[];
}

export interface SensorFailureConfig {
  sensorId: string;
  time: number;
  type: 'OFFLINE' | 'STALE' | 'PACKET_LOSS' | 'SIGNAL_DEGRADATION' | 'DRIFT' | 'NOISE';
  duration?: number;
  severity?: number;
}

export interface ExpectedEvent {
  time: number;
  type: string;
  description: string;
  affectedSensors?: string[];
  expectedHealthChange?: number;
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

export const BUILT_IN_SCENARIOS: Scenario[] = [
  {
    scenarioId: 'normal-operation',
    name: 'Normal Operation',
    description: 'Baseline operation with light traffic and clear weather',
    duration: 300,
    traffic: { density: 25, level: 'LOW', vehicleDistribution: { motorcycle: 0.15, car: 0.6, bus: 0.05, lightTruck: 0.15, heavyTruck: 0.05 }, spawnRate: 2 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [],
  },
  {
    scenarioId: 'medium-traffic',
    name: 'Medium Traffic',
    description: 'Increased traffic density with normal vehicle distribution',
    duration: 300,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [{ time: 30, type: 'TRAFFIC_INCREASE', description: 'Traffic density increases to medium level' }],
  },
  {
    scenarioId: 'heavy-traffic',
    name: 'Heavy Traffic',
    description: 'High traffic density with more heavy vehicles',
    duration: 300,
    traffic: { density: 75, level: 'HIGH', vehicleDistribution: { motorcycle: 0.05, car: 0.4, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.15 }, spawnRate: 8 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [{ time: 30, type: 'TRAFFIC_INCREASE', description: 'Heavy traffic conditions begin' }],
  },
  {
    scenarioId: 'extreme-heavy-vehicle',
    name: 'Extreme Heavy Vehicle',
    description: 'Single very heavy truck crossing center span',
    duration: 180,
    traffic: { density: 25, level: 'LOW', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 2, specialVehicles: [{ vehicleId: 'HV-001', vehicleType: 'HEAVY_TRUCK', weight: 45000, speed: 30, lane: 1, spawnTime: 30, path: 'CENTER' }] },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [
      { time: 30, type: 'HEAVY_VEHICLE_ENTER', description: 'Heavy truck enters bridge' },
      { time: 45, type: 'HEAVY_VEHICLE_CENTER', description: 'Heavy truck at center span' },
      { time: 60, type: 'HEAVY_VEHICLE_EXIT', description: 'Heavy truck exits bridge' },
    ],
  },
  {
    scenarioId: 'heavy-rain',
    name: 'Heavy Rain',
    description: 'Heavy rainfall affecting environmental sensors and structural response',
    duration: 300,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [{ time: 60, targetMode: 'HEAVY_RAIN', duration: 30 }] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [
      { time: 60, type: 'RAIN_START', description: 'Heavy rain begins' },
      { time: 90, type: 'RAIN_FULL', description: 'Rain at full intensity' },
      { time: 240, type: 'RAIN_END', description: 'Rain stops' },
    ],
  },
  {
    scenarioId: 'sudden-vibration',
    name: 'Sudden Vibration Anomaly',
    description: 'Simulated structural vibration anomaly',
    duration: 240,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [{ type: 'HIGH_VIBRATION', time: 60, duration: 60, intensity: 3.0, affectedSensors: ['VIB-01', 'VIB-02', 'VIB-03'], affectedZones: ['CENTER-SPAN'] }],
    sensorFailures: [],
    expectedEvents: [
      { time: 60, type: 'VIBRATION_ANOMALY', description: 'Sudden vibration increase detected', affectedSensors: ['VIB-01', 'VIB-02', 'VIB-03'] },
      { time: 120, type: 'VIBRATION_END', description: 'Vibration returns to normal' },
    ],
  },
  {
    scenarioId: 'localized-strain',
    name: 'Localized Strain Increase',
    description: 'Simulated strain anomaly in center span',
    duration: 240,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [{ type: 'HIGH_STRAIN', time: 60, duration: 90, intensity: 200, affectedSensors: ['STR-02'], affectedZones: ['CENTER-SPAN'] }],
    sensorFailures: [],
    expectedEvents: [
      { time: 60, type: 'STRAIN_ANOMALY', description: 'Localized strain increase at center span', affectedSensors: ['STR-02'] },
      { time: 150, type: 'STRAIN_END', description: 'Strain returns to normal' },
    ],
  },
  {
    scenarioId: 'excessive-displacement',
    name: 'Excessive Displacement',
    description: 'Simulated structural displacement anomaly',
    duration: 300,
    traffic: { density: 75, level: 'HIGH', vehicleDistribution: { motorcycle: 0.05, car: 0.4, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.15 }, spawnRate: 8 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [{ type: 'EXCESSIVE_DISPLACEMENT', time: 90, duration: 120, intensity: 15, affectedSensors: ['DIST-01'], affectedZones: ['CENTER-SPAN', 'LEFT-SPAN'] }],
    sensorFailures: [],
    expectedEvents: [
      { time: 90, type: 'DISPLACEMENT_ANOMALY', description: 'Excessive displacement detected', affectedSensors: ['DIST-01'] },
      { time: 210, type: 'DISPLACEMENT_END', description: 'Displacement stabilizes' },
    ],
  },
  {
    scenarioId: 'sensor-failure',
    name: 'Sensor Failure',
    description: 'Simulated sensor communication failure',
    duration: 240,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [{ sensorId: 'VIB-02', time: 60, type: 'OFFLINE', duration: 120 }],
    expectedEvents: [
      { time: 60, type: 'SENSOR_OFFLINE', description: 'VIB-02 goes offline', affectedSensors: ['VIB-02'] },
      { time: 180, type: 'SENSOR_RECOVER', description: 'VIB-02 recovers', affectedSensors: ['VIB-02'] },
    ],
  },
  {
    scenarioId: 'communication-failure',
    name: 'Communication Failure',
    description: 'Simulated LoRa/MQTT communication degradation',
    duration: 300,
    traffic: { density: 50, level: 'MEDIUM', vehicleDistribution: { motorcycle: 0.1, car: 0.5, bus: 0.1, lightTruck: 0.2, heavyTruck: 0.1 }, spawnRate: 5 },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [],
    sensorFailures: [
      { sensorId: 'VIB-01', time: 60, type: 'PACKET_LOSS', severity: 0.5 },
      { sensorId: 'STR-01', time: 90, type: 'SIGNAL_DEGRADATION', severity: 0.7 },
      { sensorId: 'VIB-03', time: 120, type: 'PACKET_LOSS', severity: 0.3 },
    ],
    expectedEvents: [
      { time: 60, type: 'COMM_DEGRADED', description: 'Communication quality degrades' },
      { time: 180, type: 'COMM_RECOVER', description: 'Communication restored' },
    ],
  },
  {
    scenarioId: 'traffic-rain-combined',
    name: 'Combined Traffic + Rain',
    description: 'Heavy traffic during heavy rainfall',
    duration: 360,
    traffic: { density: 75, level: 'HIGH', vehicleDistribution: { motorcycle: 0.05, car: 0.4, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.15 }, spawnRate: 8 },
    weather: { initialMode: 'CLEAR', transitions: [{ time: 60, targetMode: 'RAIN', duration: 20 }, { time: 180, targetMode: 'HEAVY_RAIN', duration: 30 }] },
    anomalies: [],
    sensorFailures: [],
    expectedEvents: [
      { time: 60, type: 'RAIN_START', description: 'Rain begins' },
      { time: 180, type: 'HEAVY_RAIN', description: 'Heavy rain intensifies' },
      { time: 300, type: 'WEATHER_CLEAR', description: 'Weather clears' },
    ],
  },
  {
    scenarioId: 'traffic-structural-combined',
    name: 'Combined Traffic + Structural Anomaly',
    description: 'Heavy traffic with induced structural anomaly',
    duration: 360,
    traffic: { density: 75, level: 'HIGH', vehicleDistribution: { motorcycle: 0.05, car: 0.4, bus: 0.15, lightTruck: 0.25, heavyTruck: 0.15 }, spawnRate: 8, specialVehicles: [{ vehicleId: 'HV-002', vehicleType: 'HEAVY_TRUCK', weight: 40000, speed: 25, lane: 1, spawnTime: 90, path: 'CENTER' }] },
    weather: { initialMode: 'CLEAR', transitions: [] },
    anomalies: [{ type: 'COMBINED_ANOMALY', time: 120, duration: 120, intensity: 1.5, affectedSensors: ['STR-02', 'VIB-02', 'DIST-01'], affectedZones: ['CENTER-SPAN'] }],
    sensorFailures: [],
    expectedEvents: [
      { time: 90, type: 'HEAVY_VEHICLE', description: 'Heavy truck enters' },
      { time: 120, type: 'STRUCTURAL_ANOMALY', description: 'Combined structural anomaly triggered', affectedSensors: ['STR-02', 'VIB-02', 'DIST-01'] },
      { time: 240, type: 'ANOMALY_END', description: 'Anomaly subsides' },
    ],
  },
];