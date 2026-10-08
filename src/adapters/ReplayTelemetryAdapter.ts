import { TelemetryAdapter, TelemetryData, AdapterStatus, AdapterConfig } from './TelemetryAdapter';
import type { TelemetryPacket } from '../types/telemetry';

export class ReplayTelemetryAdapter implements TelemetryAdapter {
  readonly name = 'Replay Telemetry';
  readonly type = 'REPLAY';
  private config: AdapterConfig;
  private status: AdapterStatus = 'DISCONNECTED';
  private subscribers: Set<(data: TelemetryData) => void> = new Set();
  private packets: TelemetryPacket[] = [];
  private index = 0;
  private timer: number | null = null;

  constructor(config: AdapterConfig, packets?: TelemetryPacket[]) {
    this.config = config;
    this.packets = packets || [];
  }

  async connect(): Promise<void> {
    this.status = 'CONNECTED';
    this.timer = window.setInterval(() => this.emitNext(), Math.max(50, 1000 / (this.config.replay?.speed || 1))) as unknown as number;
  }

  async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
    if (this.timer) clearInterval(this.timer);
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  subscribe(callback: (data: TelemetryData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  async sendCommand(command: string, payload?: any): Promise<void> {
    if (command === 'seek' && typeof payload === 'number') {
      this.index = Math.max(0, Math.min(this.packets.length - 1, payload));
    }
  }

  getConfigSummary(): Record<string, unknown> {
    return { sessionId: this.config.replay?.sessionId, speed: this.config.replay?.speed };
  }

  setPackets(packets: TelemetryPacket[]): void {
    this.packets = packets;
    this.index = 0;
  }

  private emitNext(): void {
    if (this.index >= this.packets.length) {
      this.index = 0;
      return;
    }
    const batch = this.packets.slice(this.index, this.index + 10);
    this.index += 10;
    const data: TelemetryData = {
      bridgeId: 'BRIDGE-001',
      timestamp: Date.now(),
      packets: batch,
    };
    this.subscribers.forEach((cb) => cb(data));
  }
}