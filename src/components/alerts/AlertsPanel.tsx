import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Radio, Filter, X } from 'lucide-react';
import { useAlertStore } from '../../stores/alertStore';
import { AlertSeverity } from '../../types/alert';

export function AlertsPanel() {
  const { alerts, summary, getFilteredAlerts, acknowledgeAlert, dismissAlert, setFilter, filter } = useAlertStore();
  const filteredAlerts = getFilteredAlerts();

  const severityColors: Record<AlertSeverity, string> = {
    INFO: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10',
    WARNING: 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10',
    CRITICAL: 'text-[var(--accent-red)] bg-[var(--accent-red)]/10',
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-[var(--fg-primary)]">Alerts</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors.CRITICAL}`}>{summary.critical}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors.WARNING}`}>{summary.warning}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors.INFO}`}>{summary.info}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['CRITICAL', 'WARNING', 'INFO'] as AlertSeverity[]).map((severity) => (
            <button
              key={severity}
              onClick={() => setFilter({ ...filter, severity: filter.severity?.includes(severity) ? filter.severity.filter((s) => s !== severity) : [...(filter.severity || []), severity] })}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filter.severity?.includes(severity) ? severityColors[severity] : 'text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              {severity}
            </button>
          ))}
          <button
            onClick={() => setFilter({})}
            className="px-2 py-1 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]"
          >
            <X className="w-3 h-3 mr-1" /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-[var(--fg-muted)]">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No alerts</p>
            <p className="text-sm mt-1">All systems nominal</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.alertId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`p-3 rounded-lg border ${severityColors[alert.severity]} border-opacity-20 ${alert.acknowledged ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  <AlertTriangle className={`w-5 h-5 ${severityColors[alert.severity]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[var(--fg-primary)] truncate">{alert.cause}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--fg-secondary)]">
                    <span><MapPin className="w-3 h-3 inline mr-1" /> {alert.zoneId}</span>
                    <span><Radio className="w-3 h-3 inline mr-1" /> {alert.sensorId}</span>
                    <span><Clock className="w-3 h-3 inline mr-1" /> {formatTime(alert.timestamp)}</span>
                    {alert.componentId && <span>Component: {alert.componentId}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[var(--fg-muted)]">Value: {alert.value.toFixed(2)} / Threshold: {alert.threshold.toFixed(2)}</span>
                    <span className="text-xs text-[var(--fg-muted)]">Health: {alert.healthScore.toFixed(0)}%</span>
                  </div>
                  {!alert.acknowledged && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className="px-3 py-1.5 bg-[var(--accent-green)]/20 text-[var(--accent-green)] rounded text-sm font-medium hover:bg-[var(--accent-green)]/30 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Acknowledge
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.alertId)}
                        className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] rounded text-sm font-medium hover:bg-[var(--border-primary)] flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Dismiss
                      </button>
                    </div>
                  )}
                  {alert.acknowledged && (
                    <p className="text-xs text-[var(--accent-green)] mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Acknowledged at {formatTime(alert.acknowledgedAt!)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}