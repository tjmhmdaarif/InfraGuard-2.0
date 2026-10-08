import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, FastForward, RotateCcw, Save, FolderOpen, Trash2, AlertTriangle, Clock, Calendar, Database, Activity, Film } from 'lucide-react';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useSimulationStore } from '../../stores/simulationStore';

interface RecordedSession {
  id: string;
  name: string;
  timestamp: string;
  duration: number;
  telemetryCount: number;
  scenario: string | null;
}

export function ReplaySystem() {
  const { history, addBatch, clearHistory, startRecording, stopRecording } = useTelemetryStore();
  const { clock, isRunning, play, pause, reset, setTime } = useSimulationStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSessions, setRecordedSessions] = useState<RecordedSession[]>([]);
  const [activeReplay, setActiveReplay] = useState<RecordedSession | null>(null);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const handleStartRecording = () => {
    setIsRecording(true);
    startRecording();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const recorded = stopRecording();
    if (recorded && recorded.length > 0) {
      const session: RecordedSession = {
        id: `rec-${Date.now()}`,
        name: `Recording ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        duration: recorded.length > 1 ? (new Date(recorded[recorded.length - 1].timestamp).getTime() - new Date(recorded[0].timestamp).getTime()) / 1000 : 0,
        telemetryCount: recorded.length,
        scenario: null,
      };
      setRecordedSessions((prev) => [...prev, session]);
    }
  };

  const handleReplay = (session: RecordedSession) => {
    setActiveReplay(session);
    reset();
    play();
  };

  const handleStopReplay = () => {
    setActiveReplay(null);
    pause();
    reset();
  };

  const handleDelete = (id: string) => {
    setRecordedSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeReplay?.id === id) {
      handleStopReplay();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button onClick={handleStartRecording} className="px-4 py-2 bg-[var(--accent-red)]/20 text-[var(--accent-red)] border border-[var(--accent-red)]/30 rounded-lg font-medium hover:bg-[var(--accent-red)]/30 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--accent-red)] animate-pulse" />
            Start Recording
          </button>
        ) : (
          <button onClick={handleStopRecording} className="px-4 py-2 bg-[var(--accent-red)]/20 text-[var(--accent-red)] border border-[var(--accent-red)]/30 rounded-lg font-medium hover:bg-[var(--accent-red)]/30 flex items-center gap-2">
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
        )}
        <span className="text-sm text-[var(--fg-secondary)]">Telemetry packets: {history.length}</span>
      </div>

      {activeReplay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[var(--bg-tertiary)] border border-[var(--accent-cyan)]/30 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[var(--fg-primary)] flex items-center gap-2">
              <Film className="w-4 h-4 text-[var(--accent-cyan)]" />
              Replaying: {activeReplay.name}
            </h4>
            <button onClick={handleStopReplay} className="text-[var(--fg-muted)] hover:text-[var(--accent-red)]"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={pause} className="p-2 rounded hover:bg-[var(--bg-primary)]" disabled={!isRunning}><Pause className="w-5 h-5" /></button>
            <button onClick={play} className="p-2 rounded hover:bg-[var(--bg-primary)]" disabled={isRunning}><Play className="w-5 h-5" /></button>
            <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-cyan)]" style={{ width: activeReplay.duration > 0 ? `${(clock.time / activeReplay.duration) * 100}%` : '0%' }} />
            </div>
            <span className="font-mono text-sm">{clock.time.toFixed(1)}s / {activeReplay.duration.toFixed(1)}s</span>
            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-[var(--fg-primary)]">Recorded Sessions ({recordedSessions.length})</h4>
        {recordedSessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--fg-muted)] bg-[var(--bg-tertiary)] rounded-lg border border-dashed border-[var(--border-primary)]">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No recordings yet. Start the simulation and press "Start Recording".</p>
          </div>
        ) : (
          recordedSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-[var(--accent-cyan)]" />
                <div>
                  <p className="font-medium text-[var(--fg-primary)]">{session.name}</p>
                  <p className="text-xs text-[var(--fg-secondary)]">{session.duration.toFixed(1)}s • {session.telemetryCount} packets • {new Date(session.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleReplay(session)} className="px-3 py-1.5 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded text-sm hover:bg-[var(--accent-cyan)]/30">Replay</button>
                <button onClick={() => handleDelete(session.id)} className="p-1.5 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/20 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { Square } from 'lucide-react';