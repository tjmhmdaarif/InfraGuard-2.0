import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/Toaster';
import { Layout } from '@/components/layout/Layout';
import { OverviewPage } from '@/pages/OverviewPage';
import { DigitalTwinPage } from '@/pages/DigitalTwinPage';
import { LiveMonitoringPage } from '@/pages/LiveMonitoringPage';
import { SensorsPage } from '@/pages/SensorsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { BridgeModelsPage } from '@/pages/BridgeModelsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DataFlowPage } from '@/pages/DataFlowPage';
import { HardwarePage } from '@/pages/HardwarePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LandingPage } from '@/pages/LandingPage';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSensorStore } from '@/stores/sensorStore';
import { useBridgeStore } from '@/stores/bridgeStore';
import { SimulationEngine } from '@/simulation/SimulationEngine';
import { calibrationEngine } from '@/calibration/CalibrationEngine';
import { useEffect } from 'react';
import { useScenarioStore } from '@/stores/scenarioStore';

const queryClient = new QueryClient();

const DEFAULT_SENSORS = [
  { sensorId: 'VIB-01', sensorType: 'MPU6050' as const, bridgeId: 'BRIDGE-001', zoneId: 'LEFT-SPAN', position: { x: -0.3, y: -0.2, z: 0.4 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'MPU6050-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 95, signalStrength: 98, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'VIB-02', sensorType: 'MPU6050' as const, bridgeId: 'BRIDGE-001', zoneId: 'CENTER-SPAN', position: { x: 0, y: -0.2, z: 0.4 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'MPU6050-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 94, signalStrength: 97, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'VIB-03', sensorType: 'MPU6050' as const, bridgeId: 'BRIDGE-001', zoneId: 'RIGHT-SPAN', position: { x: 0.3, y: -0.2, z: 0.4 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'MPU6050-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 96, signalStrength: 99, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'STR-01', sensorType: 'STRAIN' as const, bridgeId: 'BRIDGE-001', zoneId: 'LEFT-SPAN', position: { x: -0.25, y: 0, z: 0.3 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'STRAIN-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 98, signalStrength: 99, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'STR-02', sensorType: 'STRAIN' as const, bridgeId: 'BRIDGE-001', zoneId: 'CENTER-SPAN', position: { x: 0, y: 0, z: 0.3 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'STRAIN-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 97, signalStrength: 98, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'STR-03', sensorType: 'STRAIN' as const, bridgeId: 'BRIDGE-001', zoneId: 'RIGHT-SPAN', position: { x: 0.25, y: 0, z: 0.3 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'STRAIN-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 99, signalStrength: 99, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'TEMP-01', sensorType: 'DHT22' as const, bridgeId: 'BRIDGE-001', zoneId: 'CENTER-SPAN', position: { x: 0, y: 0.3, z: 0.5 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'DHT22-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 100, signalStrength: 100, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'RAIN-01', sensorType: 'RAIN' as const, bridgeId: 'BRIDGE-001', zoneId: 'CENTER-SPAN', position: { x: 0, y: 0.3, z: 0.5 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'RAIN-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 100, signalStrength: 100, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
  { sensorId: 'DIST-01', sensorType: 'HC_SR04' as const, bridgeId: 'BRIDGE-001', zoneId: 'CENTER-SPAN', position: { x: 0, y: 0, z: 0.6 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, calibrationProfileId: 'HC_SR04-DEFAULT', status: 'NORMAL' as const, healthScore: 100, batteryLevel: 95, signalStrength: 97, lastUpdate: new Date().toISOString(), dataSource: 'SIMULATION' as const },
];

function AppProviders({ children }: { children: React.ReactNode }) {
  const { loadBuiltInScenarios } = useScenarioStore();
  const { addConfiguration } = useSensorStore();
  const { play, pause } = useSimulationStore();

  useEffect(() => {
    loadBuiltInScenarios();
    DEFAULT_SENSORS.forEach((s) => addConfiguration(s as any));

    const sensorState = useSensorStore.getState();
    sensorState.calibrationProfiles.forEach((profile) => calibrationEngine.registerProfile(profile));

    const bridge = useBridgeStore.getState();
    const coordinateSystem = bridge.coordinateSystem;
    if (!coordinateSystem) {
      throw new Error('Cannot start live telemetry without a bridge coordinate system.');
    }

    const engine = new SimulationEngine({
      seed: 'infraguard-live-demo',
      bridgeId: 'BRIDGE-001',
      coordinateSystem,
      zones: bridge.zones,
      components: bridge.components,
      sensors: Array.from(sensorState.configurations.values()),
      bridgeLength: coordinateSystem.boundingBox.max.x - coordinateSystem.boundingBox.min.x,
      bridgeWidth: coordinateSystem.boundingBox.max.z - coordinateSystem.boundingBox.min.z,
      lanes: 2,
    });
    engine.initialize();
    engine.start();
    play();

    return () => {
      engine.destroy();
      pause();
    };
  }, [loadBuiltInScenarios, addConfiguration, play, pause]);

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/digital-twin" element={<DigitalTwinPage />} />
        <Route path="/live-monitoring" element={<LiveMonitoringPage />} />
        <Route path="/sensors" element={<SensorsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/bridge-models" element={<BridgeModelsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/data-flow" element={<DataFlowPage />} />
        <Route path="/hardware" element={<HardwarePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

