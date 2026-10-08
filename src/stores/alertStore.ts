import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Alert, AlertSeverity, AlertFilter, AlertSummary } from '../types';

function summarizeAlerts(alerts: Alert[]): AlertSummary {
  const recentCutoff = Date.now() - 5 * 60 * 1000;
  const byZone: Record<string, number> = {};
  const bySensor: Record<string, number> = {};
  let info = 0;
  let warning = 0;
  let critical = 0;
  let unacknowledged = 0;
  let recentCount = 0;

  alerts.forEach((alert) => {
    if (alert.severity === 'INFO') info++;
    else if (alert.severity === 'WARNING') warning++;
    else if (alert.severity === 'CRITICAL') critical++;
    if (!alert.acknowledged && !alert.dismissed) unacknowledged++;
    if (Date.parse(alert.timestamp) > recentCutoff) recentCount++;
    byZone[alert.zoneId] = (byZone[alert.zoneId] || 0) + 1;
    bySensor[alert.sensorId] = (bySensor[alert.sensorId] || 0) + 1;
  });

  return { total: alerts.length, info, warning, critical, unacknowledged, byZone, bySensor, recentCount };
}

export interface AlertState {
  alerts: Alert[];
  filter: AlertFilter;
  summary: AlertSummary;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAcknowledged: () => void;
  setFilter: (filter: AlertFilter) => void;
  getFilteredAlerts: () => Alert[];
  updateSummary: () => void;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    alerts: [],
    filter: {},
    summary: { total: 0, info: 0, warning: 0, critical: 0, unacknowledged: 0, byZone: {}, bySensor: {}, recentCount: 0 },

    addAlert: (alert: Alert) =>
      set((state) => {
        const exists = state.alerts.some((a) => a.alertId === alert.alertId);
        if (exists) return state;
        const newAlerts = [alert, ...state.alerts].slice(0, 1000);
        return { alerts: newAlerts, summary: summarizeAlerts(newAlerts) };
      }),

    acknowledgeAlert: (alertId: string) =>
      set((state) => {
        const alerts = state.alerts.map((a) =>
          a.alertId === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
        );
        return { alerts, summary: summarizeAlerts(alerts) };
      }),

    dismissAlert: (alertId: string) =>
      set((state) => {
        const alerts = state.alerts.map((a) =>
          a.alertId === alertId ? { ...a, dismissed: true, dismissedAt: new Date().toISOString() } : a
        );
        return { alerts, summary: summarizeAlerts(alerts) };
      }),

    clearAcknowledged: () =>
      set((state) => {
        const alerts = state.alerts.filter((a) => !a.acknowledged && !a.dismissed);
        return { alerts, summary: summarizeAlerts(alerts) };
      }),

    setFilter: (filter: AlertFilter) =>
      set({ filter }),

    getFilteredAlerts: () => {
      const { alerts, filter } = get();
      return alerts.filter((alert) => {
        if (alert.dismissed) return false;
        if (filter.severity && !filter.severity.includes(alert.severity)) return false;
        if (filter.zoneId && !filter.zoneId.includes(alert.zoneId)) return false;
        if (filter.sensorId && !filter.sensorId.includes(alert.sensorId)) return false;
        if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false;
        if (filter.dateRange) {
          const alertTime = new Date(alert.timestamp).getTime();
          const start = new Date(filter.dateRange.start).getTime();
          const end = new Date(filter.dateRange.end).getTime();
          if (alertTime < start || alertTime > end) return false;
        }
        return true;
      });
    },

    updateSummary: () =>
      set((state) => {
        return { summary: summarizeAlerts(state.alerts) };
      }),
  }))
);

export const useAlerts = () => useAlertStore((state) => state.alerts);
export const useAlertFilter = () => useAlertStore((state) => state.filter);
export const useAlertSummary = () => useAlertStore((state) => state.summary);
export const useAlertActions = () => useAlertStore((state) => ({
  addAlert: state.addAlert,
  acknowledgeAlert: state.acknowledgeAlert,
  dismissAlert: state.dismissAlert,
  clearAcknowledged: state.clearAcknowledged,
  setFilter: state.setFilter,
  getFilteredAlerts: state.getFilteredAlerts,
  updateSummary: state.updateSummary,
}));