import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Pause, RotateCcw, FastForward, SkipBack, AlertTriangle, Car, Cloud, Zap, Plus, Edit, Trash2, Clock, Play, Check, X, Settings } from 'lucide-react';
import { useScenarioStore } from '../stores/scenarioStore';
import { Scenario } from '../types/scenario';

export function ScenariosPage() {
  const { currentScenario, startScenario, pauseScenario, resumeScenario, stopScenario, resetScenario, getAllScenarios, addCustomScenario, removeCustomScenario } = useScenarioStore();
  const scenarios = getAllScenarios();

  const state = currentScenario;
  const activeScenario = state.currentScenario;
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

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Scenarios</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Predefined and custom simulation scenarios</p>
          </div>
          <button className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Scenario
          </button>
        </motion.div>

        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel"
          >
            <div className="panel-header flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[var(--fg-primary)]">Active: {activeScenario.name}</h3>
                <p className="text-sm text-[var(--fg-secondary)]">{activeScenario.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={isRunning && !isPaused ? pauseScenario : resumeScenario} className="px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30">
                  {isRunning && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning && !isPaused ? 'Pause' : 'Resume'}
                </button>
                <button onClick={stopScenario} className="px-3 py-1.5 rounded-lg font-medium text-[var(--fg-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-primary)] flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
            <div className="panel-content">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--fg-muted)]">Progress</p>
                  <p className="font-medium">{formatTime(elapsedTime)} / {formatTime(activeScenario.duration)}</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--fg-muted)]">Traffic</p>
                  <p className="font-medium">{activeScenario.traffic.level}</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--fg-muted)]">Weather</p>
                  <p className="font-medium capitalize">{activeScenario.weather.initialMode.toLowerCase()}</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--fg-muted)]">Anomalies</p>
                  <p className="font-medium">{activeScenario.anomalies.length}</p>
                </div>
              </div>
              <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <motion.div className="h-full bg-[var(--accent-cyan)] rounded-full" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 500 }} />
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.scenarioId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`panel ${activeScenario?.scenarioId === scenario.scenarioId ? 'ring-2 ring-[var(--accent-cyan)]' : ''}`}
            >
              <div className="panel-header flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[var(--fg-primary)]">{scenario.name}</h3>
                  <p className="text-sm text-[var(--fg-secondary)] mt-1">{scenario.description}</p>
                </div>
                {activeScenario?.scenarioId === scenario.scenarioId && (
                  <span className="px-2 py-0.5 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded text-xs font-medium">ACTIVE</span>
                )}
              </div>
              <div className="panel-content space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <StatItem label="Duration" value={formatTime(scenario.duration)} icon={<Clock className="w-3 h-3" />} />
                  <StatItem label="Traffic" value={scenario.traffic.level} icon={<Car className="w-3 h-3" />} />
                  <StatItem label="Weather" value={scenario.weather.initialMode} icon={<Cloud className="w-3 h-3" />} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {scenario.anomalies.map((a) => (
                    <span key={a.type} className="px-2 py-0.5 bg-[var(--accent-red)]/20 text-[var(--accent-red)] rounded text-xs">{a.type}</span>
                  ))}
                  {scenario.sensorFailures.map((f) => (
                    <span key={f.sensorId} className="px-2 py-0.5 bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] rounded text-xs">{f.type}: {f.sensorId}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-primary)]">
                  <button
                    onClick={() => startScenario(scenario.scenarioId)}
                    disabled={activeScenario?.scenarioId === scenario.scenarioId}
                    className="flex-1 px-3 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> {activeScenario?.scenarioId === scenario.scenarioId ? 'Running' : 'Run'}
                  </button>
                  <button className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)]" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--border-primary)] text-[var(--accent-red)]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded">
      <span className="text-[var(--fg-muted)]">{icon}</span>
      <div>
        <p className="text-xs text-[var(--fg-muted)]">{label}</p>
        <p className="font-medium text-[var(--fg-primary)]">{value}</p>
      </div>
    </div>
  );
}
