import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, PlayCircle, CloudRain, Waves, Gauge, Minus, ChevronDown, X, Check, Sun } from 'lucide-react';
import { useScenarioStore } from '../../stores/scenarioStore';
import { applyScenarioEnvironment, useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';

interface ScenarioControlPanelProps {
  onClose?: () => void;
}

export function ScenarioControlPanel({ onClose }: ScenarioControlPanelProps) {
  const { currentScenario, startScenario, pauseScenario, resumeScenario, stopScenario, getAllScenarios } = useScenarioStore();
  const {
    weatherMode,
    floodActive,
    trafficDensity,
    lighting,
    finishMode,
    setWeatherMode,
    setFloodActive,
    setTrafficDensity,
    setLighting,
    setFinishMode,
  } = useEnvironmentStore();
  const { showVehicleMarkers, toggleVehicleMarkers } = useUIStore();
  const [minimized, setMinimized] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [trafficOpen, setTrafficOpen] = useState(true);
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const scenarios = getAllScenarios();

  const state = currentScenario;
  const scenario = state.currentScenario;
  const isRunning = state.isRunning;
  const isPaused = state.isPaused;
  const progress = state.progress;
  const elapsedTime = state.elapsedTime;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getExpectedEvents = () => {
    if (!scenario) return [];
    return scenario.expectedEvents
      .filter((e) => elapsedTime >= e.time - 5)
      .slice(0, 5)
      .map((e) => ({
        ...e,
        completed: state.completedEvents.includes(e.type),
        active: !state.completedEvents.includes(e.type) && elapsedTime >= e.time,
      }));
  };

  const upcomingEvents = getExpectedEvents();
  const pressure =
    (floodActive ? 2 : 0) +
    (weatherMode === 'HEAVY_RAIN' ? 1 : weatherMode === 'RAIN' ? 0.7 : 0) +
    (trafficDensity >= 75 ? 1.1 : trafficDensity >= 40 ? 0.5 : 0);
  const responseLevel = pressure >= 3 ? 3 : pressure >= 2 ? 2 : pressure > 0 ? 1 : 0;
  const response = [
    { label: 'Stable', color: '#4ade80', rotation: -78 },
    { label: 'Watch', color: '#facc15', rotation: -28 },
    { label: 'Elevated', color: '#fb923c', rotation: 28 },
    { label: 'Critical', color: '#f87171', rotation: 78 },
  ][responseLevel];
  const strainLevel = Math.min(
    3,
    (floodActive ? 2 : 0) + (trafficDensity >= 75 ? 1 : trafficDensity >= 40 ? 1 : 0),
  );
  const vibrationLevel = Math.min(
    3,
    (weatherMode === 'HEAVY_RAIN' ? 1 : weatherMode === 'RAIN' ? 1 : 0) +
      (floodActive ? 1 : 0) +
      (trafficDensity >= 50 ? 1 : 0),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex max-h-[calc(100dvh-17rem)] flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-xl w-full"
    >
      <div className="p-3 border-b border-[var(--border-primary)] flex items-center justify-between">
        <h3 className="font-semibold text-[var(--fg-primary)]">Scenario Control</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized((value) => !value)}
            aria-label={minimized ? 'Expand scenario controls' : 'Minimize scenario controls'}
            aria-expanded={!minimized}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]"
          >
            {minimized ? <ChevronDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          {onClose && (
          <button
            onClick={onClose}
            aria-label="Close scenario panel"
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
          )}
        </div>
      </div>

      {!minimized && <div className="min-h-0 overflow-y-auto p-3 space-y-3">
        <section className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-medium text-[var(--fg-primary)]">Bridge integrity</h4>
              <p className="text-[11px] text-[var(--fg-muted)]">Illustrative demo classification</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: response.color }}>{response.label}</span>
          </div>
          <div className="relative mx-auto mt-3 h-[76px] w-[152px] overflow-hidden" role="img" aria-label={`Illustrative bridge response: ${response.label}`}>
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 270deg, #4ade80 0deg, #facc15 75deg, #fb923c 135deg, #f87171 180deg, transparent 180deg 360deg)' }}
            />
            <div className="absolute left-[9px] top-[9px] h-[134px] w-[134px] rounded-full bg-[var(--bg-secondary)]" />
            <div
              className="absolute bottom-0 left-1/2 h-[61px] w-[2px] origin-bottom rounded-full transition-transform duration-700 ease-out"
              style={{ backgroundColor: response.color, transform: `translateX(-50%) rotate(${response.rotation}deg)` }}
            />
            <div className="absolute bottom-[-4px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[var(--bg-primary)]" style={{ backgroundColor: response.color }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[var(--fg-muted)]">
            <span>Stable</span><span>Critical</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
            Visual effects and response are illustrative, not an engineering assessment.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <EffectMeter label="Strain" level={strainLevel} />
            <EffectMeter label="Vibration" level={vibrationLevel} />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
          <button
            className="flex w-full items-center justify-between p-3 text-left"
            onClick={() => setConditionsOpen((value) => !value)}
            aria-expanded={conditionsOpen}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg-primary)]">
              <CloudRain className="h-4 w-4 text-[var(--accent-cyan)]" />
              Environment
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${conditionsOpen ? 'rotate-180' : ''}`} />
          </button>
          {conditionsOpen && <div className="space-y-2 px-3 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {(['CLEAR', 'RAIN', 'HEAVY_RAIN'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWeatherMode(mode)}
                  aria-pressed={weatherMode === mode}
                  className={`rounded-md border px-2 py-2 text-xs transition-colors active:scale-[0.98] ${
                    weatherMode === mode
                      ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/15 text-[var(--fg-primary)]'
                      : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'
                  }`}
                >
                  {mode === 'CLEAR' ? 'Clear' : mode === 'RAIN' ? 'Rain' : 'Heavy rain'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFloodActive(!floodActive)}
              aria-pressed={floodActive}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors active:scale-[0.99] ${
                floodActive
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/15 text-[var(--fg-primary)]'
                  : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]'
              }`}
            >
              <span className="flex items-center gap-2"><Waves className="h-4 w-4" /> Flood water</span>
              <span>{floodActive ? 'On' : 'Off'}</span>
            </button>
          </div>}
        </section>

        <section className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
          <button
            className="flex w-full items-center justify-between p-3 text-left"
            onClick={() => setTrafficOpen((value) => !value)}
            aria-expanded={trafficOpen}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg-primary)]">
              <Gauge className="h-4 w-4 text-[var(--accent-cyan)]" />
              Traffic load
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${trafficOpen ? 'rotate-180' : ''}`} />
          </button>
          {trafficOpen && <div className="space-y-3 px-3 pb-3">
            <label className="block text-xs text-[var(--fg-secondary)]">
              Vehicle density <span className="float-right font-mono text-[var(--fg-primary)]">{trafficDensity}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={trafficDensity}
                onChange={(event) => setTrafficDensity(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--accent-cyan)]"
                aria-label="Vehicle density"
              />
            </label>
            <button
              onClick={toggleVehicleMarkers}
              aria-pressed={showVehicleMarkers}
              className="w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 text-left text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
            >
              {showVehicleMarkers ? 'Hide vehicles' : 'Show vehicles'}
            </button>
          </div>}
        </section>

        <section className="rounded-lg border border-[var(--border-primary)]">
          <button
            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-[var(--fg-primary)]"
            onClick={() => setDisplayOpen((value) => !value)}
            aria-expanded={displayOpen}
          >
            <span className="flex items-center gap-2"><Sun className="h-4 w-4 text-[var(--accent-cyan)]" /> Lighting and materials</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${displayOpen ? 'rotate-180' : ''}`} />
          </button>
          {displayOpen && (
            <div className="space-y-3 px-3 pb-3">
              {([
                ['x', 'Light X', -120, 120, 5],
                ['y', 'Light Y', 10, 160, 5],
                ['z', 'Light Z', -120, 120, 5],
              ] as const).map(([axis, label, min, max, step]) => (
                <label key={axis} className="block text-xs text-[var(--fg-secondary)]">
                  <span className="flex justify-between"><span>{label}</span><span className="font-mono">{lighting[axis]}</span></span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={lighting[axis]}
                    onChange={(event) => setLighting({ [axis]: Number(event.target.value) })}
                    className="mt-1 w-full accent-[var(--accent-cyan)]"
                  />
                </label>
              ))}
              <label className="block text-xs text-[var(--fg-secondary)]">
                <span className="flex justify-between"><span>Light intensity</span><span className="font-mono">{lighting.intensity.toFixed(2)}</span></span>
                <input
                  type="range"
                  min={0.2}
                  max={3}
                  step={0.05}
                  value={lighting.intensity}
                  onChange={(event) => setLighting({ intensity: Number(event.target.value) })}
                  className="mt-1 w-full accent-[var(--accent-cyan)]"
                />
              </label>
              <label className="block text-xs text-[var(--fg-secondary)]">
                Bridge material
                <select
                  value={finishMode}
                  onChange={(event) => setFinishMode(event.target.value as typeof finishMode)}
                  className="mt-1 w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-2 text-[var(--fg-primary)]"
                >
                  <option value="PBR">PBR steel</option>
                  <option value="WIREFRAME">Wireframe</option>
                  <option value="STRESS">Stress tint (illustrative)</option>
                </select>
              </label>
              <p className="text-[11px] leading-relaxed text-[var(--fg-muted)]">
                Lighting and material previews change the 3D presentation only; they do not calculate structural safety.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[var(--border-primary)]">
          <button
            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-[var(--fg-primary)]"
            onClick={() => setScenariosOpen((value) => !value)}
            aria-expanded={scenariosOpen}
          >
            Scenario presets
            <ChevronDown className={`h-4 w-4 transition-transform ${scenariosOpen ? 'rotate-180' : ''}`} />
          </button>
          {scenariosOpen && <div className="max-h-52 space-y-2 overflow-y-auto px-3 pb-3">
            {scenarios.map((item) => (
              <button
                key={item.scenarioId}
                onClick={() => {
                  startScenario(item.scenarioId);
                  applyScenarioEnvironment(item);
                }}
                className="w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-2 text-left text-sm text-[var(--fg-primary)] transition-colors hover:border-[var(--accent-cyan)]"
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{item.name}</span><PlayCircle className="h-4 w-4 shrink-0 text-[var(--accent-cyan)]" />
                </span>
                <span className="mt-1 block text-xs text-[var(--fg-muted)]">{item.description}</span>
              </button>
            ))}
          </div>}
        </section>

        {scenario ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--fg-muted)]">Progress</span>
                <span className="text-sm font-mono text-[var(--fg-primary)]">{formatTime(elapsedTime)} / {formatTime(scenario.duration)}</span>
              </div>
              <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--accent-cyan)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 500 }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={isRunning && !isPaused ? pauseScenario : resumeScenario}
                  disabled={!scenario}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                    ${isRunning && !isPaused
                      ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 hover:bg-[var(--accent-amber)]/30'
                      : 'bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/30'}`}
                >
                  {isRunning && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning && !isPaused ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={stopScenario}
                  disabled={!scenario}
                  className="px-3 py-2 rounded-lg font-medium text-[var(--fg-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-primary)] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border-primary)] pt-4 space-y-3">
              <h4 className="font-medium text-[var(--fg-primary)]">Active Scenario: {scenario.name}</h4>
              <p className="text-sm text-[var(--fg-secondary)]">{scenario.description}</p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                  <div className="text-[var(--fg-muted)]">Duration</div>
                  <div className="font-medium">{formatTime(scenario.duration)}</div>
                </div>
                <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                  <div className="text-[var(--fg-muted)]">Traffic</div>
                  <div className="font-medium">{scenario.traffic.level}</div>
                </div>
                <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                  <div className="text-[var(--fg-muted)]">Weather</div>
                  <div className="font-medium capitalize">{scenario.weather.initialMode.toLowerCase()}</div>
                </div>
              </div>

              {upcomingEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[var(--fg-primary)] text-sm">Timeline</h4>
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.type}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${event.completed ? 'bg-[var(--accent-green)]/10' : event.active ? 'bg-[var(--accent-amber)]/10' : 'bg-[var(--bg-tertiary)]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${event.completed ? 'bg-[var(--accent-green)]' : event.active ? 'bg-[var(--accent-amber)] animate-pulse' : 'bg-[var(--fg-muted)]'}`} />
                      <span className={`flex-1 ${event.completed ? 'text-[var(--accent-green)] line-through' : event.active ? 'text-[var(--accent-amber)] font-medium' : 'text-[var(--fg-secondary)]'}`}>
                        {formatTime(event.time)} - {event.description}
                      </span>
                      {event.completed && <Check className="w-4 h-4 text-[var(--accent-green)]" />}
                    </div>
                  ))}
                </div>
              )}

              {state.activeAnomalies.length > 0 && (
                <div className="border-t border-[var(--border-primary)] pt-3">
                  <h4 className="font-medium text-[var(--fg-primary)] text-sm mb-2">Active Anomalies</h4>
                  <div className="flex flex-wrap gap-1">
                    {state.activeAnomalies.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-[var(--accent-red)]/20 text-[var(--accent-red)] rounded text-xs">
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {state.activeSensorFailures.length > 0 && (
                <div className="border-t border-[var(--border-primary)] pt-3">
                  <h4 className="font-medium text-[var(--fg-primary)] text-sm mb-2">Sensor Failures</h4>
                  <div className="flex flex-wrap gap-1">
                    {state.activeSensorFailures.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>}
    </motion.div>
  );
}

function EffectMeter({ label, level }: { label: string; level: number }) {
  const states = ['Low', 'Guarded', 'High', 'Severe'];
  const colors = ['#4ade80', '#facc15', '#fb923c', '#f87171'];

  return (
    <div
      role="meter"
      aria-label={`${label} response`}
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={level}
      aria-valuetext={states[level]}
      className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-[var(--fg-secondary)]">{label}</span>
        <span style={{ color: colors[level] }}>{states[level]}</span>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {states.map((_, index) => (
          <span
            key={index}
            className="h-1.5 flex-1 rounded-full transition-colors duration-500"
            style={{ backgroundColor: index <= level ? colors[level] : 'var(--bg-tertiary)' }}
          />
        ))}
      </div>
    </div>
  );
}