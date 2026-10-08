import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MapPin, Radio, Zap, Thermometer, Gauge, Droplet, Cloud, Target, Edit, Trash2, Copy, Eye, EyeOff, Battery, Wifi, AlertTriangle, CheckCircle, XCircle, RotateCcw, Download } from 'lucide-react';
import { useSensorStore } from '../stores/sensorStore';
import { useBridgeStore } from '../stores/bridgeStore';
import { SensorConfiguration, SensorType, SensorStatus } from '../types';
import { exportSensorsToCSV, downloadFile } from '../services/export';

export function SensorsPage() {
  const { configurations, getConfigurationsByZone, getConfigurationsByType, addConfiguration, removeConfiguration, updateConfiguration, updateStatus, selectSensor, selectedSensorId, placementMode, setPlacementMode, placementSensorType } = useSensorStore();
  const { zones } = useBridgeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SensorType | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<SensorStatus | 'ALL'>('ALL');

  const sensors = useMemo(() => {
    let result = Array.from(configurations.values());
    if (searchQuery) {
      result = result.filter((s) => s.sensorId.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (typeFilter !== 'ALL') {
      result = result.filter((s) => s.sensorType === typeFilter);
    }
    if (zoneFilter !== 'ALL') {
      result = result.filter((s) => s.zoneId === zoneFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [configurations, searchQuery, typeFilter, zoneFilter, statusFilter]);

  const sensorTypes: SensorType[] = ['MPU6050', 'STRAIN', 'LOAD_CELL', 'HX711', 'DHT22', 'RAIN', 'HC_SR04'];

  const handleAddSensor = () => {
    const newId = `${typeFilter !== 'ALL' ? typeFilter.slice(0, 3).toUpperCase() : 'NEW'}-${Date.now().toString(36).toUpperCase()}`;
    const newSensor: SensorConfiguration = {
      sensorId: newId,
      sensorType: typeFilter !== 'ALL' ? typeFilter : 'MPU6050',
      bridgeId: 'BRIDGE-001',
      zoneId: zones[0]?.zoneId || 'CENTER-SPAN',
      position: { x: 0, y: 0, z: 0.4 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      calibrationProfileId: `${typeFilter !== 'ALL' ? typeFilter : 'MPU6050'}-DEFAULT`,
      status: 'NORMAL',
      healthScore: 100,
      batteryLevel: 100,
      signalStrength: 100,
      lastUpdate: new Date().toISOString(),
      dataSource: 'SIMULATION',
    };
    addConfiguration(newSensor);
    selectSensor(newId);
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--fg-primary)]">Sensors</h1>
            <p className="text-[var(--fg-secondary)] mt-1">Manage and configure bridge sensors</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlacementMode(true, typeFilter !== 'ALL' ? typeFilter : undefined)}
              className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Sensor
            </button>
            <button
              onClick={() => setPlacementMode(!placementMode, placementSensorType || undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${placementMode ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--border-primary)]'}`}
            >
              <MapPin className="w-4 h-4" />
              {placementMode ? 'Exit Placement' : 'Place on Bridge'}
            </button>
            <button
              onClick={() => {
                const csv = exportSensorsToCSV(Array.from(configurations.values()));
                downloadFile('infraguard-sensors.csv', csv, 'text/csv');
              }}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-medium hover:bg-[var(--border-primary)] flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel"
        >
          <div className="panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-medium text-[var(--fg-primary)]">Sensor List ({sensors.length})</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
                <input
                  type="text"
                  placeholder="Search sensors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] w-64"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
              >
                <option value="ALL">All Types</option>
                {sensorTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
              >
                <option value="ALL">All Zones</option>
                {zones.map((z) => <option key={z.zoneId} value={z.zoneId}>{z.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
              >
                <option value="ALL">All Status</option>
                {(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'STALE', 'DEGRADED'] as SensorStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="panel-content">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--fg-muted)] border-b border-[var(--border-primary)]">
                    <th className="pb-2 px-3 font-medium">Sensor ID</th>
                    <th className="pb-2 px-3 font-medium">Type</th>
                    <th className="pb-2 px-3 font-medium">Zone</th>
                    <th className="pb-2 px-3 font-medium">Status</th>
                    <th className="pb-2 px-3 font-medium">Health</th>
                    <th className="pb-2 px-3 font-medium">Signal</th>
                    <th className="pb-2 px-3 font-medium">Battery</th>
                    <th className="pb-2 px-3 font-medium">Source</th>
                    <th className="pb-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((sensor, index) => (
                    <motion.tr
                      key={sensor.sensorId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-[var(--border-primary)]/50 hover:bg-[var(--bg-tertiary)] ${selectedSensorId === sensor.sensorId ? 'bg-[var(--accent-cyan)]/5' : ''}`}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-[var(--fg-primary)]">{sensor.sensorId}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs">{sensor.sensorType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[var(--fg-secondary)]">{zones.find((z) => z.zoneId === sensor.zoneId)?.name || sensor.zoneId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${{
                          NORMAL: 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]',
                          WARNING: 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]',
                          CRITICAL: 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]',
                          OFFLINE: 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]',
                          STALE: 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]',
                          DEGRADED: 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]',
                        }[sensor.status]}`}>
                          {sensor.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${sensor.healthScore}%`, backgroundColor: sensor.healthScore >= 90 ? 'var(--accent-green)' : sensor.healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }} />
                          </div>
                          <span className="text-sm font-medium tabular-nums">{sensor.healthScore.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">{sensor.signalStrength.toFixed(0)}%</td>
                      <td className="py-3 px-3">{sensor.batteryLevel.toFixed(0)}%</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${sensor.dataSource === 'SIMULATION' ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' : 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'}`}>
                          {sensor.dataSource}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => selectSensor(sensor.sensorId)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]" title="Inspect"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => updateConfiguration(sensor.sensorId, { status: sensor.status === 'NORMAL' ? 'WARNING' : 'NORMAL' })} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]" title="Toggle Warning"><AlertTriangle className="w-4 h-4" /></button>
                          <button onClick={() => updateConfiguration(sensor.sensorId, { status: 'OFFLINE' })} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)]" title="Simulate Offline"><XCircle className="w-4 h-4" /></button>
                          <button onClick={() => removeConfiguration(sensor.sensorId)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--accent-red)]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <StatCard title="Total Sensors" value={configurations.size} icon={<Radio className="w-6 h-6" />} color="var(--accent-blue)" />
          <StatCard title="Online" value={Array.from(configurations.values()).filter((s) => s.status !== 'OFFLINE').length} icon={<CheckCircle className="w-6 h-6" />} color="var(--accent-green)" />
          <StatCard title="Warnings" value={Array.from(configurations.values()).filter((s) => s.status === 'WARNING').length} icon={<AlertTriangle className="w-6 h-6" />} color="var(--accent-amber)" />
        </motion.div>
      </div>
    </div>
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
        <div className="flex items-center gap-4">
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
