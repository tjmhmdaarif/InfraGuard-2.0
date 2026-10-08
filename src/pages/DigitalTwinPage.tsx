import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Maximize,
  Minimize,
  Layers,
  Thermometer,
  Zap,
  Car,
  Cloud,
  Settings,
  Eye,
  EyeOff,
  Box,
  Target,
  MapPin,
  Radio,
  Play,
} from 'lucide-react';
import { BridgeSceneWrapper } from '../three/BridgeScene';
import { useUIStore } from '../stores/uiStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useScenarioStore } from '../stores/scenarioStore';
import { applyScenarioEnvironment } from '../stores/environmentStore';
import { useSensorStore } from '../stores/sensorStore';
import { useBridgeStore } from '../stores/bridgeStore';
import { SimulationControls } from '../components/digital-twin/SimulationControls';
import { TelemetryPanel } from '../components/telemetry/TelemetryPanel';
import { TimelinePanel } from '../components/telemetry/TimelinePanel';
import { AlertsPanel } from '../components/alerts/AlertsPanel';
import { EventStreamPanel } from '../components/telemetry/EventStreamPanel';
import { SensorInspectorPanel } from '../components/sensors/SensorInspectorPanel';
import { ComponentInspectorPanel } from '../components/digital-twin/ComponentInspectorPanel';
import { ScenarioControlPanel } from '../components/scenarios/ScenarioControlPanel';
import { SensorPlacementHandler, SensorPlacementToolbar, useSensorPlacement } from '../components/digital-twin/SensorPlacement';
import { ReplaySystem } from '../components/digital-twin/ReplaySystem';

export function DigitalTwinPage() {
  const {
    currentView,
    cameraMode,
    cameraPreset,
    panels,
    heatmapMode,
    heatmapEnabled,
    showSensorMarkers,
    showVehicleMarkers,
    showZoneBoundaries,
    showStructuralLabels,
    togglePanel,
    setPanelState,
    setHeatmapMode,
    toggleHeatmap,
    toggleSensorMarkers,
    toggleVehicleMarkers,
    toggleZoneBoundaries,
    toggleStructuralLabels,
    setCameraMode,
    setCameraPreset,
  } = useUIStore();

  const { clock, isRunning, speed, play, pause, reset, setSpeed } = useSimulationStore();
  const { currentScenario, startScenario, pauseScenario, resumeScenario, stopScenario, getAllScenarios } = useScenarioStore();
  const { selectedSensorId, getConfiguration, placementMode, placementSensorType, setPlacementMode } = useSensorStore();
  const { components } = useBridgeStore();
  const [placementState, setPlacementState] = useState<{ isActive: boolean; sensorType: string | null; tempPos: { x: number; y: number; z: number } | null }>({ isActive: false, sensorType: null, tempPos: null });

  const [showTopControls, setShowTopControls] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<'telemetry' | 'timeline' | 'alerts' | 'events'>('telemetry');

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <BridgeSceneWrapper>
          <SensorPlacementHandler />
        </BridgeSceneWrapper>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <SensorPlacementToolbar
          isActive={placementMode}
          sensorType={placementSensorType}
          tempPosition={placementState?.tempPos ?? null}
          onConfirm={() => {
            setPlacementMode(false, undefined);
            setPlacementState({ isActive: false, sensorType: null, tempPos: null });
          }}
          onCancel={() => {
            setPlacementMode(false, undefined);
            setPlacementState({ isActive: false, sensorType: null, tempPos: null });
          }}
          onRotate={() => {}}
          onDelete={() => {}}
        />

        <div className="absolute top-4 left-4 right-4 pointer-events-auto">
          <TopToolbar
            show={showTopControls}
            onToggle={() => setShowTopControls(!showTopControls)}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            cameraPreset={cameraPreset}
            onCameraPresetChange={setCameraPreset}
            scenarioControlOpen={panels.scenarioControl?.isOpen ?? false}
            onScenarioControlToggle={() => {
              setPanelState('componentInspector', { isOpen: false });
              togglePanel('scenarioControl');
            }}
            heatmapMode={heatmapMode}
            heatmapEnabled={heatmapEnabled}
            onHeatmapChange={setHeatmapMode}
            onHeatmapToggle={toggleHeatmap}
            showSensorMarkers={showSensorMarkers}
            onSensorMarkersToggle={toggleSensorMarkers}
            showVehicleMarkers={showVehicleMarkers}
            onVehicleMarkersToggle={toggleVehicleMarkers}
            showZoneBoundaries={showZoneBoundaries}
            onZoneBoundariesToggle={toggleZoneBoundaries}
            showStructuralLabels={showStructuralLabels}
            onStructuralLabelsToggle={toggleStructuralLabels}
            placementMode={placementMode}
            placementSensorType={placementSensorType}
            setPlacementMode={setPlacementMode}
          />
        </div>

        <div className="absolute top-4 right-4 pointer-events-auto flex flex-col gap-2">
          <CameraPresetButtons
            currentPreset={cameraPreset}
            onPresetChange={setCameraPreset}
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <BottomPanelContainer
            activePanel={activeBottomPanel}
            onPanelChange={setActiveBottomPanel}
            panels={panels}
            togglePanel={togglePanel}
          />
          {activeBottomPanel === 'replay' && (
            <div className="mt-2 p-4 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-primary)] rounded-xl max-h-[300px] overflow-y-auto">
              <ReplaySystem />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col gap-2">
          <SimulationControls
            clock={clock}
            isRunning={isRunning}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSpeedChange={setSpeed}
            currentScenario={currentScenario?.currentScenario?.name || 'None'}
            onScenarioSelect={(scenarioId: string) => {
              startScenario(scenarioId);
              const scenario = getAllScenarios().find((item) => item.scenarioId === scenarioId);
              if (scenario) applyScenarioEnvironment(scenario);
            }}
            scenarios={getAllScenarios()}
          />
        </div>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        <SidePanels
          selectedSensorId={selectedSensorId}
          getConfiguration={getConfiguration}
          components={components}
        />
      </div>
    </div>
  );
}

function TopToolbar({
  show,
  onToggle,
  cameraMode,
  onCameraModeChange,
  cameraPreset,
  onCameraPresetChange,
  scenarioControlOpen,
  onScenarioControlToggle,
  heatmapMode,
  heatmapEnabled,
  onHeatmapChange,
  onHeatmapToggle,
  showSensorMarkers,
  onSensorMarkersToggle,
  showVehicleMarkers,
  onVehicleMarkersToggle,
  showZoneBoundaries,
  onZoneBoundariesToggle,
  showStructuralLabels,
  onStructuralLabelsToggle,
  placementMode,
  placementSensorType,
  setPlacementMode,
}: any) {
  if (!show) {
    return (
      <div className="flex justify-center">
        <button
          onClick={onToggle}
          aria-label="Show viewer controls"
          className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/95 px-3 py-2 text-sm text-[var(--fg-primary)] shadow-xl backdrop-blur-md"
        >
          <Settings className="h-4 w-4" />
          Controls
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-center gap-2 p-3 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-primary)] rounded-xl shadow-xl max-w-6xl mx-auto"
    >
      <button
        onClick={onToggle}
        aria-label="Hide viewer controls"
        className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors"
        title="Hide controls"
      >
        <Minimize className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-[var(--border-primary)] mx-2" />

      <button
        onClick={() => onCameraModeChange(cameraMode === 'perspective' ? 'orthographic' : 'perspective')}
        className={`p-2 rounded-lg transition-colors ${cameraMode === 'perspective' ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)]'}`}
        title={cameraMode === 'perspective' ? 'Switch to Orthographic' : 'Switch to Perspective'}
      >
        {cameraMode === 'perspective' ? <Box className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      <div className="w-px h-8 bg-[var(--border-primary)] mx-2" />

      <HeatmapSelector
        mode={heatmapMode}
        enabled={heatmapEnabled}
        onChange={onHeatmapChange}
        onToggle={onHeatmapToggle}
      />

      <div className="w-px h-8 bg-[var(--border-primary)] mx-2" />

      <ToggleButton
        active={showSensorMarkers}
        onClick={onSensorMarkersToggle}
        icon={<Radio className="w-5 h-5" />}
        label="Sensors"
      />
      <ToggleButton
        active={showVehicleMarkers}
        onClick={onVehicleMarkersToggle}
        icon={<Car className="w-5 h-5" />}
        label="Vehicles"
      />
      <ToggleButton
        active={showZoneBoundaries}
        onClick={onZoneBoundariesToggle}
        icon={<Layers className="w-5 h-5" />}
        label="Zones"
      />
      <ToggleButton
        active={showStructuralLabels}
        onClick={onStructuralLabelsToggle}
        icon={<Target className="w-5 h-5" />}
        label="Labels"
      />
      <ToggleButton
        active={placementMode}
        onClick={() => setPlacementMode(!placementMode, placementSensorType || undefined)}
        icon={<MapPin className="w-5 h-5" />}
        label="Place"
      />
      <ToggleButton
        active={scenarioControlOpen}
        onClick={onScenarioControlToggle}
        icon={<Play className="w-5 h-5" />}
        label="Scenarios"
      />
    </motion.div>
  );
}

function HeatmapSelector({ mode, enabled, onChange, onToggle }: any) {
  const modes = [
    { value: 'none', label: 'Off', icon: <EyeOff className="w-4 h-4" /> },
    { value: 'health', label: 'Health', icon: <Thermometer className="w-4 h-4" /> },
    { value: 'vibration', label: 'Vibration', icon: <Zap className="w-4 h-4" /> },
    { value: 'strain', label: 'Strain', icon: <Thermometer className="w-4 h-4" /> },
    { value: 'load', label: 'Load', icon: <Car className="w-4 h-4" /> },
    { value: 'displacement', label: 'Disp.', icon: <Target className="w-4 h-4" /> },
    { value: 'temperature', label: 'Temp', icon: <Cloud className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
      <button
        onClick={onToggle}
        className={`px-2 py-1.5 rounded transition-colors flex items-center gap-1 ${enabled ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
      >
        <Eye className="w-4 h-4" />
      </button>
      <select
        value={mode}
        onChange={(e) => onChange(e.target.value as any)}
        className="bg-transparent border-none text-sm text-[var(--fg-primary)] focus:outline-none cursor-pointer appearance-none"
        disabled={!enabled}
      >
        {modes.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--fg-primary)]'}`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CameraPresetButtons({ currentPreset, onPresetChange }: any) {
  const presets = [
    { id: 'full-bridge', label: 'Full', icon: <Box className="w-4 h-4" /> },
    { id: 'front-elevation', label: 'Front', icon: <Maximize className="w-4 h-4" /> },
    { id: 'side-profile', label: 'Side', icon: <Layers className="w-4 h-4" /> },
    { id: 'top-view', label: 'Top', icon: <Target className="w-4 h-4" /> },
    { id: 'deck-view', label: 'Deck', icon: <Car className="w-4 h-4" /> },
    { id: 'critical-sensor', label: 'Alert', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-1">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => onPresetChange(p.id as any)}
          className={`p-2 rounded-lg transition-colors ${currentPreset === p.id ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-primary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'}`}
          title={p.label}
        >
          {p.icon}
        </button>
      ))}
    </div>
  );
}

function BottomPanelContainer({ activePanel, onPanelChange, panels, togglePanel }: any) {
  const panelOrder = ['telemetry', 'timeline', 'alerts', 'events', 'replay'] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 max-w-6xl mx-auto"
    >
      {panelOrder.map((panelId) => (
        <button
          key={panelId}
          onClick={() => onPanelChange(panelId)}
          className={`flex-1 max-w-xs px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePanel === panelId ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-primary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          {panelId.charAt(0).toUpperCase() + panelId.slice(1)}
        </button>
      ))}
    </motion.div>
  );
}

function SidePanels({ selectedSensorId, getConfiguration, components }: any) {
  const { panels, setPanelState } = useUIStore();

  return (
    <>
      {panels.sensorInspector?.isOpen && selectedSensorId && (
        <div className="absolute right-4 top-16 bottom-16 w-80 max-h-[calc(100vh-120px)] pointer-events-auto">
          <SensorInspectorPanel sensorId={selectedSensorId} onClose={() => setPanelState('sensorInspector', { isOpen: false })} />
        </div>
      )}

      {panels.componentInspector?.isOpen && (
        <div className="absolute left-4 top-16 bottom-16 w-80 max-h-[calc(100vh-120px)] pointer-events-auto">
          <ComponentInspectorPanel components={components} onClose={() => setPanelState('componentInspector', { isOpen: false })} />
        </div>
      )}

      {panels.scenarioControl?.isOpen && (
        <div className="absolute left-4 top-20 bottom-36 w-96 max-w-[calc(100vw-2rem)] pointer-events-auto">
          <ScenarioControlPanel onClose={() => setPanelState('scenarioControl', { isOpen: false })} />
        </div>
      )}
    </>
  );
}
