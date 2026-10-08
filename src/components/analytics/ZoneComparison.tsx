import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Thermometer, Zap, Target, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ZoneHealth } from '../../types/health';

const ZONE_COLORS: Record<string, string> = {
  'LEFT-SUPPORT': '#3b82f6',
  'LEFT-SPAN': '#06b6d4',
  'CENTER-SPAN': '#10b981',
  'RIGHT-SPAN': '#f59e0b',
  'RIGHT-SUPPORT': '#ef4444',
};

const ZONE_LABELS: Record<string, string> = {
  'LEFT-SUPPORT': 'Left Support',
  'LEFT-SPAN': 'Left Span',
  'CENTER-SPAN': 'Center Span',
  'RIGHT-SPAN': 'Right Span',
  'RIGHT-SUPPORT': 'Right Support',
};

interface ZoneComparisonProps {
  zoneHealths: Map<string, ZoneHealth>;
}

export function ZoneComparison({ zoneHealths }: ZoneComparisonProps) {
  const zones = useMemo(() => {
    const defaultZones = ['LEFT-SUPPORT', 'LEFT-SPAN', 'CENTER-SPAN', 'RIGHT-SPAN', 'RIGHT-SUPPORT'];
    return defaultZones.map((zoneId) => ({
      zoneId,
      label: ZONE_LABELS[zoneId] || zoneId,
      color: ZONE_COLORS[zoneId] || '#6b7280',
      health: zoneHealths.get(zoneId),
    }));
  }, [zoneHealths]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-header">
        <h3 className="font-medium text-[var(--fg-primary)]">Zone Health Comparison</h3>
      </div>
      <div className="panel-content space-y-3">
        {zones.map((zone, index) => (
          <motion.div
            key={zone.zoneId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${zone.color}/20`}>
                  <MapPin className={`w-5 h-5 ${zone.color}`} />
                </div>
                <div>
                  <p className="font-medium text-[var(--fg-primary)]">{zone.label}</p>
                  <p className="text-xs text-[var(--fg-secondary)]">{zone.zoneId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {zone.health && (
                  <>
                    <span className="text-2xl font-bold text-[var(--fg-primary)]">{zone.health.health.toFixed(0)}%</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      zone.health.status === 'NORMAL' ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]' :
                      zone.health.status === 'WARNING' ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]' :
                      'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
                    }`}>
                      {zone.health.status}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-500"
                initial={{ width: 0 }}
                animate={{ width: zone.health ? `${zone.health.health}%` : '0%' }}
                style={{
                  backgroundColor:
                    zone.health && zone.health.health >= 90 ? 'var(--accent-green)' :
                    zone.health && zone.health.health >= 60 ? 'var(--accent-amber)' :
                    zone.health ? 'var(--accent-red)' : 'var(--fg-muted)',
                }}
              />
            </div>

            {zone.health && (
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <StatMini label="Sensors" value={zone.health.sensorCount} icon={<Radio className="w-3 h-3" />} />
                <StatMini label="Normal" value={zone.health.sensorCount - zone.health.warningCount - zone.health.criticalCount - zone.health.offlineCount} icon={<CheckCircle className="w-3 h-3 text-[var(--accent-green)]" />} />
                <StatMini label="Warnings" value={zone.health.warningCount} icon={<AlertTriangle className="w-3 h-3 text-[var(--accent-amber)]" />} />
                <StatMini label="Critical" value={zone.health.criticalCount} icon={<XCircle className="w-3 h-3 text-[var(--accent-red)]" />} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StatMini({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-[var(--bg-primary)] rounded">
      {icon}
      <span className="font-medium text-[var(--fg-primary)]">{value}</span>
      <span className="text-[var(--fg-muted)]">{label}</span>
    </div>
  );
}