import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Thermometer, Car, Cloud, Radio, AlertTriangle, Loader2 } from 'lucide-react';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useSensorStore } from '../../stores/sensorStore';
import { useAlertStore } from '../../stores/alertStore';

interface StreamEvent {
  id: string;
  timestamp: number;
  type: 'telemetry' | 'alert' | 'vehicle' | 'weather';
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export function EventStreamPanel() {
  const { history } = useTelemetryStore();
  const { alerts } = useAlertStore();
  const { configurations } = useSensorStore();

  const events = useMemo(() => {
    const events: StreamEvent[] = [];

    history.slice(-20).forEach((packet) => {
      if (packet.status !== 'NORMAL') {
        events.push({
          id: `tel-${packet.timestamp}-${packet.sensorId}`,
          timestamp: new Date(packet.timestamp).getTime(),
          type: 'telemetry',
          source: packet.sensorId,
          message: `${packet.sensorType}: ${packet.status} (${packet.anomalyScore.toFixed(2)} anomaly)`,
          severity: packet.status === 'CRITICAL' ? 'critical' : 'warning',
        });
      }
    });

    alerts.slice(-10).forEach((alert) => {
      events.push({
        id: alert.alertId,
        timestamp: new Date(alert.timestamp).getTime(),
        type: 'alert',
        source: alert.sensorId,
        message: `ALERT: ${alert.cause}`,
        severity: alert.severity.toLowerCase() as 'info' | 'warning' | 'critical',
      });
    });

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [history, alerts]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const getIcon = (type: StreamEvent['type']) => {
    switch (type) {
      case 'telemetry': return <Zap className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'vehicle': return <Car className="w-4 h-4" />;
      case 'weather': return <Cloud className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: StreamEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-[var(--accent-red)]';
      case 'warning': return 'text-[var(--accent-amber)]';
      default: return 'text-[var(--accent-blue)]';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-2">
      <h3 className="font-medium text-[var(--fg-primary)]">Event Stream</h3>

      {events.length === 0 ? (
        <div className="text-center py-12 text-[var(--fg-muted)]">
          <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-30 animate-spin" />
          <p>Waiting for events...</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
              className="flex gap-2 p-2 rounded bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span className="font-mono text-xs text-[var(--fg-muted)] w-24 shrink-0">{formatTime(event.timestamp)}</span>
              <div className={`flex-shrink-0 p-1 rounded ${getSeverityColor(event.severity)}/20`}>
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--fg-primary)] truncate">{event.message}</p>
                <p className="text-xs text-[var(--fg-muted)]">{event.source} • {event.type}</p>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(event.severity)}/20 ${getSeverityColor(event.severity)}`}>
                {event.severity.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}