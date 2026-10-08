import { TelemetryPacket } from '../types/telemetry';
import { Alert } from '../types/alert';
import { SensorConfiguration } from '../types/sensor';

export function exportTelemetryToCSV(packets: TelemetryPacket[]): string {
  if (packets.length === 0) return '';
  const headers = ['timestamp', 'bridgeId', 'zoneId', 'sensorId', 'sensorType', 'vibration_magnitude', 'strain', 'load', 'temperature', 'humidity', 'rainfall', 'displacement', 'trafficDensity', 'vehicleLoad', 'anomalyScore', 'healthScore', 'status', 'dataSource'];
  const rows = packets.map((p) => [
    p.timestamp,
    p.bridgeId,
    p.zoneId,
    p.sensorId,
    p.sensorType,
    p.vibration?.magnitude?.toFixed(4) ?? '',
    p.strain?.strain?.toFixed(2) ?? '',
    p.load?.load?.toFixed(2) ?? '',
    p.temperature?.toFixed(2) ?? '',
    p.humidity?.toFixed(1) ?? '',
    p.rainfall?.toFixed(1) ?? '',
    p.displacement?.toFixed(2) ?? '',
    p.trafficDensity,
    p.vehicleLoad,
    p.anomalyScore.toFixed(3),
    p.healthScore.toFixed(1),
    p.status,
    p.dataSource,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportAlertsToCSV(alerts: Alert[]): string {
  if (alerts.length === 0) return '';
  const headers = ['alertId', 'timestamp', 'severity', 'sensorId', 'zoneId', 'componentId', 'cause', 'value', 'threshold', 'healthScore', 'acknowledged', 'dismissed'];
  const rows = alerts.map((a) => [
    a.alertId,
    a.timestamp,
    a.severity,
    a.sensorId,
    a.zoneId,
    a.componentId ?? '',
    `"${a.cause.replace(/"/g, '""')}"`,
    a.value.toFixed(2),
    a.threshold.toFixed(2),
    a.healthScore.toFixed(1),
    a.acknowledged,
    a.dismissed,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportSensorsToCSV(sensors: SensorConfiguration[]): string {
  if (sensors.length === 0) return '';
  const headers = ['sensorId', 'sensorType', 'bridgeId', 'zoneId', 'position_x', 'position_y', 'position_z', 'status', 'healthScore', 'batteryLevel', 'signalStrength', 'lastUpdate', 'dataSource'];
  const rows = sensors.map((s) => [
    s.sensorId,
    s.sensorType,
    s.bridgeId,
    s.zoneId,
    s.position.x.toFixed(3),
    s.position.y.toFixed(3),
    s.position.z.toFixed(3),
    s.status,
    s.healthScore.toFixed(1),
    s.batteryLevel.toFixed(1),
    s.signalStrength.toFixed(1),
    s.lastUpdate,
    s.dataSource,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}