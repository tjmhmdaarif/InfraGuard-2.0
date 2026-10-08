import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize, Minimize, Layers, Thermometer, Zap, Car, Cloud,
  Eye, EyeOff, Box, Target, MapPin, Radio, Play, Pause, RotateCcw,
  Settings, ChevronDown, Clock, Gauge,
} from 'lucide-react';
import { BridgeSceneWrapper } from '../three/BridgeScene';
import { useUIStore } from '../stores/uiStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useScenarioStore } from '../stores/scenarioStore';
import { applyScenarioEnvironment } from '../stores/environmentStore';
import { useSensorStore } from '../stores/sensorStore';
import { useBridgeStore } from '../stores/bridgeStore';
import { TelemetryPanel } from '../components/telemetry/TelemetryPanel';
import { TimelinePanel } from '../components/telemetry/TimelinePanel';
import { AlertsPanel } from '../components/alerts/AlertsPanel';
import { EventStreamPanel } from '../components/telemetry/EventStreamPanel';
import { SensorInspectorPanel } from '../components/sensors/SensorInspectorPanel';
import { ComponentInspectorPanel } from '../components/digital-twin/ComponentInspectorPanel';
import { ScenarioControlPanel } from '../components/scenarios/ScenarioControlPanel';
import { SensorPlacementHandler, SensorPlacementToolbar } from '../components/digital-twin/SensorPlacement';
import { ReplaySystem } from '../components/digital-twin/ReplaySystem';

const BOTTOM_PANELS = ['telemetry', 'timeline', 'alerts', 'events', 'replay'] as const;
type BottomPanel = typeof BOTTOM_PANELS[number];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function DigitalTwinPage() {
  const {
    cameraMode, cameraPreset, panels, heatmapMode, heatmapEnabled,
    showSensorMarkers, showVehicleMarkers, showZoneBoundaries, showStructuralLabels,
    togglePanel, setPanelState, setHeatmapMode, toggleHeatmap,
    toggleSensorMarkers, toggleVehicleMarkers, toggleZoneBoundaries,
    toggleStructuralLabels, setCameraMode, setCameraPreset,
  } = useUIStore();

  const { clock, isRunning, speed, play, pause, reset, setSpeed } = useSimulationStore();
  const { currentScenario, startScenario, getAllScenarios } = useScenarioStore();
  const { selectedSensorId, getConfiguration, placementMode, placementSensorType, setPlacementMode } = useSensorStore();
  const { components } = useBridgeStore();

  const [showTopControls, setShowTopControls] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<BottomPanel>('telemetry');
  const [bottomExpanded, setBottomExpanded] = useState(false);

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#080c12]">
      {/* ── 3D Canvas ── */}
      <div className="absolute inset-0 z-0">
        <BridgeSceneWrapper>
          <SensorPlacementHandler />
        </BridgeSceneWrapper>
      </div>

      {/* ── Overlay layer ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Sensor placement toolbar */}
        <SensorPlacementToolbar
          isActive={placementMode}
          sensorType={placementSensorType}
          tempPosition={null}
          onConfirm={() => setPlacementMode(false, undefined)}
          onCancel={() => setPlacementMode(false, undefined)}
          onRotate={() => {}}
          onDelete={() => {}}
        />

        {/* ── TOP TOOLBAR ── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
          <AnimatePresence mode="wait">
            {showTopControls ? (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#0f141c]/92 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl"
              >
                {/* Camera mode */}
                <ToolbarPill
                  active={cameraMode === 'perspective'}
                  onClick={() => setCameraMode(cameraMode === 'perspective' ? 'orthographic' : 'perspective')}
                  icon={cameraMode === 'perspective' ? <Box className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  label={cameraMode === 'perspective' ? 'Persp' : 'Ortho'}
                />

                <Divider />

                {/* Heatmap */}
                <HeatmapSelector mode={heatmapMode} enabled={heatmapEnabled} onChange={setHeatmapMode} onToggle={toggleHeatmap} />

                <Divider />

                {/* Overlays */}
                <ToolbarPill active={showSensorMarkers} onClick={toggleSensorMarkers} icon={<Radio className="w-3.5 h-3.5" />} label="Sensors" />
                <ToolbarPill active={showVehicleMarkers} onClick={toggleVehicleMarkers} icon={<Car className="w-3.5 h-3.5" />} label="Vehicles" />
                <ToolbarPill active={showZoneBoundaries} onClick={toggleZoneBoundaries} icon={<Layers className="w-3.5 h-3.5" />} label="Zones" />
                <ToolbarPill active={showStructuralLabels} onClick={toggleStructuralLabels} icon={<Target className="w-3.5 h-3.5" />} label="Labels" />
                <ToolbarPill active={placementMode} onClick={() => setPlacementMode(!placementMode, placementSensorType || undefined)} icon={<MapPin className="w-3.5 h-3.5" />} label="Place" />
                <ToolbarPill
                  active={panels.scenarioControl?.isOpen ?? false}
                  onClick={() => { setPanelState('componentInspector', { isOpen: false }); togglePanel('scenarioControl'); }}
                  icon={<Play className="w-3.5 h-3.5" />}
                  label="Scenarios"
                />

                <Divider />

                <button
                  onClick={() => setShowTopControls(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                  title="Hide toolbar"
                >
                  <Minimize className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="show-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowTopControls(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0f141c]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl text-xs text-white/60 hover:text-white/90 transition-colors shadow-xl"
              >
                <Settings className="w-3.5 h-3.5" />
                Controls
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT SIDE: Camera presets (vertical strip) ── */}
        {/* Positioned to avoid bottom-right SimControl panel */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-auto z-20" style={{ bottom: '220px' }}>
          {[
            { id: 'full-bridge', label: 'Full', icon: <Box className="w-3.5 h-3.5" /> },
            { id: 'front-elevation', label: 'Front', icon: <Maximize className="w-3.5 h-3.5" /> },
            { id: 'side-profile', label: 'Side', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'top-view', label: 'Top', icon: <Target className="w-3.5 h-3.5" /> },
            { id: 'deck-view', label: 'Deck', icon: <Car className="w-3.5 h-3.5" /> },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setCameraPreset(p.id as any)}
              title={p.label}
              className={`p-2 rounded-xl border transition-all ${
                cameraPreset === p.id
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-[#0f141c]/80 border-white/[0.06] text-white/40 hover:text-white/80 hover:border-white/15 hover:bg-white/5'
              } backdrop-blur-xl`}
            >
              {p.icon}
            </button>
          ))}
        </div>

        {/* ── BOTTOM-RIGHT: Unified Simulation Control Card ── */}
        <div className="absolute bottom-[88px] right-3 pointer-events-auto z-20 w-[200px]">
          <SimulationCard
            clock={clock}
            isRunning={isRunning}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSpeedChange={setSpeed}
            currentScenario={currentScenario?.currentScenario?.name}
            scenarios={getAllScenarios()}
            onScenarioSelect={(id) => {
              startScenario(id);
              const s = getAllScenarios().find((x) => x.scenarioId === id);
              if (s) applyScenarioEnvironment(s);
            }}
          />
        </div>

        {/* ── BOTTOM: Panel tabs + content ── */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-auto z-20">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 pt-1.5 pb-0 bg-[#0c1018]/95 backdrop-blur-xl border-t border-white/[0.06]">
            {BOTTOM_PANELS.map((panel) => (
              <button
                key={panel}
                onClick={() => {
                  if (activeBottomPanel === panel) {
                    setBottomExpanded(!bottomExpanded);
                  } else {
                    setActiveBottomPanel(panel);
                    setBottomExpanded(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all capitalize border-b-2 ${
                  activeBottomPanel === panel && bottomExpanded
                    ? 'text-cyan-400 border-cyan-500 bg-cyan-500/8'
                    : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/4'
                }`}
              >
                {panel}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setBottomExpanded(!bottomExpanded)}
              className="p-1 text-white/30 hover:text-white/60 transition-colors mb-1"
            >
              <motion.div animate={{ rotate: bottomExpanded ? 180 : 0 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          </div>

          {/* Panel content */}
          <AnimatePresence>
            {bottomExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 220, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-[#0c1018]/95 backdrop-blur-xl border-t border-white/[0.04]"
              >
                <div className="h-full overflow-y-auto p-3">
                  {activeBottomPanel === 'telemetry' && <TelemetryPanel />}
                  {activeBottomPanel === 'timeline' && <TimelinePanel />}
                  {activeBottomPanel === 'alerts' && <AlertsPanel />}
                  {activeBottomPanel === 'events' && <EventStreamPanel />}
                  {activeBottomPanel === 'replay' && <ReplaySystem />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Side inspector panels ── */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {panels.sensorInspector?.isOpen && selectedSensorId && (
          <div className="absolute right-3 top-14 w-72 max-h-[calc(100vh-200px)] pointer-events-auto">
            <SensorInspectorPanel
              sensorId={selectedSensorId}
              onClose={() => setPanelState('sensorInspector', { isOpen: false })}
            />
          </div>
        )}
        {panels.componentInspector?.isOpen && (
          <div className="absolute left-3 top-14 w-72 max-h-[calc(100vh-200px)] pointer-events-auto">
            <ComponentInspectorPanel
              components={components}
              onClose={() => setPanelState('componentInspector', { isOpen: false })}
            />
          </div>
        )}
        {panels.scenarioControl?.isOpen && (
          <div className="absolute left-3 top-14 w-88 max-w-[calc(100vw-1.5rem)] pointer-events-auto" style={{ width: '380px' }}>
            <ScenarioControlPanel onClose={() => setPanelState('scenarioControl', { isOpen: false })} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toolbar pill ──────────────────────────────────────────────────────────────
function ToolbarPill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
          : 'text-white/50 hover:text-white/85 hover:bg-white/6 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.08] mx-0.5" />;
}

// ─── Heatmap selector ──────────────────────────────────────────────────────────
function HeatmapSelector({ mode, enabled, onChange, onToggle }: any) {
  const modes = [
    { value: 'none', label: 'Off' },
    { value: 'health', label: 'Health' },
    { value: 'vibration', label: 'Vibration' },
    { value: 'strain', label: 'Strain' },
    { value: 'load', label: 'Load' },
    { value: 'displacement', label: 'Disp' },
    { value: 'temperature', label: 'Temp' },
  ];
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-all text-xs border ${
          enabled
            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
            : 'text-white/40 border-transparent hover:bg-white/5 hover:text-white/70'
        }`}
        title="Toggle heatmap"
      >
        {enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      <select
        value={mode}
        onChange={(e) => onChange(e.target.value as any)}
        disabled={!enabled}
        className="bg-transparent border-none text-xs text-white/60 focus:outline-none cursor-pointer appearance-none pr-1"
      >
        {modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  );
}

// ─── Unified Simulation Control Card ──────────────────────────────────────────
function SimulationCard({ clock, isRunning, speed, onPlay, onPause, onReset, onSpeedChange, currentScenario, scenarios, onScenarioSelect }: any) {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  return (
    <div className="bg-[#0f141c]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Simulation</span>
      </div>

      {/* Timer */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
        <Clock className="w-3 h-3 text-white/25 flex-shrink-0" />
        <span className="font-mono text-sm font-bold text-white tabular-nums tracking-wider">
          {formatTime(clock.time)}
        </span>
      </div>

      {/* Controls */}
      <div className="px-3 pb-2.5 flex items-center gap-2">
        <button
          onClick={isRunning ? onPause : onPlay}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg border border-white/[0.07] text-white/35 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-white/25" />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="bg-transparent border-none text-xs text-white/60 focus:outline-none cursor-pointer appearance-none"
          >
            {[0.25, 0.5, 1, 2, 5, 10].map((v) => <option key={v} value={v}>{v}x</option>)}
          </select>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="border-t border-white/[0.05] px-3 py-2">
        <button
          onClick={() => setScenarioOpen(!scenarioOpen)}
          className="w-full flex items-center justify-between text-[10px] text-white/40 hover:text-white/70 transition-colors"
        >
          <span className="truncate">{currentScenario || 'No scenario'}</span>
          <motion.div animate={{ rotate: scenarioOpen ? 180 : 0 }}>
            <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
          </motion.div>
        </button>
        <AnimatePresence>
          {scenarioOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mt-1.5 space-y-0.5"
            >
              {scenarios.map((s: any) => (
                <button
                  key={s.scenarioId}
                  onClick={() => { onScenarioSelect(s.scenarioId); setScenarioOpen(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-white/60 hover:text-white hover:bg-white/6 transition-colors truncate"
                >
                  {s.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
