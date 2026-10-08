import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SimulationClock, SimulationSpeed } from '../types';

export interface SimulationState {
  clock: SimulationClock;
  isRunning: boolean;
  speed: SimulationSpeed;
  currentScenario: string | null;
  scenarioProgress: number;
  scenarioElapsedTime: number;
  demoMode: boolean;
  demoStep: number;
  setTime: (time: number) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
  setScenario: (scenarioId: string | null) => void;
  setScenarioProgress: (progress: number) => void;
  setScenarioElapsedTime: (time: number) => void;
  setDemoMode: (enabled: boolean) => void;
  setDemoStep: (step: number) => void;
  tick: (deltaTime: number) => void;
}

const INITIAL_CLOCK: SimulationClock = {
  time: 0,
  speed: 1,
  isRunning: false,
  startTime: 0,
  lastTick: 0,
};

const SPEEDS: SimulationSpeed[] = [0.1, 0.25, 0.5, 1, 2, 5, 10];

export const useSimulationStore = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    clock: INITIAL_CLOCK,
    isRunning: false,
    speed: 1,
    currentScenario: null,
    scenarioProgress: 0,
    scenarioElapsedTime: 0,
    demoMode: false,
    demoStep: 0,

    setTime: (time: number) =>
      set((state) => ({
        clock: { ...state.clock, time },
        scenarioElapsedTime: time,
      })),

    setSpeed: (speed: SimulationSpeed) =>
      set((state) => ({
        clock: { ...state.clock, speed },
        speed,
      })),

    play: () =>
      set((state) => ({
        clock: { ...state.clock, isRunning: true, startTime: Date.now() - state.clock.time / state.clock.speed },
        isRunning: true,
      })),

    pause: () =>
      set((state) => ({
        clock: { ...state.clock, isRunning: false },
        isRunning: false,
      })),

    reset: () =>
      set({
        clock: { ...INITIAL_CLOCK, speed: get().speed },
        isRunning: false,
        scenarioProgress: 0,
        scenarioElapsedTime: 0,
        demoStep: 0,
      }),

    restart: () =>
      set((state) => ({
        clock: { ...INITIAL_CLOCK, speed: state.speed },
        isRunning: state.isRunning,
        scenarioProgress: 0,
        scenarioElapsedTime: 0,
        demoStep: 0,
      })),

    setScenario: (scenarioId: string | null) =>
      set({ currentScenario: scenarioId, scenarioProgress: 0, scenarioElapsedTime: 0 }),

    setScenarioProgress: (progress: number) =>
      set({ scenarioProgress: Math.max(0, Math.min(1, progress)) }),

    setScenarioElapsedTime: (time: number) =>
      set({ scenarioElapsedTime: time }),

    setDemoMode: (enabled: boolean) =>
      set({ demoMode: enabled, demoStep: enabled ? 1 : 0 }),

    setDemoStep: (step: number) =>
      set({ demoStep: Math.max(0, step) }),

    tick: (deltaTime: number) => {
      const { clock, isRunning, speed } = get();
      if (!isRunning) return;
      const newTime = clock.time + deltaTime * speed;
      set({
        clock: { ...clock, time: newTime, lastTick: Date.now() },
        scenarioElapsedTime: newTime,
      });
    },
  }))
);

export const useSimulationClock = () => useSimulationStore((state) => state.clock);
export const useSimulationControls = () => useSimulationStore((state) => ({
  isRunning: state.isRunning,
  speed: state.speed,
  play: state.play,
  pause: state.pause,
  reset: state.reset,
  restart: state.restart,
  setSpeed: state.setSpeed,
  setTime: state.setTime,
}));