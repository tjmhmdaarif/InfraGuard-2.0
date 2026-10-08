import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Zap, Thermometer, Car, Cloud, MapPin, Info } from 'lucide-react';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useAlertStore } from '../../stores/alertStore';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'vehicle' | 'sensor' | 'alert' | 'weather' | 'scenario';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  sensorId?: string;
  zoneId?: string;
}

export function TimelinePanel() {
  const { history } = useTelemetryStore();
  const { alerts } = useAlertStore();

  const events = useMemo(() => {
    const events: TimelineEvent[] = [];

    alerts.slice(0, 20).forEach((alert) => {
      events.push({
        id: alert.alertId,
        timestamp: alert.timestamp,
        type: 'alert',
        title: `${alert.severity}: ${alert.cause}`,
        description: `Sensor ${alert.sensorId} in ${alert.zoneId}`,
        severity: alert.severity.toLowerCase() as 'info' | 'warning' | 'critical',
        sensorId: alert.sensorId,
        zoneId: alert.zoneId,
      });
    });

    const recentTelemetry = history.slice(-50);
    recentTelemetry.forEach((packet) => {
      if (packet.status === 'WARNING' || packet.status === 'CRITICAL') {
        events.push({
          id: `evt-${packet.timestamp}-${packet.sensorId}`,
          timestamp: packet.timestamp,
          type: 'sensor',
          title: `${packet.sensorType} anomaly`,
          description: `${packet.sensorId}: ${packet.status}`,
          severity: packet.status === 'CRITICAL' ? 'critical' : 'warning',
          sensorId: packet.sensorId,
          zoneId: packet.zoneId,
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
  }, [history, alerts]);

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'vehicle': return <Car className="w-4 h-4" />;
      case 'sensor': return <Zap className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'weather': return <Cloud className="w-4 h-4" />;
      case 'scenario': return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: TimelineEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-[var(--accent-red)] bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20';
      case 'warning': return 'text-[var(--accent-amber)] bg-[var(--accent-amber)]/10 border-[var(--accent-amber)]/20';
      default: return 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/20';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <h3 className="font-medium text-[var(--fg-primary)]">Event Timeline</h3>

      {events.length === 0 ? (
        <div className="text-center py-12 text-[var(--fg-muted)]">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No events recorded yet</p>
          <p className="text-sm mt-1">Start a scenario to generate events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex gap-3 p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
            >
              <div className="flex-shrink-0 w-10 text-center text-xs text-[var(--fg-muted)]">
                {formatTime(event.timestamp)}
              </div>
              <div className={`flex-shrink-0 p-2 rounded ${getSeverityColor(event.severity)}`}>
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--fg-primary)] truncate">{event.title}</p>
                <p className="text-sm text-[var(--fg-secondary)] truncate">{event.description}</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}