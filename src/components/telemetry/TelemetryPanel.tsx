import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Thermometer, Droplet, CloudRain, Target, Gauge, Radio, Loader2 } from 'lucide-react';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useSensorStore } from '../../stores/sensorStore';
import { SensorType, TelemetryPacket } from '../../types';

interface TelemetryCardProps {
  sensor: TelemetryPacket | undefined;
  config: any;
  icon: React.ReactNode;
  color: string;
  formatValue: (packet: TelemetryPacket) => string;
  getUnit: (packet: TelemetryPacket) => string;
}

function TelemetryCard({ sensor, config, icon, color, formatValue, getUnit }: TelemetryCardProps) {
  if (!sensor) {
    return (
      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--bg-primary)]">{icon}</div>
          <div className="flex-1">
            <div className="h-4 w-3/4 bg-[var(--bg-primary)] rounded" />
            <div className="h-3 w-1/2 bg-[var(--bg-primary)] rounded mt-1" />
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    NORMAL: 'text-[var(--accent-green)]',
    WARNING: 'text-[var(--accent-amber)]',
    CRITICAL: 'text-[var(--accent-red)]',
    OFFLINE: 'text-[var(--fg-muted)]',
    STALE: 'text-[var(--fg-muted)]',
    DEGRADED: 'text-[var(--accent-amber)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--accent-cyan)]/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}/20`}>{icon}</div>
          <div>
            <p className="font-medium text-[var(--fg-primary)]">{config?.sensorId || sensor.sensorId}</p>
            <p className="text-xs text-[var(--fg-muted)]">{config?.sensorType || sensor.sensorType}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sensor.status as keyof typeof statusColors] || 'text-[var(--fg-muted)]'}`}>
          {sensor.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[var(--fg-primary)]">{formatValue(sensor)}</p>
          <p className="text-xs text-[var(--fg-muted)]">{getUnit(sensor)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--fg-muted)]">Health: {sensor.healthScore.toFixed(0)}%</p>
          <p className="text-xs text-[var(--fg-muted)]">Signal: {sensor.signalStrength.toFixed(0)}%</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs">
        <span className="text-[var(--fg-muted)]">Source: {sensor.dataSource}</span>
        <span className="text-[var(--fg-muted)]">Anomaly: {(sensor.anomalyScore * 100).toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}

export function TelemetryPanel() {
  const { latestPackets } = useTelemetryStore();
  const { getConfiguration } = useSensorStore();

  const sensorGroups = useMemo(() => {
    const groups: Record<string, TelemetryPacket[]> = {};
    latestPackets.forEach((packet) => {
      if (!groups[packet.sensorType]) groups[packet.sensorType] = [];
      groups[packet.sensorType].push(packet);
    });
    return groups;
  }, [latestPackets]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h3 className="font-medium text-[var(--fg-primary)]">Live Telemetry</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['MPU6050', 'STRAIN', 'LOAD_CELL', 'HX711', 'DHT22', 'RAIN', 'HC_SR04'] as SensorType[]).map((type) => {
          const packets = sensorGroups[type] || [];
          const packet = packets[0];
          const config = packet ? getConfiguration(packet.sensorId) : undefined;

          const icons: Record<SensorType, React.ReactNode> = {
            MPU6050: <Zap className="w-5 h-5" />,
            STRAIN: <Thermometer className="w-5 h-5" />,
            LOAD_CELL: <Gauge className="w-5 h-5" />,
            HX711: <Gauge className="w-5 h-5" />,
            DHT22: <CloudRain className="w-5 h-5" />,
            RAIN: <Droplet className="w-5 h-5" />,
            HC_SR04: <Target className="w-5 h-5" />,
          };

          const colors: Record<SensorType, string> = {
            MPU6050: 'text-[var(--accent-cyan)]',
            STRAIN: 'text-[var(--accent-amber)]',
            LOAD_CELL: 'text-[var(--accent-green)]',
            HX711: 'text-[var(--accent-green)]',
            DHT22: 'text-[var(--accent-blue)]',
            RAIN: 'text-[var(--accent-blue)]',
            HC_SR04: 'text-[var(--accent-cyan)]',
          };

          const formatValue = (p: TelemetryPacket) => {
            switch (type) {
              case 'MPU6050': return p.vibration?.magnitude.toFixed(3) || '0';
              case 'STRAIN': return p.strain?.strain.toFixed(1) || '0';
              case 'LOAD_CELL': return p.load?.load.toFixed(1) || '0';
              case 'HX711': return p.load?.load.toFixed(1) || '0';
              case 'DHT22': return `${p.temperature?.toFixed(1) || '0'}° / ${p.humidity?.toFixed(0) || '0'}%`;
              case 'RAIN': return `${p.rainfall?.toFixed(1) || '0'}`;
              case 'HC_SR04': return `${p.distance?.toFixed(0) || '0'}`;
            }
          };

          const getUnit = (p: TelemetryPacket) => {
            switch (type) {
              case 'MPU6050': return 'g';
              case 'STRAIN': return 'µε';
              case 'LOAD_CELL': return 'kN';
              case 'HX711': return 'kg';
              case 'DHT22': return '°C / %';
              case 'RAIN': return 'mm/h';
              case 'HC_SR04': return 'mm';
            }
          };

          return (
            <TelemetryCard
              key={type}
              sensor={packet}
              config={config}
              icon={icons[type]}
              color={colors[type]}
              formatValue={formatValue}
              getUnit={getUnit}
            />
          );
        })}
      </div>
    </div>
  );
}