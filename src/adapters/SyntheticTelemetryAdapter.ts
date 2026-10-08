import { TelemetryAdapter, TelemetryData, AdapterStatus } from './TelemetryAdapter';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { TelemetryPacket } from '../types/telemetry';

export class SyntheticTelemetryAdapter implements TelemetryAdapter {
  readonly name = 'Synthetic Telemetry';
  readonly type = 'SIMULATION';
  private engine: SimulationEngine;
  private status: AdapterStatus = 'DISCONNECTED';
  private subscribers: Set<(data: TelemetryData) => void> = new Set();
  private interval: number | null = null;

  constructor(engine: SimulationEngine) {
    this.engine = engine;
  }

  async connect(): Promise<void> {
    this.status = 'CONNECTED';
    this.engine.start();
    this.interval = window.setInterval(() => this.emitLatest(), 200) as unknown as number;
  }

  async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    this.engine.pause();
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  subscribe(callback: (data: TelemetryData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  async sendCommand(command: string, payload?: any): Promise<void> {
    switch (command) {
      case 'pause':
        this.engine.pause();
        break;
      case 'play':
        this.engine.start();
        break;
      case 'reset':
        this.engine.reset();
        break;
      case 'setSpeed':
        if (typeof payload === 'number') this.engine.setSpeed(payload as any);
        break;
      default:
        console.warn(`Unknown command: ${command}`);
    }
  }

  getConfigSummary(): Record<string, unknown> {
    return { engine: 'SimulationEngine', speed: this.engine.getClock().speed, running: this.engine.getClock().isRunning };
  }

  private emitLatest(): void {
    const state = this.engine.getState();
    if (!state) return;
    const packets: TelemetryPacket[] = [];
    state.anomalies.forEach((a: any) => packets.push({} as TelemetryPacket));
    const data: TelemetryData = {
      bridgeId: 'BRIDGE-001',
      timestamp: Date.now(),
      packets,
    };
    this.subscribers.forEach((cb) => cb(data));
  }
}