import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Radio, Zap, Thermometer, Gauge, Droplet, Cloud, Target } from 'lucide-react';
import { TelemetryStatistics } from '../../types/telemetry';
import { SensorConfiguration } from '../../types/sensor';

interface SensorComparisonProps {
  sensors: (TelemetryStatistics & { config?: SensorConfiguration })[];
  configurations: Map<string, SensorConfiguration>;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MPU6050: <Zap className="w-4 h-4" />,
  STRAIN: <Thermometer className="w-4 h-4" />,
  LOAD_CELL: <Gauge className="w-4 h-4" />,
  HX711: <Gauge className="w-4 h-4" />,
  DHT22: <Cloud className="w-4 h-4" />,
  RAIN: <Droplet className="w-4 h-4" />,
  HC_SR04: <Target className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  MPU6050: 'var(--accent-cyan)',
  STRAIN: 'var(--accent-amber)',
  LOAD_CELL: 'var(--accent-green)',
  HX711: 'var(--accent-green)',
  DHT22: 'var(--accent-blue)',
  RAIN: 'var(--accent-blue)',
  HC_SR04: 'var(--accent-cyan)',
};

export function SensorComparison({ sensors, configurations }: SensorComparisonProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, typeof sensors> = {};
    sensors.forEach((s) => {
      const type = s.config?.sensorType || 'UNKNOWN';
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    });
    return groups;
  }, [sensors]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-header">
        <h3 className="font-medium text-[var(--fg-primary)]">Sensor Comparison</h3>
      </div>
      <div className="panel-content max-h-[350px] overflow-y-auto space-y-3">
        {Object.entries(grouped).map(([type, typeSensors]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`p-1.5 rounded ${TYPE_COLORS[type]}/20`}>{TYPE_ICONS[type] || <Radio className="w-4 h-4" />}</span>
              <span className="font-medium text-[var(--fg-primary)]">{type}</span>
              <span className="px-2 py-0.5 bg-[var(--bg-primary)] rounded text-xs text-[var(--fg-muted)]">{typeSensors.length} sensors</span>
            </div>
            <div className="space-y-1">
              {typeSensors.map((s) => (
                <div key={s.sensorId} className="flex items-center justify-between text-sm py-1 border-t border-[var(--border-primary)]/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[var(--fg-primary)]">{s.sensorId}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${s.trend === 'INCREASING' ? 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]' : s.trend === 'DECREASING' ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]' : 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]'}`}>
                      {s.trend === 'INCREASING' ? <TrendingUp className="w-3 h-3" /> : s.trend === 'DECREASING' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--fg-secondary)]">
                    <span>μ: {s.mean.toFixed(2)}</span>
                    <span>σ: {s.stdDev.toFixed(2)}</span>
                    <span>Max: {s.max.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}