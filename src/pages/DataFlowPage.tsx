import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database, Cpu, Radio, Zap, Target, CheckCircle, AlertTriangle, XCircle,
  Loader2, Filter, Settings,
  Activity, SlidersHorizontal, Pause, Play
} from 'lucide-react';
import { useSensorStore } from '../stores/sensorStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import type { SensorConfiguration, TelemetryPacket } from '../types';

const PIPELINE_STAGES = [
  { id: 'raw', label: 'LIVE READING', icon: <Radio className="w-5 h-5" />, description: 'Latest value reported by the selected sensor' },
  { id: 'calibrate', label: 'CALIBRATION PREVIEW', icon: <Settings className="w-5 h-5" />, description: 'Configured offset and scale applied to the preview' },
  { id: 'filter', label: 'FILTER PREVIEW', icon: <Filter className="w-5 h-5" />, description: 'Moving average over the selected recent samples' },
  { id: 'normalize', label: 'ENGINEERING UNIT', icon: <Target className="w-5 h-5" />, description: 'Live reading expressed in the sensor unit' },
  { id: 'influence', label: 'SIMULATION\nINFLUENCE', icon: <Cpu className="w-5 h-5" />, description: 'Traffic, weather, anomalies' },
  { id: 'anomaly', label: 'ANOMALY\nDETECTION', icon: <AlertTriangle className="w-5 h-5" />, description: 'Rule-based threshold check' },
  { id: 'health', label: 'HEALTH\nSCORING', icon: <Zap className="w-5 h-5" />, description: 'Weighted composite score' },
  { id: 'twin', label: 'DIGITAL TWIN', icon: <Database className="w-5 h-5" />, description: '3D visualization update' },
  { id: 'alert', label: 'ALERT\nGENERATION', icon: <AlertTriangle className="w-5 h-5" />, description: 'Threshold breach notification' },
];

export function DataFlowPage() {
  const configurations = useSensorStore((state) => state.configurations);
  const calibrationProfiles = useSensorStore((state) => state.calibrationProfiles);
  const latestPackets = useTelemetryStore((state) => state.latestPackets);
  const history = useTelemetryStore((state) => state.history);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [filterWindow, setFilterWindow] = useState(5);
  const [previewOverrides, setPreviewOverrides] = useState<Map<string, { zeroOffset: number; scaleFactor: number }>>(new Map());
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.5);
  const [configurationOpen, setConfigurationOpen] = useState(false);
  const [following, setFollowing] = useState(true);
  const [heldTelemetry, setHeldTelemetry] = useState<TelemetryPacket | null>(null);
  const [clock, setClock] = useState(0);

  const firstSensorId = configurations.keys().next().value ?? null;
  const activeSensorId = selectedSensorId && configurations.has(selectedSensorId)
    ? selectedSensorId
    : firstSensorId;
  const sensor = activeSensorId ? configurations.get(activeSensorId) ?? null : null;
  const latestTelemetry = activeSensorId ? latestPackets.get(activeSensorId) ?? null : null;
  const telemetry = following || heldTelemetry?.sensorId !== activeSensorId
    ? latestTelemetry
    : heldTelemetry;
  const calibrationProfile = sensor
    ? calibrationProfiles.get(sensor.calibrationProfileId)
    : undefined;
  const sensorPreview = activeSensorId ? previewOverrides.get(activeSensorId) : undefined;
  const zeroOffset = sensorPreview?.zeroOffset ?? calibrationProfile?.zeroOffset ?? 0;
  const scaleFactor = sensorPreview?.scaleFactor ?? calibrationProfile?.scaleFactor ?? 1;
  const sensorHistory = useMemo(
    () => activeSensorId
      ? history.filter((packet) => packet.sensorId === activeSensorId).slice(-filterWindow)
      : [],
    [history, activeSensorId, filterWindow],
  );
  const isLive = Boolean(
    latestTelemetry && clock > 0 && clock - new Date(latestTelemetry.timestamp).getTime() < 2500,
  );

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const pipelineData = useMemo(() => {
    if (!sensor || !telemetry) return PIPELINE_STAGES.map((s) => ({ ...s, value: '—', status: 'idle' }));

    const rawValue = getRawValue(sensor, telemetry);
    if (rawValue === null) {
      return PIPELINE_STAGES.map((stage) => ({ ...stage, value: 'Reading unavailable', status: 'idle' }));
    }
    const calibrated = (rawValue - zeroOffset) * scaleFactor + (calibrationProfile?.offset ?? 0);
    const recentSamples = sensorHistory
      .map((packet) => getRawValue(sensor, packet))
      .filter((value): value is number => value !== null)
      .map((value) => (value - zeroOffset) * scaleFactor + (calibrationProfile?.offset ?? 0));
    const filtered = recentSamples.length > 0
      ? recentSamples.reduce((total, value) => total + value, 0) / recentSamples.length
      : calibrated;
    const normalized = filtered;
    const anomalyScore = telemetry.anomalyScore;
    const healthScore = telemetry.healthScore;
    const anomalyTriggered = anomalyScore >= anomalyThreshold;
    const currentValue = rawValue;
    const unit = getUnit(sensor);

    return [
      { ...PIPELINE_STAGES[0], value: `${currentValue.toFixed(3)} ${unit}`, status: 'complete', unit },
      { ...PIPELINE_STAGES[1], value: `${calibrated.toFixed(3)} ${unit}`, status: 'complete', unit },
      { ...PIPELINE_STAGES[2], value: `${filtered.toFixed(3)} ${unit}`, status: 'complete', unit },
      { ...PIPELINE_STAGES[3], value: `${normalized.toFixed(3)} ${unit}`, status: 'complete', unit },
      { ...PIPELINE_STAGES[4], value: `${telemetry.trafficDensity.toFixed(0)}% traffic · ${telemetry.weatherCondition}`, status: 'complete', unit: 'conditions' },
      { ...PIPELINE_STAGES[5], value: `${(anomalyScore * 100).toFixed(1)}% / ${(anomalyThreshold * 100).toFixed(0)}%`, status: telemetry.status === 'CRITICAL' ? 'critical' : anomalyTriggered || telemetry.status === 'WARNING' ? 'warning' : 'complete', unit: 'threshold' },
      { ...PIPELINE_STAGES[6], value: `${healthScore.toFixed(0)}%`, status: healthScore < 60 ? 'warning' : healthScore < 90 ? 'caution' : 'complete', unit: 'health' },
      { ...PIPELINE_STAGES[7], value: new Date(telemetry.timestamp).toLocaleTimeString(), status: 'complete', unit: 'updated' },
      { ...PIPELINE_STAGES[8], value: anomalyTriggered ? 'THRESHOLD BREACHED' : telemetry.status, status: telemetry.status === 'CRITICAL' ? 'critical' : anomalyTriggered || telemetry.status === 'WARNING' ? 'warning' : 'complete', unit: 'alert' },
    ];
  }, [sensor, telemetry, sensorHistory, zeroOffset, scaleFactor, calibrationProfile, anomalyThreshold]);

  const statusIcons = {
    complete: <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />,
    critical: <XCircle className="w-4 h-4 text-[var(--accent-red)]" />,
    caution: <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />,
    idle: <Loader2 className="w-4 h-4 text-[var(--fg-muted)] animate-spin" />,
  };

  const statusColors = {
    complete: 'text-[var(--accent-green)]',
    warning: 'text-[var(--accent-amber)]',
    critical: 'text-[var(--accent-red)]',
    caution: 'text-[var(--accent-amber)]',
    idle: 'text-[var(--fg-muted)]',
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Data Flow Inspector</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Trace telemetry through the processing pipeline</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeSensorId ?? ''}
              onChange={(e) => {
                setSelectedSensorId(e.target.value || null);
                setFollowing(true);
                setHeldTelemetry(null);
              }}
              aria-label="Selected sensor"
              disabled={configurations.size === 0}
              className="min-w-[200px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] disabled:opacity-60"
            >
              {configurations.size === 0 && <option value="">No sensors configured</option>}
              {Array.from(configurations.values()).map((s) => (
                <option key={s.sensorId} value={s.sensorId}>{s.sensorId} ({s.sensorType})</option>
              ))}
            </select>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${isLive ? 'border-[var(--accent-green)]/30 text-[var(--accent-green)]' : 'border-[var(--border-primary)] text-[var(--fg-muted)]'}`}>
              <Activity className="h-4 w-4" />
              {isLive ? 'Live stream' : 'Waiting for telemetry'}
            </span>
            <button
              type="button"
              disabled={!latestTelemetry}
              onClick={() => {
                if (following) setHeldTelemetry(latestTelemetry);
                setFollowing((value) => !value);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--fg-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {following ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {following ? 'Pause view' : 'Resume live'}
            </button>
            <button
              type="button"
              aria-expanded={configurationOpen}
              onClick={() => setConfigurationOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Preview settings
            </button>
          </div>
        </motion.div>

        {configurationOpen && (
          <section className="panel" aria-label="Data flow preview settings">
            <div className="panel-header">
              <h2 className="font-medium text-[var(--fg-primary)]">Preview settings</h2>
              <p className="mt-1 text-sm text-[var(--fg-secondary)]">
                These controls change this inspector only. They do not modify sensor profiles or simulation output.
              </p>
            </div>
            <div className="panel-content grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm text-[var(--fg-primary)]">
                <span className="block">Moving average window: {filterWindow} samples</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={filterWindow}
                  onChange={(event) => setFilterWindow(Number(event.target.value))}
                  className="w-full accent-[var(--accent-cyan)]"
                />
              </label>
              <label className="space-y-2 text-sm text-[var(--fg-primary)]">
                <span className="block">Zero offset: {zeroOffset.toFixed(2)} {sensor ? getUnit(sensor) : ''}</span>
                <input
                  type="number"
                  value={zeroOffset}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (activeSensorId && Number.isFinite(value)) {
                      setPreviewOverrides((current) => new Map(current).set(activeSensorId, {
                        zeroOffset: value,
                        scaleFactor,
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2"
                />
              </label>
              <label className="space-y-2 text-sm text-[var(--fg-primary)]">
                <span className="block">Scale factor: {scaleFactor.toFixed(2)}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={scaleFactor}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (activeSensorId && Number.isFinite(value) && value >= 0.01) {
                      setPreviewOverrides((current) => new Map(current).set(activeSensorId, {
                        zeroOffset,
                        scaleFactor: value,
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2"
                />
              </label>
              <label className="space-y-2 text-sm text-[var(--fg-primary)]">
                <span className="block">Anomaly threshold: {(anomalyThreshold * 100).toFixed(0)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={anomalyThreshold}
                  onChange={(event) => setAnomalyThreshold(Number(event.target.value))}
                  className="w-full accent-[var(--accent-cyan)]"
                />
              </label>
            </div>
          </section>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel"
        >
          <div className="panel-header">
            <h3 className="font-medium text-[var(--fg-primary)]">Telemetry Pipeline</h3>
            <p className="text-sm text-[var(--fg-secondary)]">Sensor: {sensor?.sensorId || 'Select a sensor'} • Type: {sensor?.sensorType || '—'} • Source: {sensor?.dataSource || '—'}</p>
          </div>
          <div className="panel-content">
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--border-primary)] -translate-x-1/2 hidden lg:block" />
              <div className="space-y-4">
                {pipelineData.map((stage, index) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[stage.status]} bg-opacity-10 border border-current/20`}>
                        {statusIcons[stage.status]}
                      </div>
                      {index < pipelineData.length - 1 && (
                        <div className="absolute left-3.5 top-10 bottom-[-4px] w-0.5 bg-[var(--border-primary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-[var(--fg-primary)] flex items-center gap-2">
                            {stage.icon}
                            {stage.label.replace(/\n/g, ' ')}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[stage.status]} bg-opacity-10`}>
                            {stage.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--fg-secondary)] mb-3">{stage.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-mono text-[var(--fg-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded">{stage.value}</span>
                          <span className="text-[var(--fg-muted)]">{stage.unit}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <DetailCard title="Live Sensor Reading" icon={<Radio className="w-5 h-5" />} color="var(--accent-blue)">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Sensor ID</span><span className="font-mono">{sensor?.sensorId ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Type</span><span>{sensor?.sensorType ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Current reading</span><span className="font-mono">{sensor && telemetry && getRawValue(sensor, telemetry) !== null ? `${getRawValue(sensor, telemetry)?.toFixed(3)} ${getUnit(sensor)}` : '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Timestamp</span><span>{telemetry ? new Date(telemetry.timestamp).toLocaleTimeString() : '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Stream state</span><span>{!latestTelemetry ? 'No packets' : isLive ? 'Live' : 'Stale'}</span></div>
            </div>
          </DetailCard>

          <DetailCard title="Calibration Profile" icon={<Settings className="w-5 h-5" />} color="var(--accent-amber)">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Profile ID</span><span className="font-mono">{sensor?.calibrationProfileId ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Configured zero offset</span><span>{calibrationProfile?.zeroOffset ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Configured scale</span><span>{calibrationProfile?.scaleFactor ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Sampling rate</span><span>{calibrationProfile ? `${calibrationProfile.samplingRate} Hz` : '—'}</span></div>
              <p className="pt-2 text-xs text-[var(--fg-muted)]">The preview adjustments above are local to this page.</p>
            </div>
          </DetailCard>

          <DetailCard title="Quality Metrics" icon={<Target className="w-5 h-5" />} color="var(--accent-green)">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Signal strength</span><span>{telemetry ? `${telemetry.signalStrength.toFixed(0)}%` : '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Battery level</span><span>{telemetry ? `${telemetry.batteryLevel.toFixed(0)}%` : '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Noise</span><span>{telemetry ? `${(telemetry.quality.noise * 100).toFixed(1)}%` : '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--fg-muted)]">Packet loss</span><span>{telemetry ? `${(telemetry.quality.packetLoss * 100).toFixed(1)}%` : '—'}</span></div>
            </div>
          </DetailCard>
        </motion.div>
      </div>
    </div>
  );
}

function getRawValue(sensor: SensorConfiguration, telemetry: TelemetryPacket): number | null {
  switch (sensor.sensorType) {
    case 'MPU6050':
      return telemetry.vibration?.magnitude ?? null;
    case 'STRAIN':
    case 'HX711':
      return telemetry.strain?.strain ?? null;
    case 'LOAD_CELL':
      return telemetry.load?.load ?? null;
    case 'DHT22':
      return telemetry.temperature ?? null;
    case 'RAIN':
      return telemetry.rainfall ?? null;
    case 'HC_SR04':
      return telemetry.distance ?? null;
  }
}

function getUnit(sensor: SensorConfiguration): string {
  switch (sensor.sensorType) {
    case 'MPU6050':
      return 'g';
    case 'STRAIN':
      return 'µε';
    case 'HX711':
      return 'µε';
    case 'LOAD_CELL':
      return 'kN';
    case 'DHT22':
      return '°C';
    case 'RAIN':
      return 'mm/h';
    case 'HC_SR04':
      return 'mm';
  }
}

function DetailCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-header">
        <h3 className="font-medium text-[var(--fg-primary)] flex items-center gap-2">
          <span className={`p-2 rounded ${color}/20`}>{icon}</span>
          {title}
        </h3>
      </div>
      <div className="panel-content">{children}</div>
    </motion.div>
  );
}
