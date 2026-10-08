import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Clock, MapPin,
  Radio, Zap, Thermometer, Gauge, Target, Download, FileText, Filter,
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, FastForward
} from 'lucide-react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useAlertStore } from '../stores/alertStore';
import { useSensorStore } from '../stores/sensorStore';
import { useHealthStore } from '../stores/healthStore';
import { LiveChart } from '../components/dashboard/LiveChart';
import { CorrelationChart } from '../components/analytics/CorrelationChart';
import { SensorComparison } from '../components/analytics/SensorComparison';
import { ZoneComparison } from '../components/analytics/ZoneComparison';
import { exportTelemetryToCSV, exportToJSON, downloadFile } from '../services/export';

const TIME_RANGES = [
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
];

export function AnalyticsPage() {
  const { history, statistics, getSensorHistory, getZoneHistory } = useTelemetryStore();
  const { alerts, summary } = useAlertStore();
  const { configurations } = useSensorStore();
  const { componentHealths, zoneHealths } = useHealthStore();

  const [timeRange, setTimeRange] = useState(TIME_RANGES[2].value);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [overlayTraffic, setOverlayTraffic] = useState(false);
  const [overlayWeather, setOverlayWeather] = useState(false);
  const [overlayAlerts, setOverlayAlerts] = useState(false);

  const sensorStats = useMemo(() => {
    return Array.from(statistics.values()).map((s) => ({
      ...s,
      config: configurations.get(s.sensorId),
    })).filter(s => s.config);
  }, [statistics, configurations]);

  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - timeRange;
    return history.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  }, [history, timeRange]);

  const correlations = useMemo(() => {
    const vibData = filteredHistory.filter(p => p.sensorType === 'MPU6050');
    const strainData = filteredHistory.filter(p => p.sensorType === 'STRAIN');
    const dispData = filteredHistory.filter(p => p.sensorType === 'HC_SR04');
    const loadData = filteredHistory.filter(p => p.sensorType === 'LOAD_CELL');

    return {
      trafficVibration: vibData.length > 10 ? calculateCorrelation(
        vibData.map(p => p.trafficDensity),
        vibData.map(p => p.vibration?.magnitude || 0)
      ) : 0,
      trafficStrain: strainData.length > 10 ? calculateCorrelation(
        strainData.map(p => p.trafficDensity),
        strainData.map(p => p.strain?.strain || 0)
      ) : 0,
      rainTemperature: filteredHistory.length > 10 ? calculateCorrelation(
        filteredHistory.map(p => p.rainfall || 0),
        filteredHistory.map(p => p.temperature || 0)
      ) : 0,
      loadDisplacement: dispData.length > 10 ? calculateCorrelation(
        dispData.map(p => p.vehicleLoad),
        dispData.map(p => p.displacement || 0)
      ) : 0,
    };
  }, [filteredHistory]);

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Analytics</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Historical analysis, correlations & trend visualization</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
            >
              {TIME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button onClick={() => {
              const csv = exportTelemetryToCSV(filteredHistory);
              downloadFile('infraguard-telemetry.csv', csv, 'text/csv');
            }} className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => {
              const report = {
                generatedAt: new Date().toISOString(),
                timeRangeLabel: TIME_RANGES.find((r) => r.value === timeRange)?.label,
                summary: {
                  totalPackets: filteredHistory.length,
                  avgVibration: filteredHistory.filter((p) => p.vibration).reduce((a, b) => a + (b.vibration?.magnitude || 0), 0) / Math.max(1, filteredHistory.filter((p) => p.vibration).length),
                  maxStrain: Math.max(...filteredHistory.filter((p) => p.strain).map((p) => p.strain?.strain || 0), 0),
                  maxDisplacement: Math.max(...filteredHistory.filter((p) => p.displacement !== undefined).map((p) => p.displacement || 0), 0),
                },
                alerts: summary,
                sensors: Array.from(configurations.values()).map((s) => ({ id: s.sensorId, type: s.sensorType, zone: s.zoneId })),
              };
              downloadFile('infraguard-report.json', exportToJSON(report), 'application/json');
            }} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-medium hover:bg-[var(--border-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4" /> Report
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <AnalyticsCard title="Avg Vibration" value={`${(sensorStats.filter(s => s.config?.sensorType === 'MPU6050').reduce((a,b) => a + b.mean, 0) / Math.max(1, sensorStats.filter(s => s.config?.sensorType === 'MPU6050').length)).toFixed(3)} g`} trend={<TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />} icon={<Zap className="w-5 h-5" />} color="var(--accent-cyan)" subtitle="Mean across all vibration sensors" />
          <AnalyticsCard title="Peak Strain" value={`${Math.max(...sensorStats.filter(s => s.config?.sensorType === 'STRAIN').map(s => s.max), 0).toFixed(1)} µε`} trend={<TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" />} icon={<Thermometer className="w-5 h-5" />} color="var(--accent-amber)" subtitle="Maximum recorded strain" />
          <AnalyticsCard title="Max Displacement" value={`${Math.max(...sensorStats.filter(s => s.config?.sensorType === 'HC_SR04').map(s => s.max), 0).toFixed(1)} mm`} trend={<TrendingUp className="w-4 h-4 text-[var(--accent-red)]" />} icon={<Target className="w-5 h-5" />} color="var(--accent-red)" subtitle="Maximum displacement recorded" />
          <AnalyticsCard title="Total Alerts" value={summary.total.toString()} trend={summary.unacknowledged > 0 ? <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" /> : <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />} icon={<AlertTriangle className="w-5 h-5" />} color="var(--accent-blue)" subtitle={`${summary.critical} critical, ${summary.warning} warnings`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel"
        >
          <div className="panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-medium text-[var(--fg-primary)]">Time Series Analysis</h3>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 text-sm text-[var(--fg-secondary)]"><input type="checkbox" checked={overlayTraffic} onChange={(e) => setOverlayTraffic(e.target.checked)} className="w-4 h-4 accent-[var(--accent-cyan)]" /> Traffic</label>
              <label className="flex items-center gap-2 text-sm text-[var(--fg-secondary)]"><input type="checkbox" checked={overlayWeather} onChange={(e) => setOverlayWeather(e.target.checked)} className="w-4 h-4 accent-[var(--accent-blue)]" /> Weather</label>
              <label className="flex items-center gap-2 text-sm text-[var(--fg-secondary)]"><input type="checkbox" checked={overlayAlerts} onChange={(e) => setOverlayAlerts(e.target.checked)} className="w-4 h-4 accent-[var(--accent-red)]" /> Alerts</label>
            </div>
          </div>
          <div className="panel-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveChart title="Vibration (g)" unit="g" metric="vibration" color="var(--accent-cyan)" dataPoints={Math.min(500, filteredHistory.length)} height={350} data={filteredHistory.filter(p => p.sensorType === 'MPU6050')} />
              <LiveChart title="Strain (µε)" unit="µε" metric="strain" color="var(--accent-amber)" dataPoints={Math.min(500, filteredHistory.length)} height={350} data={filteredHistory.filter(p => p.sensorType === 'STRAIN')} />
              <LiveChart title="Load (kN)" unit="kN" metric="load" color="var(--accent-green)" dataPoints={Math.min(500, filteredHistory.length)} height={350} data={filteredHistory.filter(p => p.sensorType === 'LOAD_CELL')} />
              <LiveChart title="Displacement (mm)" unit="mm" metric="displacement" color="var(--accent-cyan)" dataPoints={Math.min(500, filteredHistory.length)} height={350} data={filteredHistory.filter(p => p.sensorType === 'HC_SR04')} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <CorrelationChart
            title="Traffic vs Vibration"
            subtitle={`Correlation: ${correlations.trafficVibration.toFixed(2)}`}
            xLabel="Traffic Density (%)"
            yLabel="Vibration (g)"
            color="var(--accent-cyan)"
            data={filteredHistory.filter(p => p.sensorType === 'MPU6050').map(p => ({ x: p.trafficDensity, y: p.vibration?.magnitude || 0 }))}
          />
          <CorrelationChart
            title="Traffic vs Strain"
            subtitle={`Correlation: ${correlations.trafficStrain.toFixed(2)}`}
            xLabel="Traffic Density (%)"
            yLabel="Strain (µε)"
            color="var(--accent-amber)"
            data={filteredHistory.filter(p => p.sensorType === 'STRAIN').map(p => ({ x: p.trafficDensity, y: p.strain?.strain || 0 }))}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <CorrelationChart
            title="Rainfall vs Temperature"
            subtitle={`Correlation: ${correlations.rainTemperature.toFixed(2)}`}
            xLabel="Rainfall (mm/h)"
            yLabel="Temperature (°C)"
            color="var(--accent-blue)"
            data={filteredHistory.map(p => ({ x: p.rainfall || 0, y: p.temperature || 0 }))}
          />
          <CorrelationChart
            title="Vehicle Load vs Displacement"
            subtitle={`Correlation: ${correlations.loadDisplacement.toFixed(2)}`}
            xLabel="Vehicle Load (kN)"
            yLabel="Displacement (mm)"
            color="var(--accent-green)"
            data={filteredHistory.filter(p => p.sensorType === 'HC_SR04').map(p => ({ x: p.vehicleLoad, y: p.displacement || 0 }))}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <SensorComparison sensors={sensorStats} configurations={configurations} />
          <ZoneComparison zoneHealths={zoneHealths} />
          <AlertSummaryTable alerts={alerts.slice(0, 20)} />
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, value, trend, icon, color, subtitle }: { title: string; value: string; trend: React.ReactNode; icon: React.ReactNode; color: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}/20`}>{icon}</div>
          <div className="flex-1">
            <p className="text-sm text-[var(--fg-secondary)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--fg-primary)]">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              {trend}
              <span className="text-xs text-[var(--fg-muted)]">{subtitle}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

function AlertSummaryTable({ alerts }: { alerts: any[] }) {
  return (
    <div className="panel">
      <div className="panel-header"><h3 className="font-medium text-[var(--fg-primary)]">Recent Alerts</h3></div>
      <div className="panel-content space-y-2">
        {alerts.length === 0 ? <p className="text-[var(--fg-muted)] text-center py-4">No alerts</p> : alerts.map((alert) => (
          <div key={alert.alertId} className="flex items-center gap-3 p-2 bg-[var(--bg-tertiary)] rounded-lg">
            <span className={`w-2 h-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-[var(--accent-red)]' : alert.severity === 'WARNING' ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-blue)]'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{alert.cause}</p>
              <p className="text-xs text-[var(--fg-secondary)]">{alert.sensorId} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs ${alert.severity === 'CRITICAL' ? 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]' : alert.severity === 'WARNING' ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]' : 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'}`}>
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
