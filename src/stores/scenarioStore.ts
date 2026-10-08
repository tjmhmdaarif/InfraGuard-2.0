import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Scenario, ScenarioState, ScenarioConfig } from '../types';
import { BUILT_IN_SCENARIOS } from '../types/scenario';

export interface ScenarioStoreState {
  scenarios: Map<string, Scenario>;
  currentScenario: ScenarioState;
  customScenarios: Scenario[];
  loadBuiltInScenarios: () => void;
  startScenario: (scenarioId: string) => void;
  pauseScenario: () => void;
  resumeScenario: () => void;
  stopScenario: () => void;
  resetScenario: () => void;
  updateProgress: (elapsedTime: number) => void;
  addCustomScenario: (scenario: Scenario) => void;
  removeCustomScenario: (scenarioId: string) => void;
  getScenario: (scenarioId: string) => Scenario | undefined;
  getAllScenarios: () => Scenario[];
}

export const useScenarioStore = create<ScenarioStoreState>()(
  subscribeWithSelector((set, get) => ({
    scenarios: new Map(),
    currentScenario: {
      currentScenario: null,
      isRunning: false,
      isPaused: false,
      elapsedTime: 0,
      progress: 0,
      completedEvents: [],
      activeAnomalies: [],
      activeSensorFailures: [],
    },
    customScenarios: [],

    loadBuiltInScenarios: () =>
      set((state) => {
        const newScenarios = new Map(state.scenarios);
        BUILT_IN_SCENARIOS.forEach((s) => newScenarios.set(s.scenarioId, s));
        return { scenarios: newScenarios };
      }),

    startScenario: (scenarioId: string) =>
      set((state) => {
        const scenario = state.scenarios.get(scenarioId) || state.customScenarios.find((s) => s.scenarioId === scenarioId);
        if (!scenario) return state;
        return {
          currentScenario: {
            currentScenario: scenario,
            isRunning: true,
            isPaused: false,
            elapsedTime: 0,
            progress: 0,
            completedEvents: [],
            activeAnomalies: [],
            activeSensorFailures: [],
          },
        };
      }),

    pauseScenario: () =>
      set((state) => ({
        currentScenario: { ...state.currentScenario, isPaused: true, isRunning: false },
      })),

    resumeScenario: () =>
      set((state) => ({
        currentScenario: { ...state.currentScenario, isPaused: false, isRunning: true },
      })),

    stopScenario: () =>
      set((state) => ({
        currentScenario: { ...state.currentScenario, isRunning: false, isPaused: false },
      })),

    resetScenario: () =>
      set((state) => ({
        currentScenario: {
          ...state.currentScenario,
          elapsedTime: 0,
          progress: 0,
          completedEvents: [],
          activeAnomalies: [],
          activeSensorFailures: [],
        },
      })),

    updateProgress: (elapsedTime: number) =>
      set((state) => {
        const { currentScenario } = state;
        if (!currentScenario.currentScenario) return state;
        const progress = Math.min(1, elapsedTime / currentScenario.currentScenario.duration);
        const newCompletedEvents = [...currentScenario.completedEvents];
        const newActiveAnomalies = [...currentScenario.activeAnomalies];
        const newActiveSensorFailures = [...currentScenario.activeSensorFailures];

        currentScenario.currentScenario.expectedEvents.forEach((event) => {
          if (elapsedTime >= event.time && !newCompletedEvents.includes(event.type)) {
            newCompletedEvents.push(event.type);
          }
        });

        currentScenario.currentScenario.anomalies.forEach((anomaly) => {
          if (elapsedTime >= anomaly.time && elapsedTime < anomaly.time + anomaly.duration) {
            if (!newActiveAnomalies.includes(anomaly.type)) newActiveAnomalies.push(anomaly.type);
          } else if (elapsedTime >= anomaly.time + anomaly.duration) {
            const idx = newActiveAnomalies.indexOf(anomaly.type);
            if (idx >= 0) newActiveAnomalies.splice(idx, 1);
          }
        });

        currentScenario.currentScenario.sensorFailures.forEach((failure) => {
          if (elapsedTime >= failure.time && (!failure.duration || elapsedTime < failure.time + failure.duration)) {
            if (!newActiveSensorFailures.includes(failure.sensorId)) newActiveSensorFailures.push(failure.sensorId);
          } else if (failure.duration && elapsedTime >= failure.time + failure.duration) {
            const idx = newActiveSensorFailures.indexOf(failure.sensorId);
            if (idx >= 0) newActiveSensorFailures.splice(idx, 1);
          }
        });

        return {
          currentScenario: {
            ...currentScenario,
            elapsedTime,
            progress,
            completedEvents: newCompletedEvents,
            activeAnomalies: newActiveAnomalies,
            activeSensorFailures: newActiveSensorFailures,
          },
        };
      }),

    addCustomScenario: (scenario: Scenario) =>
      set((state) => ({
        customScenarios: [...state.customScenarios, scenario],
        scenarios: new Map(state.scenarios).set(scenario.scenarioId, scenario),
      })),

    removeCustomScenario: (scenarioId: string) =>
      set((state) => {
        const newScenarios = new Map(state.scenarios);
        newScenarios.delete(scenarioId);
        return {
          customScenarios: state.customScenarios.filter((s) => s.scenarioId !== scenarioId),
          scenarios: newScenarios,
        };
      }),

    getScenario: (scenarioId: string) =>
      get().scenarios.get(scenarioId) || get().customScenarios.find((s) => s.scenarioId === scenarioId),

    getAllScenarios: () =>
      [...get().scenarios.values(), ...get().customScenarios],
  }))
);

export const useCurrentScenario = () => useScenarioStore((state) => state.currentScenario);
export const useScenarios = () => useScenarioStore((state) => [...state.scenarios.values(), ...state.customScenarios]);
export const useScenarioActions = () => useScenarioStore((state) => ({
  startScenario: state.startScenario,
  pauseScenario: state.pauseScenario,
  resumeScenario: state.resumeScenario,
  stopScenario: state.stopScenario,
  resetScenario: state.resetScenario,
  addCustomScenario: state.addCustomScenario,
  removeCustomScenario: state.removeCustomScenario,
  getScenario: state.getScenario,
}));