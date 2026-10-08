import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Radio, Zap, Thermometer, Gauge, Droplet, Cloud, Target, MapPin, Battery, Wifi, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSensorStore } from '../../stores/sensorStore';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { SensorConfiguration, SensorType } from '../../types';

interface SensorInspectorPanelProps {
  sensorId: string;
  onClose: () => void;
}

export function SensorInspectorPanel({ sensorId, onClose }: SensorInspectorPanelProps) {
  const { getConfiguration, getConfigurationsByZone, updateStatus } = useSensorStore();
  const { getLatestForSensor } = useTelemetryStore();

  const config = getConfiguration(sensorId);
  const telemetry = getLatestForSensor(sensorId);

  if (!config) return null;

  const sensorIcons: Record<SensorType, React.ReactNode> = {
    MPU6050: <Zap className="w-6 h-6" />,
    STRAIN: <Thermometer className="w-6 h-6" />,
    LOAD_CELL: <Gauge className="w-6 h-6" />,
    HX711: <Gauge className="w-6 h-6" />,
    DHT22: <Cloud className="w-6 h-6" />,
    RAIN: <Droplet className="w-6 h-6" />,
    HC_SR04: <Target className="w-6 h-6" />,
  };

  const sensorLabels: Record<SensorType, string> = {
    MPU6050: 'Vibration (MPU6050)',
    STRAIN: 'Strain Gauge',
    LOAD_CELL: 'Load Cell',
    HX711: 'HX711 Load Cell',
    DHT22: 'Temp/Humidity (DHT22)',
    RAIN: 'Rain Sensor',
    HC_SR04: 'Ultrasonic Distance',
  };

  const statusColors = {
    NORMAL: 'text-[var(--accent-green)] bg-[var(--accent-green)]/10',
    WARNING: 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10',
    CRITICAL: 'text-[var(--accent-red)] bg-[var(--accent-red)]/10',
    OFFLINE: 'text-[var(--fg-muted)] bg-[var(--fg-muted)]/10',
    STALE: 'text-[var(--fg-muted)] bg-[var(--fg-muted)]/10',
    DEGRADED: 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10',
  };

  const formatValue = (t: any) => {
    if (!t) return 'N/A';
    switch (config.sensorType) {
      case 'MPU6050': return `${t.vibration?.magnitude.toFixed(3) || 0} g`;
      case 'STRAIN': return `${t.strain?.strain.toFixed(1) || 0} µε`;
      case 'LOAD_CELL': return `${t.load?.load.toFixed(1) || 0} kN`;
      case 'HX711': return `${t.load?.load.toFixed(1) || 0} kg`;
      case 'DHT22': return `${t.temperature?.toFixed(1) || 0}°C / ${t.humidity?.toFixed(0) || 0}%`;
      case 'RAIN': return `${t.rainfall?.toFixed(1) || 0} mm/h`;
      case 'HC_SR04': return `${t.distance?.toFixed(0) || 0} mm`;
    }
  };

  const getTrend = () => {
    if (!telemetry) return <Minus className="w-4 h-4 text-[var(--fg-muted)]" />;
    if (telemetry.anomalyScore > 0.5) return <TrendingUp className="w-4 h-4 text-[var(--accent-red)]" />;
    if (telemetry.anomalyScore > 0.2) return <TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" />;
    return <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
            {sensorIcons[config.sensorType]}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--fg-primary)]">{config.sensorId}</h3>
            <p className="text-sm text-[var(--fg-secondary)]">{sensorLabels[config.sensorType]}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[config.status as keyof typeof statusColors] || statusColors.NORMAL}`}>
            {config.status}
          </div>
          <div className="flex-1 text-center">
            <span className="text-[var(--fg-muted)]">Health Score</span>
            <div className="text-2xl font-bold text-[var(--fg-primary)]">{config.healthScore.toFixed(0)}%</div>
          </div>
          {getTrend()}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Zone" value={config.zoneId} icon={<MapPin className="w-4 h-4" />} />
          <StatItem label="Data Source" value={config.dataSource} icon={<Radio className="w-4 h-4" />} />
          <StatItem label="Signal" value={`${config.signalStrength.toFixed(0)}%`} icon={<Wifi className="w-4 h-4" />} />
          <StatItem label="Battery" value={`${config.batteryLevel.toFixed(0)}%`} icon={<Battery className="w-4 h-4" />} />
        </div>

        {telemetry && (
          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <h4 className="font-medium text-[var(--fg-primary)] mb-3">Current Reading</h4>
            <div className="text-3xl font-bold text-[var(--fg-primary)] mb-1">{formatValue(telemetry)}</div>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--fg-secondary)]">
              <span>Anomaly: {(telemetry.anomalyScore * 100).toFixed(1)}%</span>
              <span>Updated: {new Date(telemetry.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <h4 className="font-medium text-[var(--fg-primary)] mb-3">Position</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span>X: {config.position.x.toFixed(3)}</span>
            <span>Y: {config.position.y.toFixed(3)}</span>
            <span>Z: {config.position.z.toFixed(3)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-primary)]">
          <h4 className="font-medium text-[var(--fg-primary)] mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateStatus(sensorId, config.status === 'NORMAL' ? 'WARNING' : 'NORMAL')}
              className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm font-medium hover:bg-[var(--border-primary)] flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Simulate Warning
            </button>
            <button
              onClick={() => updateStatus(sensorId, 'OFFLINE')}
              className="px-3 py-2 bg-[var(--accent-red)]/20 border border-[var(--accent-red)]/30 rounded-lg text-sm font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red)]/30 flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" /> Simulate Offline
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
      <div className="flex items-center gap-2 text-[var(--fg-muted)] mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-medium text-[var(--fg-primary)]">{value}</div>
    </div>
  );
}