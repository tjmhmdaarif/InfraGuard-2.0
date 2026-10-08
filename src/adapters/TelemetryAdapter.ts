import type { TelemetryPacket } from '../types/telemetry';

export type AdapterStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';
export type TelemetryDataSource = 'SIMULATION' | 'STM32' | 'MQTT' | 'SERIAL' | 'REPLAY';

export interface TelemetryData {
  bridgeId: string;
  timestamp: number;
  packets: TelemetryPacket[];
}

export interface TelemetryAdapter {
  readonly name: string;
  readonly type: TelemetryDataSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): AdapterStatus;
  subscribe(callback: (data: TelemetryData) => void): () => void;
  sendCommand(command: string, payload?: any): Promise<void>;
  getConfigSummary(): Record<string, unknown>;
}

export interface AdapterConfig {
  source: 'SIMULATION' | 'MQTT' | 'SERIAL' | 'REPLAY' | 'HARDWARE';
  mqtt?: {
    brokerUrl: string;
    username?: string;
    password?: string;
    topics: string[];
  };
  serial?: {
    port: string;
    baudRate: number;
  };
  replay?: {
    sessionId: string;
    speed: number;
  };
}