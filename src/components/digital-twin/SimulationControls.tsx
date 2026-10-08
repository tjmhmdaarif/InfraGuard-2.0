import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, FastForward, RotateCw, SkipBack, ChevronDown } from 'lucide-react';

interface SimulationControlsProps {
  clock: any;
  isRunning: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  currentScenario: string;
  onScenarioSelect: (scenarioId: string) => void;
  scenarios: any[];
}

const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10];

export function SimulationControls({
  clock,
  isRunning,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  currentScenario,
  onScenarioSelect,
  scenarios,
}: SimulationControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border-primary)] rounded-xl p-3 shadow-xl min-w-[200px]"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--fg-muted)] uppercase tracking-wide">Simulation</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isRunning ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]' : 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'}`}>
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-lg tabular-nums text-[var(--fg-primary)]">{formatTime(clock.time)}</span>
          <div className="flex items-center gap-1">
            <button onClick={onReset} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]" title="Reset"><SkipBack className="w-4 h-4" /></button>
            <button onClick={isRunning ? onPause : onPlay} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] bg-[var(--accent-cyan)]/20" title={isRunning ? 'Pause' : 'Play'}>
              {isRunning ? <Pause className="w-4 h-4 text-[var(--accent-cyan)]" /> : <Play className="w-4 h-4 text-[var(--accent-cyan)]" />}
            </button>
            <button onClick={onReset} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]" title="Restart"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <label className="flex-1">
            <span className="text-xs text-[var(--fg-muted)]">Speed</span>
            <select
              value={speed}
              onChange={(e) => { onSpeedChange(parseFloat(e.target.value)); setShowSpeedMenu(false); }}
              className="w-full mt-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1 text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="text-xs text-[var(--fg-muted)]">Scenario</span>
            <select
              value={scenarios.find((s) => s.name === currentScenario)?.scenarioId || ''}
              onChange={(e) => { onScenarioSelect(e.target.value); setShowScenarioMenu(false); }}
              className="w-full mt-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1 text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
            >
              <option value="">Select scenario...</option>
              {scenarios.map((s) => (
                <option key={s.scenarioId} value={s.scenarioId}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';