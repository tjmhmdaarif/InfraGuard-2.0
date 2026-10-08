import { SeededRandom } from './SeededRandom';
import type { WeatherState, WeatherMode, WeatherConfiguration, WeatherInfluence, EnvironmentVisualization } from '../types/weather';
import { WEATHER_CONFIGS } from '../types/weather';
import type { SensorConfiguration } from '../types/sensor';

export interface WeatherEngineConfig {
  seed: string;
  initialMode?: WeatherMode;
}

export class WeatherEngine {
  private config: WeatherEngineConfig;
  private random: SeededRandom;
  private state: WeatherState;
  private transitionStartTime: number;
  private transitionDuration: number;

  constructor(config: WeatherEngineConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
    this.transitionStartTime = 0;
    this.transitionDuration = 0;

    const initialMode = config.initialMode || 'CLEAR';
    const config_ = WEATHER_CONFIGS[initialMode];
    this.state = {
      mode: initialMode,
      intensity: config_.intensity,
      temperature: this.random.nextFloat() * (config_.temperatureRange[1] - config_.temperatureRange[0]) + config_.temperatureRange[0],
      humidity: this.random.nextFloat() * (config_.humidityRange[1] - config_.humidityRange[0]) + config_.humidityRange[0],
      rainfall: 0,
      windSpeed: this.random.nextFloat() * (config_.windSpeedRange[1] - config_.windSpeedRange[0]) + config_.windSpeedRange[0],
      windDirection: this.random.nextFloat() * 360,
      visibility: initialMode === 'FOG' ? 100 : 10000,
      atmosphericPressure: 1013 + this.random.nextGaussian(0, 10),
      transitionProgress: 0,
    };
  }

  setMode(mode: WeatherMode, transitionDuration = 30): void {
    if (this.state.mode === mode && !this.state.targetMode) return;

    this.state.targetMode = mode;
    this.transitionStartTime = this.getSimulationTime();
    this.transitionDuration = transitionDuration;
    this.state.transitionProgress = 0;
  }

  private getSimulationTime(): number {
    return Date.now() / 1000;
  }

  update(deltaTime: number, simulationTime: number): WeatherState {
    if (this.state.targetMode && this.state.targetMode !== this.state.mode) {
      const elapsed = simulationTime - this.transitionStartTime;
      this.state.transitionProgress = Math.min(1, elapsed / this.transitionDuration);

      if (this.state.transitionProgress >= 1) {
        this.completeTransition();
      } else {
        this.interpolateWeather();
      }
    } else {
      this.addVariation(deltaTime);
    }

    this.updateDerivedValues();
    return this.getState();
  }

  private completeTransition(): void {
    const targetConfig = WEATHER_CONFIGS[this.state.targetMode!];
    this.state.mode = this.state.targetMode!;
    this.state.intensity = targetConfig.intensity;
    this.state.targetMode = undefined;
    this.state.transitionProgress = 0;
  }

  private interpolateWeather(): void {
    const currentConfig = WEATHER_CONFIGS[this.state.mode];
    const targetConfig = WEATHER_CONFIGS[this.state.targetMode!];
    const t = this.state.transitionProgress;

    this.state.intensity = this.lerp(currentConfig.intensity, targetConfig.intensity, t);
    this.state.temperature = this.lerp(
      this.state.temperature,
      this.random.nextFloat() * (targetConfig.temperatureRange[1] - targetConfig.temperatureRange[0]) + targetConfig.temperatureRange[0],
      t
    );
    this.state.humidity = this.lerp(this.state.humidity, targetConfig.humidityRange[0] + (targetConfig.humidityRange[1] - targetConfig.humidityRange[0]) * 0.5, t);
    this.state.rainfall = this.lerp(this.state.rainfall, targetConfig.rainfallRange[0] + (targetConfig.rainfallRange[1] - targetConfig.rainfallRange[0]) * 0.5, t);
    this.state.windSpeed = this.lerp(this.state.windSpeed, targetConfig.windSpeedRange[0] + (targetConfig.windSpeedRange[1] - targetConfig.windSpeedRange[0]) * 0.5, t);
  }

  private addVariation(deltaTime: number): void {
    const config = WEATHER_CONFIGS[this.state.mode];
    const variationScale = deltaTime * 0.01;

    this.state.temperature += this.random.nextGaussian(0, 0.1) * variationScale;
    this.state.temperature = Math.max(config.temperatureRange[0], Math.min(config.temperatureRange[1], this.state.temperature));

    this.state.humidity += this.random.nextGaussian(0, 0.5) * variationScale;
    this.state.humidity = Math.max(config.humidityRange[0], Math.min(config.humidityRange[1], this.state.humidity));

    if (this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN') {
      this.state.rainfall += this.random.nextGaussian(0, 0.2) * variationScale;
      this.state.rainfall = Math.max(config.rainfallRange[0], Math.min(config.rainfallRange[1], this.state.rainfall));
    }

    this.state.windSpeed += this.random.nextGaussian(0, 0.2) * variationScale;
    this.state.windSpeed = Math.max(config.windSpeedRange[0], Math.min(config.windSpeedRange[1], this.state.windSpeed));
    this.state.windDirection += this.random.nextGaussian(0, 5) * variationScale;
    this.state.windDirection = (this.state.windDirection + 360) % 360;

    this.state.atmosphericPressure += this.random.nextGaussian(0, 0.1) * variationScale;
  }

  private updateDerivedValues(): void {
    if (this.state.mode === 'FOG') {
      this.state.visibility = Math.max(10, 200 * (1 - this.state.intensity) + this.random.nextFloat() * 50);
    } else if (this.state.mode === 'HEAVY_RAIN') {
      this.state.visibility = Math.max(100, 2000 * (1 - this.state.intensity * 0.5));
    } else if (this.state.mode === 'RAIN') {
      this.state.visibility = Math.max(500, 5000 * (1 - this.state.intensity * 0.3));
    } else {
      this.state.visibility = 10000;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  getState(): WeatherState {
    return { ...this.state };
  }

  getMode(): WeatherMode {
    return this.state.mode;
  }

  getIntensity(): number {
    return this.state.intensity;
  }

  calculateInfluence(sensor: SensorConfiguration): WeatherInfluence {
    const tempInfluence = Math.abs(this.state.temperature - 20) * 0.02;
    const humidityInfluence = Math.max(0, (this.state.humidity - 60) / 40);
    const rainfallInfluence = this.state.rainfall * 0.05;
    const wetnessFactor = this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN' ? this.state.intensity : 0;
    const visibilityFactor = this.state.mode === 'FOG' ? 1 - this.state.visibility / 10000 : 0;

    return {
      sensorId: sensor.sensorId,
      temperatureInfluence: tempInfluence,
      humidityInfluence,
      rainfallInfluence,
      wetnessFactor,
      visibilityFactor,
    };
  }

  getVisualization(): EnvironmentVisualization {
    return {
      rainParticles: this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN',
      wetMaterials: this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN',
      waterReflections: this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN',
      riverTurbulence: this.state.mode === 'HEAVY_RAIN' ? 0.8 : this.state.mode === 'RAIN' ? 0.4 : 0.1,
      fogDensity: this.state.mode === 'FOG' ? this.state.intensity : 0,
      volumetricLighting: this.state.mode === 'FOG' || this.state.mode === 'GOLDEN_HOUR',
      wetRocks: this.state.mode === 'RAIN' || this.state.mode === 'HEAVY_RAIN',
    };
  }

  reset(): void {
    const config = WEATHER_CONFIGS.CLEAR;
    this.state = {
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
    this.state.targetMode = undefined;
  }
}