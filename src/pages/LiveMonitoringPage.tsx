import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Thermometer, Gauge, Droplet, Cloud, Target, Car, CloudRain,
  TrendingUp, TrendingDown, Minus, Wifi, Database, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useSensorStore } from '../stores/sensorStore';
import { useAlertStore } from '../stores/alertStore';
import { LiveChart } from '../components/dashboard/LiveChart';
import { TelemetryPanel } from '../components/telemetry/TelemetryPanel';

export function LiveMonitoringPage() {
  const latestPackets = useTelemetryStore((state) => state.latestPackets);
  const telemetryHistory = useTelemetryStore((state) => state.history);
  const { getConfiguration, getConfigurationsByZone } = useSensorStore();
  const { summary } = useAlertStore();

  const sensorTypes = ['MPU6050', 'STRAIN', 'LOAD_CELL', 'HX711', 'DHT22', 'RAIN', 'HC_SR04'] as const;

  const telemetryData = useMemo(() => {
    const data: Record<string, any> = {};
    latestPackets.forEach((packet) => {
      data[packet.sensorId] = packet;
    });
    return data;
  }, [latestPackets]);

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Live Monitoring</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Real-time sensor telemetry and system status</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[var(--accent-green)]/20 text-[var(--accent-green)] rounded-lg text-sm font-medium flex items-center gap-1">
              <Wifi className="w-4 h-4" /> LIVE
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <LiveMetricCard
            title="Vibration"
            sensorType="MPU6050"
            icon={<Zap className="w-6 h-6" />}
            color="var(--accent-cyan)"
            telemetry={telemetryData}
            getConfig={getConfiguration}
            formatValue={(p) => p.vibration?.magnitude.toFixed(3) || '0'}
            unit="g"
          />
          <LiveMetricCard
            title="Strain"
            sensorType="STRAIN"
            icon={<Thermometer className="w-6 h-6" />}
            color="var(--accent-amber)"
            telemetry={telemetryData}
            getConfig={getConfiguration}
            formatValue={(p) => p.strain?.strain.toFixed(1) || '0'}
            unit="µε"
          />
          <LiveMetricCard
            title="Load"
            sensorType="LOAD_CELL"
            icon={<Gauge className="w-6 h-6" />}
            color="var(--accent-green)"
            telemetry={telemetryData}
            getConfig={getConfiguration}
            formatValue={(p) => p.load?.load.toFixed(1) || '0'}
            unit="kN"
          />
          <LiveMetricCard
            title="Displacement"
            sensorType="HC_SR04"
            icon={<Target className="w-6 h-6" />}
            color="var(--accent-cyan)"
            telemetry={telemetryData}
            getConfig={getConfiguration}
            formatValue={(p) => p.distance?.toFixed(0) || '0'}
            unit="mm"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <LiveChart title="Vibration (g)" unit="g" color="var(--accent-cyan)" dataPoints={200} height={300} data={telemetryHistory} metric="vibration" />
          <LiveChart title="Strain (µε)" unit="µε" color="var(--accent-amber)" dataPoints={200} height={300} data={telemetryHistory} metric="strain" />
          <LiveChart title="Load (kN)" unit="kN" color="var(--accent-green)" dataPoints={200} height={300} data={telemetryHistory} metric="load" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <LiveChart title="Displacement (mm)" unit="mm" color="var(--accent-cyan)" dataPoints={200} height={280} data={telemetryHistory} metric="displacement" />
          <LiveChart title="Temperature (°C)" unit="°C" color="var(--accent-blue)" dataPoints={200} height={280} data={telemetryHistory} metric="temperature" />
          <LiveChart title="Rainfall (mm/h)" unit="mm/h" color="var(--accent-blue)" dataPoints={200} height={280} data={telemetryHistory} metric="rainfall" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel"
        >
          <div className="panel-header flex items-center justify-between">
            <h3 className="font-medium text-[var(--fg-primary)]">Sensor Details</h3>
          </div>
          <div className="panel-content">
            <TelemetryPanel />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatusCard title="Data Source" value="SIMULATION" icon={<Database className="w-5 h-5" />} status="info" description="Synthetic telemetry engine" />
          <StatusCard title="MQTT" value="NOT CONNECTED" icon={<Wifi className="w-5 h-5" />} status="info" description="Connection profile only; no broker session" />
          <StatusCard title="InfluxDB" value="NOT CONNECTED" icon={<Database className="w-5 h-5" />} status="info" description="Connection profile only; no database session" />
          <StatusCard title="Alerts" value={`${summary.unacknowledged} active`} icon={<AlertTriangle className="w-5 h-5" />} status={summary.unacknowledged > 0 ? 'warning' : 'normal'} description={`${summary.critical} critical, ${summary.warning} warnings`} />
        </motion.div>
      </div>
    </div>
  );
}

function LiveMetricCard({
  title,
  sensorType,
  icon,
  color,
  telemetry,
  getConfig,
  formatValue,
  unit,
}: {
  title: string;
  sensorType: string;
  icon: React.ReactNode;
  color: string;
  telemetry: Record<string, any>;
  getConfig: (id: string) => any;
  formatValue: (p: any) => string;
  unit: string;
}) {
  const sensors = Object.entries(telemetry).filter(([_, p]) => p.sensorType === sensorType);
  const sensor = sensors[0]?.[1];
  const config = sensor ? getConfig(sensor.sensorId) : null;

  const statusColors = {
    NORMAL: 'text-[var(--accent-green)]',
    WARNING: 'text-[var(--accent-amber)]',
    CRITICAL: 'text-[var(--accent-red)]',
    OFFLINE: 'text-[var(--fg-muted)]',
    STALE: 'text-[var(--fg-muted)]',
    DEGRADED: 'text-[var(--accent-amber)]',
  };

  const trend = sensor?.anomalyScore > 0.5 ? <TrendingUp className="w-4 h-4 text-[var(--accent-red)]" /> :
    sensor?.anomalyScore > 0.2 ? <TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" /> :
    <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}/20`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--fg-secondary)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--fg-primary)] mb-1">{sensor ? formatValue(sensor) : '—'} <span className="text-sm font-normal text-[var(--fg-muted)]">{unit}</span></p>
            <div className="flex items-center gap-3 text-sm">
              <span className={`flex items-center gap-1 ${statusColors[sensor?.status as keyof typeof statusColors] || 'text-[var(--fg-muted)]'}`}>
                {sensor?.status || 'OFFLINE'}
              </span>
              {trend}
              <span className="text-[var(--fg-muted)]">Health: {sensor?.healthScore?.toFixed(0) || 0}%</span>
            </div>
          </div>
        </div>
        {config && (
          <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs">
            <span className="text-[var(--fg-muted)]">Zone: {config.zoneId}</span>
            <span className="text-[var(--fg-muted)]">Source: {config.dataSource}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusCard({ title, value, icon, status, description }: { title: string; value: string; icon: React.ReactNode; status: 'normal' | 'warning' | 'critical' | 'info'; description: string }) {
  const statusColors = {
    normal: 'text-[var(--accent-green)]',
    warning: 'text-[var(--accent-amber)]',
    critical: 'text-[var(--accent-red)]',
    info: 'text-[var(--accent-blue)]',
  };

  return (
    <div className="panel">
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-[var(--bg-tertiary)] ${statusColors[status]}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-[var(--fg-primary)] truncate">{value}</p>
            <p className="text-sm text-[var(--fg-secondary)] mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
