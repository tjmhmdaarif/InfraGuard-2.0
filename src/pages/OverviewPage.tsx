import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Wifi,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudRain,
  Car,
  Gauge,
  Activity,
  AlertTriangle,
  Battery,
  Thermometer,
} from 'lucide-react';
import { BridgeSceneWrapper } from '../three/BridgeScene';
import { useSimulationStore } from '../stores/simulationStore';
import { useSensorStore } from '../stores/sensorStore';
import { useAlertStore } from '../stores/alertStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import { KpiCard } from '../components/dashboard/KpiCard';
import { LiveChart } from '../components/dashboard/LiveChart';
import { IncidentTable } from '../components/dashboard/IncidentTable';

export function OverviewPage() {
  const navigate = useNavigate();
  const { clock, isRunning, speed } = useSimulationStore();
  const { getOnlineCount, getTotalCount, getConfigurationsByZone } = useSensorStore();
  const { summary } = useAlertStore();
  const telemetryHistory = useTelemetryStore((state) => state.history);
  const latestPackets = useTelemetryStore((state) => state.latestPackets);

  const onlineCount = getOnlineCount();
  const totalCount = getTotalCount();

  const healthScore = useMemo(() => {
    const packets = Array.from(latestPackets.values());
    if (packets.length === 0) {
      const configs = getConfigurationsByZone('CENTER-SPAN');
      return configs.length > 0
        ? Math.round(configs.reduce((sum, config) => sum + config.healthScore, 0) / configs.length)
        : null;
    }
    return Math.round(packets.reduce((sum, packet) => sum + packet.healthScore, 0) / packets.length);
  }, [latestPackets, getConfigurationsByZone]);

  const latestTelemetry = useMemo(
    () => Array.from(latestPackets.values()).sort(
      (first, second) => Date.parse(second.timestamp) - Date.parse(first.timestamp),
    )[0],
    [latestPackets],
  );

  const chartPackets = useMemo(() => ({
    vibration: telemetryHistory.filter((packet) => packet.vibration !== undefined).slice(-100),
    strain: telemetryHistory.filter((packet) => packet.strain !== undefined).slice(-100),
    displacement: telemetryHistory.filter((packet) => packet.displacement !== undefined).slice(-100),
    temperature: telemetryHistory.filter((packet) => packet.temperature !== undefined).slice(-100),
    rainfall: telemetryHistory.filter((packet) => packet.rainfall !== undefined).slice(-100),
    load: telemetryHistory.filter((packet) => packet.load !== undefined).slice(-100),
  }), [telemetryHistory]);

  const trafficDensity = latestTelemetry?.trafficDensity;
  const weatherCondition = latestTelemetry?.weatherCondition ?? 'WAITING';
  const dataSource = latestTelemetry?.dataSource ?? 'WAITING';
  const rainReading = Array.from(latestPackets.values()).find((packet) => packet.rainfall !== undefined)?.rainfall;
  const humidityReading = Array.from(latestPackets.values()).find((packet) => packet.humidity !== undefined)?.humidity;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto scrollbar-thin">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Overview</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Bridge health monitoring dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm font-mono tabular-nums text-[var(--fg-secondary)]">
              {formatTime(clock.time)}
            </span>
            <span className="px-3 py-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg text-sm font-medium">
              {speed}x
            </span>
          </div>
        </motion.div>

        {/* KPI Cards - Responsive Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            title="Bridge Health"
            value={healthScore === null ? 'Waiting' : `${healthScore}%`}
            status={healthScore === null ? 'warning' : healthScore >= 90 ? 'normal' : healthScore >= 60 ? 'warning' : 'critical'}
            icon={<Gauge className="w-6 h-6" />}
            trend={<TrendingDown className="w-4 h-4 text-[var(--accent-amber)]" />}
            trendLabel={healthScore === null ? 'Waiting for telemetry' : 'Calculated from latest sensor packets'}
            subtitle={healthScore === null ? 'No telemetry received yet' : 'Average latest sensor health'}
          />
          <KpiCard
            title="Sensors Online"
            value={`${onlineCount} / ${totalCount}`}
            status={onlineCount === totalCount ? 'normal' : 'warning'}
            icon={<Radio className="w-6 h-6" />}
            trend={<TrendingUp className="w-4 h-4 text-[var(--accent-green)]" />}
            trendLabel={totalCount > 0 && onlineCount === totalCount ? 'All configured sensors online' : 'Check configured sensor status'}
            subtitle="MPU6050, Strain, DHT22, Rain, HC-SR04"
          />
          <KpiCard
            title="Traffic Density"
            value={trafficDensity === undefined ? 'Waiting' : `${trafficDensity.toFixed(0)}%`}
            status={trafficDensity === undefined ? 'warning' : trafficDensity < 35 ? 'normal' : trafficDensity < 70 ? 'warning' : 'critical'}
            icon={<Car className="w-6 h-6" />}
            trend={<TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" />}
            trendLabel={latestTelemetry ? 'Latest simulated traffic load' : 'Waiting for telemetry'}
            subtitle="Traffic density from the live telemetry stream"
          />
          <KpiCard
            title="Weather"
            value={weatherCondition.replace('_', ' ')}
            status={weatherCondition === 'CLEAR' ? 'normal' : weatherCondition === 'WAITING' ? 'warning' : 'warning'}
            icon={<CloudRain className="w-6 h-6" />}
            trend={<Minus className="w-4 h-4 text-[var(--fg-muted)]" />}
            trendLabel={latestTelemetry ? 'Latest sensor environment' : 'Waiting for telemetry'}
            subtitle={`Rainfall: ${rainReading === undefined ? '—' : `${rainReading.toFixed(1)} mm/h`}, Humidity: ${humidityReading === undefined ? '—' : `${humidityReading.toFixed(0)}%`}`}
          />
        </motion.div>

        {/* Charts Grid - Full Width on Desktop, Stacked on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <LiveChart
            title="Vibration (g)"
            unit="g"
            color="var(--accent-cyan)"
            dataPoints={100}
            height={280}
            data={chartPackets.vibration}
            metric="vibration"
          />
          <LiveChart
            title="Strain (µε)"
            unit="µε"
            color="var(--accent-amber)"
            dataPoints={100}
            height={280}
            data={chartPackets.strain}
            metric="strain"
          />
          <LiveChart
            title="Displacement (mm)"
            unit="mm"
            color="var(--accent-green)"
            dataPoints={100}
            height={280}
            data={chartPackets.displacement}
            metric="displacement"
          />
          <LiveChart
            title="Temperature (°C)"
            unit="°C"
            color="var(--accent-red)"
            dataPoints={100}
            height={280}
            data={chartPackets.temperature}
            metric="temperature"
          />
        </motion.div>

        {/* Main Content Grid - Responsive Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-4"
        >
          <div className="xl:col-span-2 panel min-h-[350px]">
            <div className="panel-header flex items-center justify-between">
              <h3 className="font-medium text-[var(--fg-primary)]">3D Bridge Preview</h3>
              <span className="text-xs px-2 py-1 bg-[var(--bg-primary)] rounded text-[var(--fg-muted)]">Interactive</span>
            </div>
            <div className="panel-content p-0 h-[350px] relative">
              <BridgeSceneWrapper />
              <button
                type="button"
                onClick={() => navigate('/digital-twin')}
                className="absolute inset-0 z-10 flex items-end justify-center pb-4 cursor-pointer bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-cyan)]"
                aria-label="Open the interactive Digital Twin"
              >
                <span className="px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm">
                  Click to enter Digital Twin →
                </span>
              </button>
            </div>
          </div>

          <div className="panel min-h-[350px]">
            <div className="panel-header flex items-center justify-between">
              <h3 className="font-medium text-[var(--fg-primary)]">Active Alerts</h3>
              <span className="px-2 py-1 bg-[var(--accent-amber)] text-[var(--bg-primary)] rounded text-xs font-medium">
                {summary.unacknowledged} unacknowledged
              </span>
            </div>
            <div className="panel-content">
              <IncidentTable maxRows={8} />
            </div>
          </div>
        </motion.div>

        {/* Bottom Status Cards - Responsive Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatusCard title="Data Source" value={dataSource} icon={<Database className="w-5 h-5" />} status="info" description="Synthetic telemetry engine" />
          <StatusCard
            title="External connections"
            value="NOT CONNECTED"
            icon={<Wifi className="w-5 h-5" />}
            status="warning"
            description="Configure MQTT and database endpoints in Settings"
            onClick={() => navigate('/settings')}
          />
          <StatusCard title="Simulation" value={isRunning ? 'RUNNING' : 'PAUSED'} icon={<Zap className="w-5 h-5" />} status={isRunning ? 'normal' : 'warning'} description={`Speed: ${speed}x • Demo mode active`} />
          <StatusCard
            title="System Health"
            value={healthScore === null ? 'Waiting' : `${healthScore}%`}
            icon={<Activity className="w-5 h-5" />}
            status={healthScore === null ? 'warning' : healthScore >= 90 ? 'normal' : healthScore >= 60 ? 'warning' : 'critical'}
            description={healthScore === null ? 'No telemetry received yet' : 'Bridge structural health'}
          />
        </motion.div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, status, description, onClick }: { title: string; value: string; icon: React.ReactNode; status: 'normal' | 'warning' | 'critical' | 'info'; description: string; onClick?: () => void }) {
  const statusColors = {
    normal: 'text-[var(--accent-green)]',
    warning: 'text-[var(--accent-amber)]',
    critical: 'text-[var(--accent-red)]',
    info: 'text-[var(--accent-blue)]',
  };

  return (
    <button type="button" onClick={onClick} className={`panel w-full text-left ${onClick ? 'cursor-pointer hover:border-[var(--border-secondary)] hover:shadow-lg transition-all duration-200' : ''}`}>
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] transition-transform group-hover:scale-105">
            <div className={statusColors[status]}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wide font-medium">{title}</p>
            <p className="text-xl font-bold text-[var(--fg-primary)] truncate">{value}</p>
            <p className="text-sm text-[var(--fg-secondary)] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </button>
  );
}