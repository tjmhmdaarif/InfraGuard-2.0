import { AlertTriangle } from 'lucide-react';
import { useAlertStore } from '../../stores/alertStore';

interface IncidentTableProps {
  maxRows?: number;
}

export function IncidentTable({ maxRows = 10 }: IncidentTableProps) {
  const alerts = useAlertStore((state) => state.alerts)
    .filter((alert) => !alert.dismissed)
    .slice(0, maxRows);

  if (alerts.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--fg-muted)]">
        <AlertTriangle className="h-5 w-5" />
        <p>No active alerts. New threshold events will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div key={alert.alertId} className="flex items-center gap-3 rounded-lg bg-[var(--bg-tertiary)] p-2">
          <AlertTriangle className={`h-4 w-4 ${alert.severity === 'CRITICAL' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-amber)]'}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--fg-primary)]">{alert.cause}</p>
            <p className="text-xs text-[var(--fg-secondary)]">{alert.sensorId} · {alert.zoneId} · {alert.severity}</p>
          </div>
          <time className="text-xs font-mono text-[var(--fg-muted)]">{new Date(alert.timestamp).toLocaleTimeString()}</time>
        </div>
      ))}
    </div>
  );
}