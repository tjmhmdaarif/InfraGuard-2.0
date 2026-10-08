import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Vector3 } from '../types';

export type ViewMode = 'overview' | 'digital-twin' | 'live-monitoring' | 'sensors' | 'analytics' | 'scenarios' | 'bridge-models' | 'alerts' | 'data-flow' | 'hardware' | 'settings';

export type CameraPreset = 'full-bridge' | 'front-elevation' | 'rear-elevation' | 'side-profile' | 'top-view' | 'deck-view' | 'underside' | 'sensor-inspection' | 'full-gorge' | 'critical-sensor';

export interface PanelState {
  isOpen: boolean;
  width?: number;
  height?: number;
  position?: 'left' | 'right' | 'bottom' | 'top';
}

export interface UIState {
  currentView: ViewMode;
  previousView: ViewMode | null;
  cameraMode: 'perspective' | 'orthographic';
  cameraPreset: CameraPreset | null;
  cameraPosition: Vector3;
  cameraTarget: Vector3;
  panels: Record<string, PanelState>;
  heatmapMode: 'none' | 'health' | 'vibration' | 'strain' | 'load' | 'displacement' | 'temperature';
  heatmapEnabled: boolean;
  showSensorMarkers: boolean;
  showVehicleMarkers: boolean;
  showZoneBoundaries: boolean;
  showStructuralLabels: boolean;
  developerMode: boolean;
  simulationMonitorOpen: boolean;
  dataFlowInspectorOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'dark' | 'light';
  notifications: Notification[];
  setView: (view: ViewMode) => void;
  goBack: () => void;
  setCameraMode: (mode: 'perspective' | 'orthographic') => void;
  setCameraPreset: (preset: CameraPreset | null) => void;
  setCameraPosition: (position: Vector3) => void;
  setCameraTarget: (target: Vector3) => void;
  togglePanel: (panelId: string) => void;
  setPanelState: (panelId: string, state: Partial<PanelState>) => void;
  setHeatmapMode: (mode: UIState['heatmapMode']) => void;
  toggleHeatmap: () => void;
  toggleSensorMarkers: () => void;
  toggleVehicleMarkers: () => void;
  toggleZoneBoundaries: () => void;
  toggleStructuralLabels: () => void;
  toggleDeveloperMode: () => void;
  toggleSimulationMonitor: () => void;
  toggleDataFlowInspector: () => void;
  toggleCommandPalette: () => void;
  toggleTheme: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  timestamp: string;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    currentView: 'overview',
    previousView: null,
    cameraMode: 'perspective',
    cameraPreset: null,
    cameraPosition: { x: 0, y: 20, z: 50 },
    cameraTarget: { x: 0, y: 5, z: 0 },
    panels: {
      telemetry: { isOpen: true, position: 'bottom' },
      timeline: { isOpen: true, position: 'bottom' },
      alerts: { isOpen: true, position: 'right' },
      eventStream: { isOpen: false, position: 'right' },
      sensorInspector: { isOpen: false, position: 'right' },
      componentInspector: { isOpen: false, position: 'left' },
      scenarioControl: { isOpen: false, position: 'left' },
    },
    heatmapMode: 'none',
    heatmapEnabled: false,
    showSensorMarkers: true,
    showVehicleMarkers: true,
    showZoneBoundaries: false,
    showStructuralLabels: false,
    developerMode: false,
    simulationMonitorOpen: false,
    dataFlowInspectorOpen: false,
    commandPaletteOpen: false,
    theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    notifications: [],

    setView: (view: ViewMode) =>
      set((state) => ({
        previousView: state.currentView,
        currentView: view,
      })),

    goBack: () =>
      set((state) => ({
        currentView: state.previousView || 'overview',
        previousView: null,
      })),

    setCameraMode: (mode: 'perspective' | 'orthographic') =>
      set({ cameraMode: mode }),

    setCameraPreset: (preset: CameraPreset | null) =>
      set({ cameraPreset: preset }),

    setCameraPosition: (position: Vector3) =>
      set({ cameraPosition: position }),

    setCameraTarget: (target: Vector3) =>
      set({ cameraTarget: target }),

    togglePanel: (panelId: string) =>
      set((state) => ({
        panels: {
          ...state.panels,
          [panelId]: { ...state.panels[panelId], isOpen: !state.panels[panelId]?.isOpen },
        },
      })),

    setPanelState: (panelId: string, panelState: Partial<PanelState>) =>
      set((state) => ({
        panels: {
          ...state.panels,
          [panelId]: { ...state.panels[panelId], ...panelState },
        },
      })),

    setHeatmapMode: (mode: UIState['heatmapMode']) =>
      set({ heatmapMode: mode, heatmapEnabled: mode !== 'none' }),

    toggleHeatmap: () =>
      set((state) => ({ heatmapEnabled: !state.heatmapEnabled })),

    toggleSensorMarkers: () =>
      set((state) => ({ showSensorMarkers: !state.showSensorMarkers })),

    toggleVehicleMarkers: () =>
      set((state) => ({ showVehicleMarkers: !state.showVehicleMarkers })),

    toggleZoneBoundaries: () =>
      set((state) => ({ showZoneBoundaries: !state.showZoneBoundaries })),

    toggleStructuralLabels: () =>
      set((state) => ({ showStructuralLabels: !state.showStructuralLabels })),

    toggleDeveloperMode: () =>
      set((state) => ({ developerMode: !state.developerMode })),

    toggleSimulationMonitor: () =>
      set((state) => ({ simulationMonitorOpen: !state.simulationMonitorOpen })),

    toggleDataFlowInspector: () =>
      set((state) => ({ dataFlowInspectorOpen: !state.dataFlowInspectorOpen })),

    toggleCommandPalette: () =>
      set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

    toggleTheme: () =>
      set((state) => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (!document) return { theme: nextTheme };
        document.documentElement.classList.remove(state.theme);
        document.documentElement.classList.add(nextTheme);
        localStorage.setItem('theme', nextTheme);
        return { theme: nextTheme };
      }),

    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
      set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
        ].slice(-10),
      })),

    removeNotification: (id: string) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    clearNotifications: () =>
      set({ notifications: [] }),
  }))
);

export const useCurrentView = () => useUIStore((state) => state.currentView);
export const useUIActions = () => useUIStore((state) => ({
  setView: state.setView,
  goBack: state.goBack,
  setCameraMode: state.setCameraMode,
  setCameraPreset: state.setCameraPreset,
  setCameraPosition: state.setCameraPosition,
  setCameraTarget: state.setCameraTarget,
  togglePanel: state.togglePanel,
  setPanelState: state.setPanelState,
  setHeatmapMode: state.setHeatmapMode,
  toggleHeatmap: state.toggleHeatmap,
  toggleSensorMarkers: state.toggleSensorMarkers,
  toggleVehicleMarkers: state.toggleVehicleMarkers,
  toggleZoneBoundaries: state.toggleZoneBoundaries,
  toggleStructuralLabels: state.toggleStructuralLabels,
  toggleDeveloperMode: state.toggleDeveloperMode,
  toggleSimulationMonitor: state.toggleSimulationMonitor,
  toggleDataFlowInspector: state.toggleDataFlowInspector,
  toggleCommandPalette: state.toggleCommandPalette,
  toggleTheme: state.toggleTheme,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));