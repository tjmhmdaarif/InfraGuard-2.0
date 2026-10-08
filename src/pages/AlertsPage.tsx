import { motion } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, XCircle, Download, Activity } from 'lucide-react';
import { useAlertStore } from '../stores/alertStore';
import { AlertSeverity } from '../types/alert';
import { exportAlertsToCSV, downloadFile } from '../services/export';

export function AlertsPage() {
  const { alerts, summary, getFilteredAlerts, acknowledgeAlert, dismissAlert, clearAcknowledged, setFilter, filter } = useAlertStore();
  const filteredAlerts = getFilteredAlerts();

  const severityColors: Record<AlertSeverity, string> = {
    INFO: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/20',
    WARNING: 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10 border-[var(--accent-amber)]/20',
    CRITICAL: 'text-[var(--accent-red)] bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20',
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  };

  return (
    <main className="h-full w-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Alert Center</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Monitor and manage system alerts</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs text-[var(--fg-muted)]">
              <Activity className="h-4 w-4 text-[var(--accent-green)]" /> Updates with telemetry
            </span>
            <button onClick={clearAcknowledged} disabled={summary.unacknowledged === 0} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-medium hover:bg-[var(--border-primary)] disabled:opacity-50 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Clear Acknowledged
            </button>
            <button onClick={() => {
              const csv = exportAlertsToCSV(filteredAlerts);
              downloadFile('infraguard-alerts.csv', csv, 'text/csv');
            }} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-medium hover:bg-[var(--border-primary)] flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatCard title="Total Alerts" value={summary.total} icon={<AlertTriangle className="w-6 h-6" />} color="var(--accent-blue)" />
          <StatCard title="Critical" value={summary.critical} icon={<AlertTriangle className="w-6 h-6" />} color="var(--accent-red)" />
          <StatCard title="Warnings" value={summary.warning} icon={<AlertTriangle className="w-6 h-6" />} color="var(--accent-amber)" />
          <StatCard title="Unacknowledged" value={summary.unacknowledged} icon={<AlertTriangle className="w-6 h-6" />} color="var(--accent-amber)" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel"
        >
          <div className="panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-medium text-[var(--fg-primary)]">Alerts ({filteredAlerts.length})</h3>
            <div className="flex flex-wrap gap-2">
              {(['CRITICAL', 'WARNING', 'INFO'] as AlertSeverity[]).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setFilter({ ...filter, severity: filter.severity?.includes(severity) ? filter.severity.filter((s) => s !== severity) : [...(filter.severity || []), severity] })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter.severity?.includes(severity) ? severityColors[severity] : 'text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                >
                  {severity}
                </button>
              ))}
              <button onClick={() => setFilter({})} className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]">
                <X className="w-4 h-4 mr-1" /> Clear Filters
              </button>
            </div>
          </div>
          <div className="panel-content">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--fg-muted)] border-b border-[var(--border-primary)]">
                    <th className="pb-2 px-3 font-medium">Time</th>
                    <th className="pb-2 px-3 font-medium">Severity</th>
                    <th className="pb-2 px-3 font-medium">Cause</th>
                    <th className="pb-2 px-3 font-medium">Sensor</th>
                    <th className="pb-2 px-3 font-medium">Zone</th>
                    <th className="pb-2 px-3 font-medium">Value / Threshold</th>
                    <th className="pb-2 px-3 font-medium">Health</th>
                    <th className="pb-2 px-3 font-medium">Status</th>
                    <th className="pb-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, index) => (
                    <motion.tr
                      key={alert.alertId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-[var(--border-primary)]/50 ${alert.acknowledged ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-3 font-mono text-[var(--fg-secondary)]">{formatTime(alert.timestamp)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[alert.severity]}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--fg-primary)] truncate max-w-xs">{alert.cause}</td>
                      <td className="py-3 px-3 font-mono text-[var(--fg-primary)]">{alert.sensorId}</td>
                      <td className="py-3 px-3 text-[var(--fg-secondary)]">{alert.zoneId}</td>
                      <td className="py-3 px-3 font-mono tabular-nums">{alert.value.toFixed(2)} / {alert.threshold.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden max-w-xs">
                            <div className="h-full rounded-full transition-all" style={{ width: `${alert.healthScore}%`, backgroundColor: alert.healthScore >= 90 ? 'var(--accent-green)' : alert.healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }} />
                          </div>
                          <span className="text-xs font-medium">{alert.healthScore.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${alert.acknowledged ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]' : 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'}`}>
                          {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {!alert.acknowledged && (
                            <button onClick={() => acknowledgeAlert(alert.alertId)} className="rounded p-1.5 text-[var(--accent-green)] hover:bg-[var(--bg-tertiary)]" aria-label={`Acknowledge alert ${alert.alertId}`} title="Acknowledge"><CheckCircle className="h-4 w-4" /></button>
                          )}
                          <button onClick={() => dismissAlert(alert.alertId)} className="rounded p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]" aria-label={`Dismiss alert ${alert.alertId}`} title="Dismiss"><XCircle className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredAlerts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <AlertTriangle className="mx-auto h-6 w-6 text-[var(--fg-muted)]" />
                        <p className="mt-2 font-medium text-[var(--fg-primary)]">
                          {alerts.some((alert) => !alert.dismissed) ? 'No alerts match these filters' : 'No active alerts'}
                        </p>
                        <p className="mt-1 text-sm text-[var(--fg-muted)]">
                          {alerts.some((alert) => !alert.dismissed) ? 'Adjust the severity filters to see more results.' : 'New threshold events will appear here as telemetry arrives.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}/20`}>{icon}</div>
          <div>
            <p className="text-sm text-[var(--fg-secondary)]">{title}</p>
            <p className="text-3xl font-bold text-[var(--fg-primary)]">{value}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
