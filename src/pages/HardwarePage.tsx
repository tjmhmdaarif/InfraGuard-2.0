import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Radio, Wifi, Database, Server, ArrowRight, ArrowDown, CheckCircle,
  AlertTriangle, XCircle, Settings, Play, Square, RefreshCw, Zap, Satellite,
  GitBranch, Activity, Loader2
} from 'lucide-react';
import { useSensorStore } from '../stores/sensorStore';

const HARDWARE_STEPS = [
  { id: 'sensors', label: 'Sensors', icon: <Radio className="w-6 h-6" />, detail: 'MPU6050, Strain, DHT22, Rain, HC-SR04', status: 'SIMULATED' },
  { id: 'stm32', label: 'STM32 F446RE', icon: <Cpu className="w-6 h-6" />, detail: 'Edge acquisition & filtering', status: 'SIMULATED' },
  { id: 'lora_tx', label: 'LoRa RA-02 TX', icon: <Radio className="w-6 h-6" />, detail: '433 MHz, SF7, BW125kHz', status: 'SIMULATED' },
  { id: 'lora_rx', label: 'LoRa RA-02 RX', icon: <Radio className="w-6 h-6" />, detail: 'Receiver gateway', status: 'SIMULATED' },
  { id: 'esp8266', label: 'ESP8266 Gateway', icon: <Wifi className="w-6 h-6" />, detail: 'Wi-Fi bridge to MQTT', status: 'SIMULATED' },
  { id: 'mqtt', label: 'MQTT Broker', icon: <Server className="w-6 h-6" />, detail: 'Mosquitto @ localhost:1883', status: 'DEMO MODE' },
  { id: 'influx', label: 'InfluxDB', icon: <Database className="w-6 h-6" />, detail: 'Time-series storage', status: 'LOCAL / DEMO' },
  { id: 'dt', label: 'Digital Twin', icon: <GitBranch className="w-6 h-6" />, detail: 'InfraGuard platform', status: 'ONLINE' },
];

const MQTT_TOPICS = [
  'infraguard/bridge/telemetry',
  'infraguard/bridge/status',
  'infraguard/bridge/alerts',
  'infraguard/sensors/+/telemetry',
  'infraguard/system/status',
];

export function HardwarePage() {
  const [source, setSource] = useState<'SIMULATION' | 'HARDWARE' | 'REPLAY'>('SIMULATION');
  const [hardwareConnected, setHardwareConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleToggleHardware = () => {
    if (source === 'HARDWARE') {
      setSource('SIMULATION');
      setHardwareConnected(false);
    } else if (source === 'SIMULATION') {
      setSource('HARDWARE');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'CONNECTED' || s === 'ONLINE') return 'text-[var(--accent-green)] bg-[var(--accent-green)]/10';
    if (s === 'SIMULATED' || s === 'DEMO MODE' || s === 'LOCAL / DEMO') return 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10';
    if (s === 'OFFLINE' || s === 'ERROR') return 'text-[var(--accent-red)] bg-[var(--accent-red)]/10';
    return 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10';
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Hardware Integration</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Connect STM32, LoRa, ESP8266, MQTT and InfluxDB</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowConfig(!showConfig)} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)] flex items-center gap-2">
              <Settings className="w-4 h-4" /> Config
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatusCard title="Data Source" value={source} icon={<Database className="w-5 h-5" />} color={source === 'SIMULATION' ? 'var(--accent-blue)' : source === 'HARDWARE' ? 'var(--accent-green)' : 'var(--accent-amber)'} subtitle={source === 'SIMULATION' ? 'Synthetic telemetry' : source === 'HARDWARE' ? 'Live from STM32' : 'Replaying recorded session'} />
          <StatusCard title="STM32 F446RE" value="SIMULATED" icon={<Cpu className="w-5 h-5" />} color="var(--accent-blue)" subtitle="Nucleo board, 180MHz Cortex-M4" />
          <StatusCard title="LoRa RA-02" value="SIMULATED" icon={<Radio className="w-5 h-5" />} color="var(--accent-blue)" subtitle="433MHz, 10dBm TX power" />
          <StatusCard title="ESP8266 + MQTT" value="DEMO MODE" icon={<Wifi className="w-5 h-5" />} color="var(--accent-blue)" subtitle="Wi-Fi 802.11n, MQTT over TCP" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel"
        >
          <div className="panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-medium text-[var(--fg-primary)]">Data Pipeline Architecture</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleToggleHardware} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                source === 'HARDWARE' ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30' : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
              }`}>
                {source === 'HARDWARE' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {source === 'HARDWARE' ? 'Disconnect Hardware' : 'Connect Hardware'}
              </button>
              <span className={`px-3 py-1 rounded text-sm font-medium ${statusColor(source === 'HARDWARE' ? (hardwareConnected ? 'CONNECTED' : 'OFFLINE') : 'SIMULATED')}`}>
                {source === 'HARDWARE' ? (hardwareConnected ? 'HARDWARE ACTIVE' : 'HARDWARE NOT CONNECTED') : 'SIMULATION MODE'}
              </span>
            </div>
          </div>
          <div className="panel-content">
            <div className="relative">
              {HARDWARE_STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col md:flex-row md:items-center gap-4 pb-6 md:pb-0 last:pb-0">
                  <div className="flex items-center gap-4 flex-1">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-16 h-16 rounded-xl flex items-center justify-center border ${statusColor(step.status)} border-current/20`}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--fg-primary)]">{step.label}</h4>
                      <p className="text-sm text-[var(--fg-secondary)]">{step.detail}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor(step.status)}`}>
                        {step.status}
                      </span>
                    </div>
                  </div>
                  {index < HARDWARE_STEPS.length - 1 && (
                    <div className="hidden md:flex flex-col items-center w-8">
                      <ArrowRight className="w-6 h-6 text-[var(--fg-muted)]" />
                    </div>
                  )}
                  {index < HARDWARE_STEPS.length - 1 && (
                    <div className="md:hidden flex flex-col items-center">
                      <ArrowDown className="w-6 h-6 text-[var(--fg-muted)] my-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel"
          >
            <div className="panel-header">
              <h3 className="font-medium text-[var(--fg-primary)]">Connection Configuration</h3>
            </div>
            <div className="panel-content grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigField label="MQTT Broker URL" value="tcp://localhost:1883" />
              <ConfigField label="MQTT Username" value="infraguard_user" />
              <ConfigField label="MQTT Password" value="********" type="password" />
              <ConfigField label="Serial Port" value="COM4" />
              <ConfigField label="Baud Rate" value="115200" />
              <ConfigField label="InfluxDB URL" value="http://localhost:8086" />
              <ConfigField label="InfluxDB Token" value="********" type="password" />
              <ConfigField label="InfluxDB Org/Bucket" value="infraguard / telemetry" />
              <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t border-[var(--border-primary)]">
                <button className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90">Test Connection</button>
                <button className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-medium hover:bg-[var(--border-primary)]">Reset Defaults</button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel"
        >
          <div className="panel-header">
            <h3 className="font-medium text-[var(--fg-primary)]">MQTT Topics</h3>
          </div>
          <div className="panel-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MQTT_TOPICS.map((topic, index) => (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-mono text-sm"
                >
                  <span className="text-[var(--accent-cyan)]">{topic.split('/').slice(0, 2).join('/')}</span>
                  <span className="text-[var(--fg-muted)]">/{topic.split('/').slice(2).join('/')}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel"
        >
          <div className="panel-header">
            <h3 className="font-medium text-[var(--fg-primary)]">Telemetry Adapter Interface</h3>
          </div>
          <div className="panel-content">
            <pre className="text-xs font-mono text-[var(--fg-secondary)] overflow-x-auto bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-primary)]">
{`interface TelemetryAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): AdapterStatus;
  subscribe(callback: (data: TelemetryData) => void): void;
  unsubscribe(callback: Function): void;
  getLatestTelemetry(): TelemetryPacket[];
}`}
            </pre>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {['SyntheticTelemetryAdapter', 'MQTTTelemetryAdapter', 'SerialTelemetryAdapter', 'STM32TelemetryAdapter', 'ReplayTelemetryAdapter'].map((adapter) => (
                <div key={adapter} className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                  <p className="font-medium text-sm text-[var(--fg-primary)]">{adapter}</p>
                  <p className="text-xs text-[var(--fg-secondary)]">{adapter === 'SyntheticTelemetryAdapter' ? 'Deterministic simulation' : adapter === 'MQTTTelemetryAdapter' ? 'MQTT broker subscriber' : adapter === 'SerialTelemetryAdapter' ? 'USB/serial bridge' : adapter === 'STM32TelemetryAdapter' ? 'Direct Nucleo via USB' : 'Recorded session playback'}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, color, subtitle }: { title: string; value: string; icon: React.ReactNode; color: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}/20`}>{icon}</div>
          <div>
            <p className="text-sm text-[var(--fg-secondary)]">{title}</p>
            <p className="text-xl font-bold text-[var(--fg-primary)]">{value}</p>
            <p className="text-xs text-[var(--fg-muted)] mt-1">{subtitle}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConfigField({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--fg-primary)]">{label}</span>
      <input
        type={type}
        defaultValue={value}
        className="mt-1 w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
      />
    </label>
  );
}
