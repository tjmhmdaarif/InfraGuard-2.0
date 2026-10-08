import { TelemetryAdapter, TelemetryData, AdapterStatus, AdapterConfig } from './TelemetryAdapter';
import type { TelemetryPacket } from '../types/telemetry';

export class MQTTTelemetryAdapter implements TelemetryAdapter {
  readonly name = 'MQTT Telemetry';
  readonly type = 'MQTT';
  private config: AdapterConfig;
  private status: AdapterStatus = 'DISCONNECTED';
  private subscribers: Set<(data: TelemetryData) => void> = new Set();

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.status = 'CONNECTING';
    try {
      // In a real implementation this would use an MQTT client over WebSocket.
      // For MVP we simulate a successful connection.
      await new Promise((r) => setTimeout(r, 300));
      this.status = 'CONNECTED';
    } catch {
      this.status = 'ERROR';
      throw new Error('MQTT connection failed');
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
    console.log(`MQTT command: ${command}`, payload);
  }

  getConfigSummary(): Record<string, unknown> {
    return {
      brokerUrl: this.config.mqtt?.brokerUrl,
      topics: this.config.mqtt?.topics,
    };
  }

  // Simulated ingest from MQTT
  simulateIngest(packets: TelemetryPacket[]): void {
    const data: TelemetryData = {
      bridgeId: 'BRIDGE-001',
      timestamp: Date.now(),
      packets,
    };
    this.subscribers.forEach((cb) => cb(data));
  }
}