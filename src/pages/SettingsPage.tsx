import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Sliders, Palette, Database, Cpu, RotateCcw,
  Save, Download, Upload, Check, AlertTriangle, Play, Pause, Network
} from 'lucide-react';
import { useSettingsStore, useSimulationSettings, useRenderSettings, useTelemetrySettings, useUISettings } from '../stores/settingsStore';

const TABS = [
  { id: 'simulation', label: 'Simulation', icon: <Sliders className="w-4 h-4" /> },
  { id: 'render', label: 'Rendering', icon: <Palette className="w-4 h-4" /> },
  { id: 'telemetry', label: 'Telemetry', icon: <Database className="w-4 h-4" /> },
  { id: 'connections', label: 'Connections', icon: <Network className="w-4 h-4" /> },
  { id: 'ui', label: 'Interface', icon: <Cpu className="w-4 h-4" /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('simulation');
  const [saved, setSaved] = useState(false);
  const { simulation, render, telemetry, ui, connections, updateSimulationSettings, updateRenderSettings, updateTelemetrySettings, updateUISettings, updateConnectionSettings, resetToDefaults, exportSettings, importSettings } = useSettingsStore();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infraguard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = importSettings(ev.target?.result as string);
      if (success) setSaved(true);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Settings</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Configure simulation, rendering, telemetry and UI preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)] flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)] flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={resetToDefaults} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)] flex items-center gap-2 text-[var(--accent-red)]">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSave} disabled={saved} className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </motion.div>

        <div className="panel">
          <div className="panel-header">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]'
                      : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-content">
            <AnimatePresence mode="wait">
              {activeTab === 'simulation' && (
                <motion.div
                  key="simulation"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-[var(--fg-primary)] text-lg">Simulation Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingItem label="Baseline Vibration (g)" value={simulation.baselineVibration} onChange={(v) => updateSimulationSettings({ baselineVibration: v })} step={0.001} min={0.001} max={0.1} />
                    <SettingItem label="Baseline Strain (µε)" value={simulation.baselineStrain} onChange={(v) => updateSimulationSettings({ baselineStrain: v })} step={1} min={1} max={100} />
                    <SettingItem label="Baseline Displacement (mm)" value={simulation.baselineDisplacement} onChange={(v) => updateSimulationSettings({ baselineDisplacement: v })} step={0.1} min={0.1} max={10} />
                    <SettingItem label="Traffic Influence Factor" value={simulation.trafficInfluence} onChange={(v) => updateSimulationSettings({ trafficInfluence: v })} step={0.1} min={0} max={5} />
                    <SettingItem label="Weather Influence Factor" value={simulation.weatherInfluence} onChange={(v) => updateSimulationSettings({ weatherInfluence: v })} step={0.1} min={0} max={3} />
                    <SettingItem label="Noise Level" value={simulation.noiseLevel} onChange={(v) => updateSimulationSettings({ noiseLevel: v })} step={0.01} min={0} max={0.5} />
                  </div>

                  <h4 className="font-semibold text-[var(--fg-primary)] pt-4 border-t border-[var(--border-primary)]">Health Weights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(simulation.healthWeights).map(([key, value]) => (
                      <SettingItem key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} (%)`} value={value * 100} onChange={(v) => updateSimulationSettings({ healthWeights: { ...simulation.healthWeights, [key]: v / 100 } })} step={5} min={0} max={100} />
                    ))}
                  </div>

                  <h4 className="font-semibold text-[var(--fg-primary)] pt-4 border-t border-[var(--border-primary)]">Anomaly Thresholds</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SettingItem label="Vibration (g)" value={simulation.anomalyThresholds.vibration} onChange={(v) => updateSimulationSettings({ anomalyThresholds: { ...simulation.anomalyThresholds, vibration: v } })} step={0.1} min={0.5} max={10} />
                    <SettingItem label="Strain (µε)" value={simulation.anomalyThresholds.strain} onChange={(v) => updateSimulationSettings({ anomalyThresholds: { ...simulation.anomalyThresholds, strain: v } })} step={10} min={50} max={500} />
                    <SettingItem label="Displacement (mm)" value={simulation.anomalyThresholds.displacement} onChange={(v) => updateSimulationSettings({ anomalyThresholds: { ...simulation.anomalyThresholds, displacement: v } })} step={1} min={2} max={50} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'render' && (
                <motion.div
                  key="render"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-[var(--fg-primary)] text-lg">Rendering Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Antialiasing" checked={render.antialias} onChange={() => updateRenderSettings({ antialias: !render.antialias })} />
                    <ToggleItem label="Shadows" checked={render.shadows} onChange={() => updateRenderSettings({ shadows: !render.shadows })} />
                    <ToggleItem label="Bloom Effect" checked={render.bloomEnabled} onChange={() => updateRenderSettings({ bloomEnabled: !render.bloomEnabled })} />
                    <ToggleItem label="SSAO" checked={render.ssaoEnabled} onChange={() => updateRenderSettings({ ssaoEnabled: !render.ssaoEnabled })} />
                    <ToggleItem label="LOD Enabled" checked={render.lodEnabled} onChange={() => updateRenderSettings({ lodEnabled: !render.lodEnabled })} />
                    <ToggleItem label="Frustum Culling" checked={render.frustumCulling} onChange={() => updateRenderSettings({ frustumCulling: !render.frustumCulling })} />
                    <ToggleItem label="Instancing" checked={render.instancingEnabled} onChange={() => updateRenderSettings({ instancingEnabled: !render.instancingEnabled })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingItem label="Exposure" value={render.exposure} onChange={(v) => updateRenderSettings({ exposure: v })} step={0.1} min={0.5} max={3} />
                    <SettingItem label="Max Pixel Ratio" value={render.maxPixelRatio} onChange={(v) => updateRenderSettings({ maxPixelRatio: v })} step={0.5} min={1} max={4} />
                    <SettingItem label="Bloom Strength" value={render.bloomStrength} onChange={(v) => updateRenderSettings({ bloomStrength: v })} step={0.1} min={0} max={3} />
                    <SettingItem label="Bloom Radius" value={render.bloomRadius} onChange={(v) => updateRenderSettings({ bloomRadius: v })} step={0.1} min={0} max={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Tone Mapping</label>
                    <select
                      value={render.toneMapping}
                      onChange={(e) => updateRenderSettings({ toneMapping: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                    >
                      <option value="none">None</option>
                      <option value="aces">ACES</option>
                      <option value="reinhard">Reinhard</option>
                      <option value="cineon">Cineon</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {activeTab === 'telemetry' && (
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-[var(--fg-primary)] text-lg">Telemetry Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Telemetry Frequency</label>
                      <select
                        value={telemetry.frequency}
                        onChange={(e) => updateTelemetrySettings({ frequency: Number(e.target.value) as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value={1}>1 Hz</option>
                        <option value={5}>5 Hz</option>
                        <option value={10}>10 Hz</option>
                        <option value={20}>20 Hz</option>
                        <option value={50}>50 Hz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Noise Mode</label>
                      <select
                        value={telemetry.noiseMode}
                        onChange={(e) => updateTelemetrySettings({ noiseMode: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value="OFF">Off</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <ToggleItem label="Enable Filtering" checked={telemetry.enableFiltering} onChange={() => updateTelemetrySettings({ enableFiltering: !telemetry.enableFiltering })} />
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Filter Type</label>
                      <select
                        value={telemetry.filterType}
                        onChange={(e) => updateTelemetrySettings({ filterType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value="NONE">None</option>
                        <option value="MOVING_AVERAGE">Moving Average</option>
                        <option value="LOW_PASS">Low Pass</option>
                        <option value="MEDIAN">Median</option>
                        <option value="EMA">Exponential Moving Average</option>
                      </select>
                    </div>
                    <SettingItem label="Filter Window Size" value={telemetry.filterWindowSize} onChange={(v) => updateTelemetrySettings({ filterWindowSize: v })} step={1} min={1} max={50} />
                    <SettingItem label="Filter Alpha" value={telemetry.filterAlpha} onChange={(v) => updateTelemetrySettings({ filterAlpha: v })} step={0.05} min={0.05} max={0.5} />
                    <SettingItem label="Max History Length" value={telemetry.maxHistoryLength} onChange={(v) => updateTelemetrySettings({ maxHistoryLength: v })} step={1000} min={1000} max={100000} />
                    <ToggleItem label="Enable Recording" checked={telemetry.enableRecording} onChange={() => updateTelemetrySettings({ enableRecording: !telemetry.enableRecording })} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'connections' && (
                <motion.div
                  key="connections"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--fg-primary)]">MQTT and database endpoints</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--fg-secondary)]">
                      Connection profiles are saved in this browser. This frontend does not establish a broker or database connection. Add a secured server-side connector before sending credentials or telemetry to a live service.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <Network className="h-5 w-5 text-[var(--accent-cyan)]" />
                        <div>
                          <h4 className="font-semibold text-[var(--fg-primary)]">MQTT broker</h4>
                          <p className="text-xs text-[var(--fg-muted)]">WebSocket transport endpoint and subscription topic</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--fg-primary)]">Broker WebSocket URL</span>
                          <input
                            type="url"
                            value={connections.mqttWebSocketUrl}
                            onChange={(event) => updateConnectionSettings({ mqttWebSocketUrl: event.target.value })}
                            placeholder="wss://broker.example.com:8084/mqtt"
                            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--fg-primary)]">Telemetry topic</span>
                          <input
                            type="text"
                            value={connections.mqttTopic}
                            onChange={(event) => updateConnectionSettings({ mqttTopic: event.target.value })}
                            placeholder="infraguard/+/telemetry"
                            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
                          />
                        </label>
                      </div>
                    </section>

                    <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <Database className="h-5 w-5 text-[var(--accent-cyan)]" />
                        <div>
                          <h4 className="font-semibold text-[var(--fg-primary)]">Time-series database</h4>
                          <p className="text-xs text-[var(--fg-muted)]">InfluxDB-compatible HTTP endpoint details</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--fg-primary)]">Database API URL</span>
                          <input
                            type="url"
                            value={connections.databaseEndpoint}
                            onChange={(event) => updateConnectionSettings({ databaseEndpoint: event.target.value })}
                            placeholder="https://influx.example.com"
                            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
                          />
                        </label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-[var(--fg-primary)]">Organization</span>
                            <input
                              type="text"
                              value={connections.databaseOrganization}
                              onChange={(event) => updateConnectionSettings({ databaseOrganization: event.target.value })}
                              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-[var(--fg-primary)]">Bucket</span>
                            <input
                              type="text"
                              value={connections.databaseBucket}
                              onChange={(event) => updateConnectionSettings({ databaseBucket: event.target.value })}
                              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--fg-primary)]"
                            />
                          </label>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div role="status" className="flex items-start gap-3 rounded-lg border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/5 p-4 text-sm text-[var(--fg-secondary)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
                    <p>Endpoint settings are persisted locally and included in settings exports. Passwords and API tokens are intentionally not collected or saved in the browser.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ui' && (
                <motion.div
                  key="ui"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-[var(--fg-primary)] text-lg">Interface Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Theme</label>
                      <select
                        value={ui.theme}
                        onChange={(e) => updateUISettings({ theme: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Units</label>
                      <select
                        value={ui.units}
                        onChange={(e) => updateUISettings({ units: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value="metric">Metric</option>
                        <option value="imperial">Imperial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--fg-primary)] mb-2">Time Format</label>
                      <select
                        value={ui.timeFormat}
                        onChange={(e) => updateUISettings({ timeFormat: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                      >
                        <option value="12h">12-hour</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                    <ToggleItem label="Show Tooltips" checked={ui.showTooltips} onChange={() => updateUISettings({ showTooltips: !ui.showTooltips })} />
                    <ToggleItem label="Enable Animations" checked={ui.animationsEnabled} onChange={() => updateUISettings({ animationsEnabled: !ui.animationsEnabled })} />
                    <ToggleItem label="Reduced Motion" checked={ui.reducedMotion} onChange={() => updateUISettings({ reducedMotion: !ui.reducedMotion })} />
                    <ToggleItem label="Compact Mode" checked={ui.compactMode} onChange={() => updateUISettings({ compactMode: !ui.compactMode })} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ label, value, onChange, step, min, max }: { label: string; value: number; onChange: (v: number) => void; step: number; min: number; max: number }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--fg-primary)]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="mt-1 w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
      />
    </label>
  );
}

function ToggleItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-[var(--accent-cyan)]"
      />
      <span className="text-sm font-medium text-[var(--fg-primary)]">{label}</span>
    </label>
  );
}
