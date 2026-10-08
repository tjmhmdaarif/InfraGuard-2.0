import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Box,
  Activity,
  Radio,
  BarChart3,
  PlayCircle,
  Library,
  AlertTriangle,
  GitBranch,
  Cpu,
  Settings,
  Menu,
  X,
  ChevronDown,
  Zap,
  Database,
  Wifi,
  Satellite,
  Info,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useSensorStore } from '../../stores/sensorStore';
import { useAlertStore } from '../../stores/alertStore';

const NAV_ITEMS = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
  { path: '/digital-twin', label: 'Digital Twin', icon: Box, shortcut: '2' },
  { path: '/live-monitoring', label: 'Live Monitoring', icon: Activity, shortcut: '3' },
  { path: '/sensors', label: 'Sensors', icon: Radio, shortcut: '4' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, shortcut: '5' },
  { path: '/scenarios', label: 'Scenarios', icon: PlayCircle, shortcut: '6' },
  { path: '/bridge-models', label: 'Bridge Models', icon: Library, shortcut: '7' },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle, shortcut: '8' },
  { path: '/data-flow', label: 'Data Flow', icon: GitBranch, shortcut: '9' },
  { path: '/hardware', label: 'Hardware', icon: Cpu, shortcut: '0' },
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: 'S' },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentView, setView, toggleCommandPalette, commandPaletteOpen } = useUIStore();
  const { clock, isRunning, speed, play, pause, reset, setSpeed } = useSimulationStore();
  const { getOnlineCount, getTotalCount } = useSensorStore();
  const { summary } = useAlertStore();

  const onlineCount = getOnlineCount();
  const totalCount = getTotalCount();

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (NAV_ITEMS[index]) setView(NAV_ITEMS[index].path.replace('/', '') as any);
    }
    if (e.key === ' ') {
      e.preventDefault();
      isRunning ? pause() : play();
    }
    if (e.key === 'r' || e.key === 'R') {
      reset();
    }
    if (e.key === 'd' || e.key === 'D') {
      setView('digital-twin');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, play, pause, reset, setView, toggleCommandPalette]);

  return (
    <div className="h-dvh min-h-0 w-full flex bg-[var(--bg-primary)] text-[var(--fg-primary)]">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden"
          >
            <SidebarHeader onToggle={() => setSidebarOpen(false)} />
            <Navigation currentPath={location.pathname} />
            <SidebarFooter />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 min-h-0 overflow-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <SimulationStatusBar
          clock={clock}
          isRunning={isRunning}
          speed={speed}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onSpeedChange={setSpeed}
          onlineCount={onlineCount}
          totalCount={totalCount}
          alertCount={summary.unacknowledged}
        />
      </div>

      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} />
      )}

      {commandPaletteOpen && <CommandPalette onClose={toggleCommandPalette} />}
    </div>
  );
}

function SidebarHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] flex items-center justify-center">
          <Zap className="w-6 h-6 text-[var(--bg-primary)]" />
        </div>
        <div>
          <h1 className="font-semibold text-lg text-[var(--fg-primary)]">InfraGuard</h1>
          <p className="text-xs text-[var(--fg-muted)]">Digital Twin Platform</p>
        </div>
      </div>
      <button onClick={onToggle} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]" aria-label="Close sidebar">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function Navigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)] shadow-[0_0_0_1px_var(--accent-cyan)]'
                : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[var(--fg-muted)] font-mono">
              {item.shortcut}
            </kbd>
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { developerMode, toggleDeveloperMode } = useUIStore();

  return (
    <div className="p-3 border-t border-[var(--border-primary)] space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={developerMode}
          onChange={toggleDeveloperMode}
          className="w-4 h-4 accent-[var(--accent-cyan)]"
        />
        <span className="text-sm text-[var(--fg-secondary)]">Developer Mode</span>
      </label>
      <div className="text-xs text-[var(--fg-muted)] flex items-center justify-between">
        <span>v1.0.0-dev</span>
        <Info className="w-4 h-4 opacity-50" />
      </div>
    </div>
  );
}

function TopBar({
  onMenuClick,
  sidebarOpen,
  onSidebarToggle,
}: { onMenuClick: () => void; sidebarOpen: boolean; onSidebarToggle: () => void }) {
  return (
    <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 gap-4">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-center">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <DataSourceIndicator />
        <ConnectionStatus />
      </div>
    </header>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const { currentView } = useUIStore();

  const labels: Record<string, string> = {
    overview: 'Overview',
    'digital-twin': 'Digital Twin',
    'live-monitoring': 'Live Monitoring',
    sensors: 'Sensors',
    analytics: 'Analytics',
    scenarios: 'Scenarios',
    'bridge-models': 'Bridge Models',
    alerts: 'Alerts',
    'data-flow': 'Data Flow',
    hardware: 'Hardware Integration',
    settings: 'Settings',
  };

  return (
    <ol className="flex items-center gap-2 text-sm">
      <li className="text-[var(--fg-muted)]">InfraGuard</li>
      <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
      <li className="text-[var(--fg-primary)] font-medium">{labels[currentView] || 'Dashboard'}</li>
    </ol>
  );
}

function DataSourceIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
      <Database className="w-4 h-4 text-[var(--accent-cyan)]" />
      <span className="text-xs font-medium text-[var(--fg-primary)]">SIMULATION</span>
      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded font-mono">DEMO</span>
    </div>
  );
}

function ConnectionStatus() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]"></span>
        <span className="text-xs text-[var(--fg-secondary)]">MQTT</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]"></span>
        <span className="text-xs text-[var(--fg-secondary)]">InfluxDB</span>
      </div>
    </div>
  );
}

function SimulationStatusBar({
  clock,
  isRunning,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onlineCount,
  totalCount,
  alertCount,
}: {
  clock: any;
  isRunning: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onlineCount: number;
  totalCount: number;
  alertCount: number;
}) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <footer className="h-12 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={isRunning ? onPause : onPlay} className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">
            {isRunning ? <span className="w-5 h-5" style={{ background: 'currentColor', mask: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 24 24%22%3E%3Crect x=%226%22 y=%224%22 width=%224%22 height=%2216%22 fill=%22currentColor%22/%3E%3Crect x=%2214%22 y=%224%22 width=%224%22 height=%2216%22 fill=%22currentColor%22/%3E%3C/svg%3E")' }} /> : <span className="w-5 h-5" style={{ background: 'currentColor', mask: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 24 24%22%3E%3Cpath d=%22M8 5v14l11-7z%22 fill=%22currentColor%22/%3E%3C/svg%3E")' }} />}
          </button>
          <button onClick={onReset} className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors" title="Reset">
            <span className="w-5 h-5" style={{ background: 'currentColor', mask: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 24 24%22%3E%3Cpath d=%22M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8%22 fill=%22currentColor%22/%3E%3C/svg%3E")' }} />
          </button>
        </div>
        <div className="text-mono text-sm font-medium tabular-nums text-[var(--fg-primary)]">
          {formatTime(clock.time)}
        </div>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
        >
          <option value={0.1}>0.1x</option>
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
          <span className="text-[var(--fg-secondary)]">Sensors: {onlineCount}/{totalCount}</span>
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-2 text-[var(--accent-amber)]">
            <AlertTriangle className="w-4 h-4" />
            <span>{alertCount} unacknowledged</span>
          </div>
        )}
      </div>
    </footer>
  );
}

function MobileMenu({ onClose, currentPath }: { onClose: () => void; currentPath: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        className="absolute left-0 top-0 h-full w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] p-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Navigation</h2>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5" /></button>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => { onClose(); window.location.href = item.path; }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === item.path
                  ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]'
                  : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>
    </motion.div>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');

  const COMMANDS = [
    { label: 'Open Digital Twin', action: () => window.location.href = '/digital-twin', keys: ['Ctrl', '1'] },
    { label: 'Open Dashboard', action: () => window.location.href = '/overview', keys: ['Ctrl', '2'] },
    { label: 'Run Demo', action: () => console.log('Run demo'), keys: ['Ctrl', 'D'] },
    { label: 'Pause Simulation', action: () => console.log('Pause'), keys: ['Space'] },
    { label: 'Reset Simulation', action: () => console.log('Reset'), keys: ['R'] },
    { label: 'Toggle Traffic', action: () => console.log('Toggle traffic'), keys: ['T'] },
    { label: 'Toggle Weather', action: () => console.log('Toggle weather'), keys: ['W'] },
    { label: 'Show Critical Sensors', action: () => console.log('Show critical'), keys: ['Ctrl', 'Shift', 'C'] },
    { label: 'Import Bridge', action: () => window.location.href = '/bridge-models', keys: ['Ctrl', 'I'] },
    { label: 'Add Sensor', action: () => console.log('Add sensor'), keys: ['Ctrl', 'Shift', 'S'] },
    { label: 'Open Analytics', action: () => window.location.href = '/analytics', keys: ['Ctrl', '4'] },
    { label: 'Open Data Flow Inspector', action: () => window.location.href = '/data-flow', keys: ['Ctrl', 'Shift', 'D'] },
  ];

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.keys.some((k) => k.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border-primary)]">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search... (⌘K to close)"
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--fg-primary)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors border-b border-[var(--border-primary)] last:border-0"
            >
              <span className="text-[var(--fg-primary)]">{cmd.label}</span>
              <span className="flex items-center gap-1 text-[var(--fg-muted)] text-xs font-mono">
                {cmd.keys.map((k, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[10px]">{k}</kbd>
                ))}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
