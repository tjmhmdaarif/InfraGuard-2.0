import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TelemetryPacket, TelemetryBatch, TelemetryTimeRange, TelemetryStatistics } from '../types';

export interface TelemetryState {
  latestPackets: Map<string, TelemetryPacket>;
  history: TelemetryPacket[];
  batches: TelemetryBatch[];
  statistics: Map<string, TelemetryStatistics>;
  timeRange: TelemetryTimeRange | null;
  maxHistoryLength: number;
  recording: boolean;
  recordedSession: TelemetryPacket[] | null;
  addPacket: (packet: TelemetryPacket) => void;
  addBatch: (batch: TelemetryBatch) => void;
  clearHistory: () => void;
  setTimeRange: (range: TelemetryTimeRange | null) => void;
  setMaxHistoryLength: (length: number) => void;
  startRecording: () => void;
  stopRecording: () => TelemetryPacket[] | null;
  getSensorHistory: (sensorId: string, timeRange?: TelemetryTimeRange) => TelemetryPacket[];
  getZoneHistory: (zoneId: string, timeRange?: TelemetryTimeRange) => TelemetryPacket[];
  getLatestForSensor: (sensorId: string) => TelemetryPacket | undefined;
  updateStatistics: (sensorId: string) => void;
}

export const useTelemetryStore = create<TelemetryState>()(
  subscribeWithSelector((set, get) => ({
    latestPackets: new Map(),
    history: [],
    batches: [],
    statistics: new Map(),
    timeRange: null,
    maxHistoryLength: 10000,
    recording: false,
    recordedSession: null,

    addPacket: (packet: TelemetryPacket) =>
      set((state) => {
        const newLatestPackets = new Map(state.latestPackets);
        newLatestPackets.set(packet.sensorId, packet);

        let newHistory = [...state.history, packet];
        if (newHistory.length > state.maxHistoryLength) {
          newHistory = newHistory.slice(-state.maxHistoryLength);
        }

        const newRecording = state.recording
          ? [...(state.recordedSession || []), packet]
          : null;

        return {
          latestPackets: newLatestPackets,
          history: newHistory,
          recordedSession: newRecording,
        };
      }),

    addBatch: (batch: TelemetryBatch) =>
      set((state) => {
        const newBatches = [...state.batches, batch];
        if (newBatches.length > 1000) {
          newBatches.shift();
        }
        return { batches: newBatches };
      }),

    clearHistory: () =>
      set({ history: [], batches: [], statistics: new Map() }),

    setTimeRange: (range: TelemetryTimeRange | null) =>
      set({ timeRange: range }),

    setMaxHistoryLength: (length: number) =>
      set({ maxHistoryLength: Math.max(100, length) }),

    startRecording: () =>
      set({ recording: true, recordedSession: [] }),

    stopRecording: () => {
      const recordedSession = get().recordedSession;
      set({ recording: false });
      return recordedSession;
    },

    getSensorHistory: (sensorId: string, timeRange?: TelemetryTimeRange) => {
      const { history } = get();
      let filtered = history.filter((p) => p.sensorId === sensorId);
      if (timeRange) {
        filtered = filtered.filter((p) => {
          const t = new Date(p.timestamp).getTime();
          return t >= new Date(timeRange.start).getTime() && t <= new Date(timeRange.end).getTime();
        });
      }
      return filtered;
    },

    getZoneHistory: (zoneId: string, timeRange?: TelemetryTimeRange) => {
      const { history } = get();
      let filtered = history.filter((p) => p.zoneId === zoneId);
      if (timeRange) {
        filtered = filtered.filter((p) => {
          const t = new Date(p.timestamp).getTime();
          return t >= new Date(timeRange.start).getTime() && t <= new Date(timeRange.end).getTime();
        });
      }
      return filtered;
    },

    getLatestForSensor: (sensorId: string) => {
      return get().latestPackets.get(sensorId);
    },

    updateStatistics: (sensorId: string) => {
      const { history, statistics } = get();
      const sensorHistory = history.filter((p) => p.sensorId === sensorId);
      if (sensorHistory.length === 0) return;

      const values = sensorHistory.map((p) => {
        if (p.vibration) return p.vibration.magnitude;
        if (p.strain) return p.strain.strain;
        if (p.load) return p.load.load;
        if (p.displacement !== undefined) return p.displacement;
        return 0;
      });

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
      if (values.length >= 10) {
        const recent = values.slice(-10);
        const older = values.slice(-20, -10);
        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          const diff = (recentAvg - olderAvg) / olderAvg;
          if (diff > 0.05) trend = 'INCREASING';
          else if (diff < -0.05) trend = 'DECREASING';
        }
      }

      const newStats = new Map(statistics);
      newStats.set(sensorId, {
        sensorId,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean,
        median,
        stdDev,
        trend,
        lastUpdate: new Date().toISOString(),
      });

      set({ statistics: newStats });
    },
  }))
);

export const useLatestTelemetry = () => useTelemetryStore((state) => state.latestPackets);
export const useTelemetryHistory = () => useTelemetryStore((state) => state.history);
export const useTelemetryActions = () => useTelemetryStore((state) => ({
  addPacket: state.addPacket,
  addBatch: state.addBatch,
  clearHistory: state.clearHistory,
  startRecording: state.startRecording,
  stopRecording: state.stopRecording,
  getSensorHistory: state.getSensorHistory,
  getZoneHistory: state.getZoneHistory,
  getLatestForSensor: state.getLatestForSensor,
}));