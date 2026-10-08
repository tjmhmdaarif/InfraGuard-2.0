import { TelemetryAdapter, TelemetryDataSource } from './TelemetryAdapter';
import { SyntheticTelemetryAdapter } from './SyntheticTelemetryAdapter';
import { MQTTTelemetryAdapter } from './MQTTTelemetryAdapter';
import { SerialTelemetryAdapter } from './SerialTelemetryAdapter';
import { ReplayTelemetryAdapter } from './ReplayTelemetryAdapter';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { AdapterConfig } from './TelemetryAdapter';

export { SyntheticTelemetryAdapter, MQTTTelemetryAdapter, SerialTelemetryAdapter, ReplayTelemetryAdapter };

export function createAdapter(config: AdapterConfig, engine?: SimulationEngine): TelemetryAdapter {
  switch (config.source) {
    case 'SIMULATION':
      if (!engine) throw new Error('SimulationEngine required for SIMULATION source');
      return new SyntheticTelemetryAdapter(engine);
    case 'MQTT':
      return new MQTTTelemetryAdapter(config);
    case 'SERIAL':
      return new SerialTelemetryAdapter(config);
    case 'REPLAY':
      return new ReplayTelemetryAdapter(config);
    case 'HARDWARE':
      // Placeholder: in production this would route to STM32 adapter
      throw new Error('HARDWARE adapter not yet implemented. Use SIMULATION mode for MVP.');
    default:
      throw new Error(`Unknown telemetry source: ${config.source}`);
  }
}

export function getAdapterDisplayName(source: TelemetryDataSource): string {
  switch (source) {
    case 'SIMULATION':
      return 'Simulation (Synthetic)';
    case 'MQTT':
      return 'MQTT Broker';
    case 'SERIAL':
      return 'Serial / USB';
    case 'REPLAY':
      return 'Replay Recording';
    default:
      return source;
  }
}