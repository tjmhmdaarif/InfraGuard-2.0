import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Box, Check, Download, ExternalLink, Play, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../stores/bridgeStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { BridgeModel } from '../types/bridge';
import type { SensorConfiguration, SensorType } from '../types/sensor';
import { ImportBridgeModal } from '../components/bridge-models/ImportBridgeModal';

const SIMULATED_SENSOR_TYPES: SensorType[] = ['MPU6050', 'STRAIN', 'HC_SR04'];

const MODEL_REFERENCES = [
  {
    id: 'bridge',
    title: 'Stiefern railway bridge',
    creator: 'Markus Wintersberger / medienwerkstatt006',
    page: 'https://sketchfab.com/3d-models/granat-kamp-eisenbahnbrucke-stiefern-2006-ab1253541ca8456dbe16dd2b5d1b533a',
    license: 'CC BY 4.0 · attribution required',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    note: 'Published dimensions inform the original parametric truss proportions. The Sketchfab mesh is not bundled.',
  },
  {
    id: 'vehicles',
    title: 'Farm vehicle pack 2',
    creator: 'Sidra / Sidramax',
    page: 'https://sketchfab.com/3d-models/3d-model-farm-vehicle-pack-2-4faa097943f6482a9949d4f88c1e5566',
    license: 'Standard · viewer reference only',
    licenseUrl: 'https://sketchfab.com/licenses',
    note: 'The source is not downloadable under its current listing. The twin uses independently authored procedural vehicle geometry.',
  },
] as const;

function createSimulationSensors(model: BridgeModel): SensorConfiguration[] {
  return SIMULATED_SENSOR_TYPES.map((sensorType, index) => {
    const zone = model.zones[Math.min(model.zones.length - 1, Math.floor((index / SIMULATED_SENSOR_TYPES.length) * model.zones.length))];
    const sensorId = `${model.id}-${sensorType}-${index + 1}`;
    return {
      sensorId,
      sensorType,
      bridgeId: model.id,
      zoneId: zone?.zoneId ?? 'CENTER-SPAN',
      position: zone?.center ?? { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      calibrationProfileId: `${sensorType}-DEFAULT`,
      status: 'NORMAL',
      healthScore: 100,
      batteryLevel: 100,
      signalStrength: 100,
      lastUpdate: new Date().toISOString(),
      dataSource: 'SIMULATION',
    };
  });
}

function downloadModelConfiguration(model: BridgeModel): void {
  const file = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-configuration.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function BridgeModelsPage() {
  const navigate = useNavigate();
  const models = useBridgeStore((state) => state.models);
  const activeModelId = useBridgeStore((state) => state.activeModelId);
  const loadModel = useBridgeStore((state) => state.loadModel);
  const removeModel = useBridgeStore((state) => state.removeModel);
  const setActiveModel = useBridgeStore((state) => state.setActiveModel);
  const setActiveBridge = useBridgeStore((state) => state.setActiveBridge);
  const latestPackets = useTelemetryStore((state) => state.latestPackets);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [comparisonRunning, setComparisonRunning] = useState(false);

  const modelList = useMemo(() => Array.from(models.values()), [models]);
  const selectedModels = useMemo(
    () => modelList.filter((model) => selectedModelIds.includes(model.id)),
    [modelList, selectedModelIds],
  );

  useEffect(() => {
    if (!comparisonRunning) return;
    const engines = selectedModels.map((model) => {
      const sensors = createSimulationSensors(model);
      const engine = new SimulationEngine({
        seed: `comparison-${model.id}`,
        bridgeId: model.id,
        coordinateSystem: model.coordinateSystem,
        zones: model.zones,
        components: model.components,
        sensors,
        bridgeLength: Math.max(1, model.metadata.span),
        bridgeWidth: Math.max(1, model.metadata.width),
        lanes: 2,
        publishSimulationClock: false,
      });
      engine.initialize();
      engine.start();
      return engine;
    });

    return () => engines.forEach((engine) => engine.destroy());
  }, [comparisonRunning, selectedModels]);

  const toggleModelSelection = (modelId: string) => {
    setSelectedModelIds((current) => current.includes(modelId)
      ? current.filter((id) => id !== modelId)
      : current.length < 4
        ? [...current, modelId]
        : current);
  };

  const handleActivateModel = (model: BridgeModel) => {
    setActiveModel(model.id);
    setActiveBridge(model.id);
    navigate('/digital-twin');
  };

  return (
    <main className="h-full w-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-7">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--fg-primary)]">Bridge models</h1>
            <p className="mt-1 max-w-2xl text-[var(--fg-secondary)]">Import geometry, define monitoring zones, and compare simulated sensor response across bridges.</p>
          </div>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="btn-primary inline-flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Import model
          </button>
        </motion.header>

        <section className="panel overflow-hidden" aria-labelledby="reference-models-heading">
          <div className="panel-header">
            <h2 id="reference-models-heading" className="font-medium text-[var(--fg-primary)]">Reference models</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--fg-secondary)]">
              The bridge and traffic in the twin are original procedural geometry informed by broad engineering forms and vehicle categories. No Sketchfab mesh or texture is copied into the app. Originality is not a legal determination of copyright status.
            </p>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {MODEL_REFERENCES.map((reference) => (
              <article key={reference.id} className="min-w-0 border-l-2 border-[var(--border-secondary)] pl-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-[var(--fg-primary)]">{reference.title}</h3>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">By {reference.creator}</p>
                    <p className="mt-2 text-sm text-[var(--fg-secondary)]">{reference.note}</p>
                    <p className="mt-2 text-xs text-[var(--fg-muted)]">
                      {reference.license} ·{' '}
                      <a
                        href={reference.licenseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-[var(--fg-primary)]"
                      >
                        license
                      </a>
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <a href={reference.page} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" /> View on Sketchfab
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel overflow-hidden" aria-labelledby="comparison-heading">
          <div className="panel-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="comparison-heading" className="font-medium text-[var(--fg-primary)]">Integrity comparison</h2>
              <p className="mt-1 text-sm text-[var(--fg-secondary)]">Choose up to four models to run independent simulated traffic and sensor feeds.</p>
            </div>
            <button
              type="button"
              onClick={() => setComparisonRunning((running) => !running)}
              disabled={selectedModels.length < 2}
              className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {comparisonRunning ? <Activity className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {comparisonRunning ? 'Stop comparison' : 'Run comparison'}
            </button>
          </div>
          <div className="panel-content">
            {modelList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-secondary)] px-5 py-8 text-center">
                <Box className="mx-auto h-8 w-8 text-[var(--fg-muted)]" />
                <h3 className="mt-3 font-medium text-[var(--fg-primary)]">No bridge models imported</h3>
                <p className="mx-auto mt-1 max-w-lg text-sm text-[var(--fg-secondary)]">Import a GLB, self-contained glTF, or OBJ model to create bridge-specific zones and run a clearly labeled simulation.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {modelList.map((model) => {
                    const packets = Array.from(latestPackets.values()).filter((packet) => packet.bridgeId === model.id);
                    const health = packets.length > 0
                      ? Math.round(packets.reduce((sum, packet) => sum + packet.healthScore, 0) / packets.length)
                      : null;
                    const density = packets.length > 0
                      ? packets.reduce((sum, packet) => sum + packet.trafficDensity, 0) / packets.length
                      : null;
                    const selected = selectedModelIds.includes(model.id);
                    return (
                      <button
                        type="button"
                        key={model.id}
                        aria-pressed={selected}
                        onClick={() => toggleModelSelection(model.id)}
                        className={`rounded-lg border p-4 text-left transition-colors ${selected ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)]'}`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium text-[var(--fg-primary)]">{model.name}</span>
                          {selected && <Check className="h-4 w-4 shrink-0 text-[var(--accent-cyan)]" />}
                        </span>
                        <span className="mt-3 block font-mono text-2xl tabular-nums text-[var(--fg-primary)]">
                          {health === null ? 'Waiting' : `${health}%`}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--fg-secondary)]">
                          {comparisonRunning && selected ? `Simulated traffic ${density?.toFixed(0) ?? '0'}%` : 'Select to include in comparison'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-[var(--fg-muted)]">
                  {comparisonRunning
                    ? 'Simulation results are illustrative telemetry, not a structural safety assessment.'
                    : 'Select at least two models. Simulation starts only when you run the comparison.'}
                </p>
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="models-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="models-heading" className="text-lg font-semibold text-[var(--fg-primary)]">Model library</h2>
            <span className="font-mono text-sm text-[var(--fg-muted)]">{modelList.length} imported</span>
          </div>
          {modelList.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {modelList.map((model, index) => (
                <motion.article
                  key={model.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.2) }}
                  className="panel overflow-hidden"
                >
                  <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="flex min-h-40 flex-col justify-between bg-[var(--bg-tertiary)] p-4">
                      <Box className="h-8 w-8 text-[var(--accent-cyan)]" />
                      <div className="min-w-0">
                        <span className="block truncate text-xs text-[var(--fg-muted)]">{model.metadata.sourceFormat ?? 'Imported geometry'}</span>
                        <span className="mt-1 block text-sm font-medium text-[var(--fg-primary)]">{activeModelId === model.id ? 'Active model' : 'Imported geometry'}</span>
                      </div>
                    </div>
                    <div className="min-w-0 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-[var(--fg-primary)]">{model.name}</h3>
                          <p className="mt-1 text-sm text-[var(--fg-secondary)]">{model.description}</p>
                        </div>
                        <span className="shrink-0 text-xs text-[var(--fg-muted)]">{model.metadata.location ?? 'Location not set'}</span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-4">
                        <div><dt className="text-xs text-[var(--fg-muted)]">Span</dt><dd className="mt-1 font-mono">{model.metadata.span ? `${model.metadata.span.toFixed(2)} ${model.metadata.sourceUnit ?? 'units'}` : 'Not available'}</dd></div>
                        <div><dt className="text-xs text-[var(--fg-muted)]">Width</dt><dd className="mt-1 font-mono">{model.metadata.width ? `${model.metadata.width.toFixed(2)} ${model.metadata.sourceUnit ?? 'units'}` : 'Not available'}</dd></div>
                        <div><dt className="text-xs text-[var(--fg-muted)]">Zones</dt><dd className="mt-1 font-mono">{model.zones.length}</dd></div>
                        <div><dt className="text-xs text-[var(--fg-muted)]">Sensors</dt><dd className="mt-1 font-mono">{model.defaultSensors.length || 'Add in simulation'}</dd></div>
                      </dl>
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-primary)] pt-4">
                        <button type="button" onClick={() => handleActivateModel(model)} className="btn-primary inline-flex items-center gap-2">
                          <Box className="h-4 w-4" /> Open in twin
                        </button>
                        <button type="button" onClick={() => downloadModelConfiguration(model)} className="btn-secondary inline-flex items-center gap-2">
                          <Download className="h-4 w-4" /> Export config
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setComparisonRunning(false);
                            setSelectedModelIds((current) => current.filter((id) => id !== model.id));
                            removeModel(model.id);
                          }}
                          className="btn-secondary inline-flex items-center gap-2 text-[var(--accent-red)]"
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <ImportBridgeModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={(model) => {
            loadModel(model);
            setImportModalOpen(false);
          }}
        />
      </div>
    </main>
  );
}
