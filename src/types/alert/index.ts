export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  alertId: string;
  timestamp: string;
  simulationTime: number;
  severity: AlertSeverity;
  sensorId: string;
  zoneId: string;
  componentId?: string;
  cause: string;
  value: number;
  threshold: number;
  healthScore: number;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  dismissed: boolean;
  dismissedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertAction {
  type: 'ACKNOWLEDGE' | 'DISMISS' | 'VIEW_SENSOR' | 'VIEW_LOCATION' | 'VIEW_TIMELINE';
  alertId: string;
  timestamp: string;
}

export interface AlertFilter {
  severity?: AlertSeverity[];
  zoneId?: string[];
  sensorId?: string[];
  acknowledged?: boolean;
  dateRange?: { start: string; end: string };
}

export interface AlertSummary {
  total: number;
  info: number;
  warning: number;
  critical: number;
  unacknowledged: number;
  byZone: Record<string, number>;
  bySensor: Record<string, number>;
  recentCount: number;
}

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  INFO: '#3b82f6',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: 'Information',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
};