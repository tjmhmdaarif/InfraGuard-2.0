import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Thermometer, Zap, Target, MapPin, Radio, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StructuralComponent, ComponentStatus } from '../../types/bridge';
import { useHealthStore } from '../../stores/healthStore';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useSensorStore } from '../../stores/sensorStore';

interface ComponentInspectorPanelProps {
  components: StructuralComponent[];
  onClose: () => void;
}

export function ComponentInspectorPanel({ components, onClose }: ComponentInspectorPanelProps) {
  const { componentHealths } = useHealthStore();
  const { getConfiguration } = useSensorStore();
  const { latestPackets } = useTelemetryStore();

  const statusColors: Record<ComponentStatus, string> = {
    NORMAL: 'text-[var(--accent-green)] bg-[var(--accent-green)]/10',
    WARNING: 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10',
    CRITICAL: 'text-[var(--accent-red)] bg-[var(--accent-red)]/10',
    UNKNOWN: 'text-[var(--fg-muted)] bg-[var(--fg-muted)]/10',
  };

  const getTrend = (health: number) => {
    if (health < 70) return <TrendingUp className="w-4 h-4 text-[var(--accent-red)]" />;
    if (health < 90) return <TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" />;
    return <TrendingDown className="w-4 h-4 text-[var(--accent-green)]" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--fg-primary)]">Structural Components</h3>
            <p className="text-sm text-[var(--fg-secondary)]">{components.length} components monitored</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {components.length === 0 ? (
          <div className="text-center py-12 text-[var(--fg-muted)]">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No structural components are configured for this bridge.</p>
          </div>
        ) : (
          components.map((comp, index) => {
            const health = componentHealths.get(comp.componentId);
            const healthValue = health?.health || 100;
            const status = health?.status || 'UNKNOWN';
            const affectedSensors = health?.affectedSensors || [];
            const factors = health?.contributingFactors || [];

            return (
              <motion.div
                key={comp.componentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 rounded-lg border ${statusColors[status]} border-opacity-20 hover:border-opacity-50 transition-colors`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${statusColors[status]}`}>
                      {comp.componentType.includes('TRUSS') ? <Thermometer className="w-5 h-5" /> :
                       comp.componentType.includes('CHORD') ? <Target className="w-5 h-5" /> :
                       comp.componentType.includes('SUPPORT') ? <MapPin className="w-5 h-5" /> :
                       <Radio className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--fg-primary)]">{comp.componentId}</h4>
                      <p className="text-xs text-[var(--fg-secondary)]">{comp.componentType.replace(/_/g, ' ')} • Zone: {comp.zoneId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrend(healthValue)}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--fg-secondary)]">Health Score</span>
                      <span className="font-medium text-[var(--fg-primary)]">{healthValue.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${healthValue}%`,
                          backgroundColor: healthValue >= 90 ? 'var(--accent-green)' : healthValue >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {factors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--fg-muted)] mb-2">Contributing Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {factors.slice(0, 3).map((factor, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--fg-secondary)]">
                          {factor.factor}: {factor.value.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {affectedSensors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--fg-muted)] mb-2">Affected Sensors:</p>
                    <div className="flex flex-wrap gap-1">
                      {affectedSensors.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded text-xs font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}