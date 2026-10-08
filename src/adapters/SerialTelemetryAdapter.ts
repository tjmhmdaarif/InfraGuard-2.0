import { TelemetryAdapter, TelemetryData, AdapterStatus, AdapterConfig } from './TelemetryAdapter';
import type { TelemetryPacket } from '../types/telemetry';

export class SerialTelemetryAdapter implements TelemetryAdapter {
  readonly name = 'Serial Telemetry';
  readonly type = 'SERIAL';
  private config: AdapterConfig;
  private status: AdapterStatus = 'DISCONNECTED';
  private subscribers: Set<(data: TelemetryData) => void> = new Set();

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.status = 'CONNECTING';
    try {
      await new Promise((r) => setTimeout(r, 200));
      this.status = 'CONNECTED';
    } catch {
      this.status = 'ERROR';
      throw new Error('Serial port open failed');
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  subscribe(callback: (data: TelemetryData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  async sendCommand(command: string, payload?: any): Promise<void> {
    console.log(`Serial TX: ${command}`, payload);
  }

  getConfigSummary(): Record<string, unknown> {
    return {
      port: this.config.serial?.port,
      baudRate: this.config.serial?.baudRate,
    };
  }

  simulateIngest(packets: TelemetryPacket[]): void {
    this.subscribers.forEach((cb) =>
      cb({
        bridgeId: 'BRIDGE-001',
        timestamp: Date.now(),
        packets,
      })
    );
  }
}