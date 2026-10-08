export type FilterType = 'NONE' | 'MOVING_AVERAGE' | 'LOW_PASS' | 'MEDIAN' | 'EMA';

export interface CalibrationProfile {
  profileId: string;
  sensorType: string;
  offset: number;
  scaleFactor: number;
  zeroOffset: number;
  sensitivity: number;
  samplingRate: number;
  filterConfiguration: {
    type: FilterType;
    windowSize?: number;
    alpha?: number;
    cutoffFrequency?: number;
  };
  unit: string;
}

export interface RawSensorData {
  sensorId: string;
  timestamp: number;
  rawValue: number;
  sensorType: string;
}

export interface CalibratedData {
  sensorId: string;
  timestamp: number;
  rawValue: number;
  calibratedValue: number;
  filteredValue: number;
  normalizedValue: number;
  unit: string;
  filterType: FilterType;
}

export interface CalibrationResult {
  raw: number;
  calibrated: number;
  filtered: number;
  normalized: number;
  unit: string;
  profileId: string;
}

export interface CalibrationEngineConfig {
  defaultProfileId: string;
  enableFiltering: boolean;
  enableTemperatureCompensation: boolean;
  referenceTemperature: number;
  temperatureCoefficient: number;
}

export class CalibrationEngine {
  private profiles: Map<string, CalibrationProfile>;
  private config: CalibrationEngineConfig;
  private filterState: Map<string, { buffer: number[]; lastOutput: number; emaValue: number }>;

  constructor(config?: Partial<CalibrationEngineConfig>) {
    this.profiles = new Map();
    this.config = {
      defaultProfileId: 'DEFAULT',
      enableFiltering: true,
      enableTemperatureCompensation: true,
      referenceTemperature: 20,
      temperatureCoefficient: 0.0001,
    };
    this.filterState = new Map();
  }

  registerProfile(profile: CalibrationProfile): void {
    this.profiles.set(profile.profileId, profile);
  }

  setDefaultProfile(profileId: string): void {
    if (this.profiles.has(profileId)) {
      this.config.defaultProfileId = profileId;
    }
  }

  getProfile(profileId: string): CalibrationProfile | undefined {
    return this.profiles.get(profileId) || this.profiles.values().next().value;
  }

  calibrate(rawData: RawSensorData, profileId?: string, temperature?: number): CalibrationResult {
    const profile = this.getProfile(profileId || rawData.sensorType + '-DEFAULT') || this.getProfile(this.config.defaultProfileId);
    if (!profile) {
      throw new Error(`No calibration profile found for ${rawData.sensorId}`);
    }

    let calibrated = (rawData.rawValue - profile.zeroOffset - profile.offset) * profile.scaleFactor * profile.sensitivity;
    if (this.config.enableTemperatureCompensation && temperature !== undefined) {
      const deltaT = temperature - this.config.referenceTemperature;
      calibrated = calibrated * (1 + this.config.temperatureCoefficient * deltaT);
    }

    const filtered = this.applyFilter(rawData.sensorId, calibrated, profile.filterConfiguration);
    const normalized = this.convertUnits(filtered, profile.unit);

    return {
      raw: rawData.rawValue,
      calibrated,
      filtered,
      normalized,
      unit: profile.unit,
      profileId: profile.profileId,
    };
  }

  private applyFilter(sensorId: string, value: number, config: CalibrationProfile['filterConfiguration']): number {
    if (!this.config.enableFiltering || config.type === 'NONE') return value;

    const state = this.filterState.get(sensorId) || { buffer: [], lastOutput: value, emaValue: value };
    let result = value;

    switch (config.type) {
      case 'MOVING_AVERAGE':
        state.buffer.push(value);
        if (state.buffer.length > (config.windowSize || 5)) state.buffer.shift();
        result = state.buffer.reduce((a, b) => a + b, 0) / state.buffer.length;
        break;
      case 'LOW_PASS':
        result = state.emaValue + (value - state.emaValue) * (config.alpha || 0.1);
        state.emaValue = result;
        break;
      case 'MEDIAN':
        state.buffer.push(value);
        if (state.buffer.length > (config.windowSize || 3)) state.buffer.shift();
        const sorted = [...state.buffer].sort((a, b) => a - b);
        result = sorted[Math.floor(sorted.length / 2)];
        break;
      case 'EMA':
        result = state.emaValue * (1 - (config.alpha || 0.1)) + value * (config.alpha || 0.1);
        state.emaValue = result;
        break;
    }

    state.lastOutput = result;
    this.filterState.set(sensorId, state);
    return result;
  }

  private convertUnits(value: number, targetUnit: string): number {
    switch (targetUnit.toLowerCase()) {
      case 'με':
      case 'microstrain':
        return value;
      case 'g':
        return value;
      case 'kn':
        return value;
      case 'kg':
        return value;
      case 'mm':
        return value;
      case '°c':
        return value;
      case '%':
        return value;
      default:
        return value;
    }
  }

  reset(): void {
    this.filterState.clear();
  }

  getAllProfiles(): CalibrationProfile[] {
    return Array.from(this.profiles.values());
  }
}

export const calibrationEngine = new CalibrationEngine();