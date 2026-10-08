import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  Zap,
  Database,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useSensorStore } from '../../stores/sensorStore';
import { useAlertStore } from '../../stores/alertStore';

const NAV_ITEMS = [
  { path: '/overview',        label: 'Overview',         icon: LayoutDashboard, shortcut: '1' },
  { path: '/digital-twin',    label: 'Digital Twin',     icon: Box,             shortcut: '2' },
  { path: '/live-monitoring', label: 'Live Monitoring',  icon: Activity,        shortcut: '3' },
  { path: '/sensors',         label: 'Sensors',          icon: Radio,           shortcut: '4' },
  { path: '/analytics',       label: 'Analytics',        icon: BarChart3,       shortcut: '5' },
  { path: '/scenarios',       label: 'Scenarios',        icon: PlayCircle,      shortcut: '6' },
  { path: '/bridge-models',   label: 'Bridge Models',    icon: Library,         shortcut: '7' },
  { path: '/alerts',          label: 'Alerts',           icon: AlertTriangle,   shortcut: '8' },
  { path: '/data-flow',       label: 'Data Flow',        icon: GitBranch,       shortcut: '9' },
  { path: '/hardware',        label: 'Hardware',         icon: Cpu,             shortcut: '0' },
  { path: '/settings',        label: 'Settings',         icon: Settings,        shortcut: 'S' },
];

// ── Styled toggle switch ──────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none group">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        {/* Track */}
        <motion.div
          className="w-9 h-5 rounded-full border transition-colors"
          animate={{
            backgroundColor: checked ? 'var(--accent-cyan)' : 'var(--bg-primary)',
            borderColor: checked ? 'var(--accent-cyan)' : 'var(--border-secondary)',
          }}
          transition={{ duration: 0.2 }}
        />
        {/* Thumb */}
        <motion.div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span className="text-sm text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors">
        {label}
      </span>
    </label>
  );
}

// ── Theme toggle button ───────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentView, setView, toggleCommandPalette, commandPaletteOpen } = useUIStore();
  const { clock, isRunning, speed, play, pause, reset, setSpeed } = useSimulationStore();
  const { getOnlineCount, getTotalCount } = useSensorStore();
  const { summary } = useAlertStore();

  const onlineCount = getOnlineCount();
  const totalCount = getTotalCount();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (NAV_ITEMS[index]) {
          navigate(NAV_ITEMS[index].path);
          setView(NAV_ITEMS[index].path.replace('/', '') as any);
        }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        isRunning ? pause() : play();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        reset();
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        navigate('/digital-twin');
        setView('digital-twin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, play, pause, reset, setView, toggleCommandPalette, navigate]);

  return (
    <div className="h-dvh min-h-0 w-full flex bg-[var(--bg-primary)] text-[var(--fg-primary)]">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden flex-shrink-0"
          >
            <SidebarHeader onToggle={() => setSidebarOpen(false)} />
            <Navigation currentPath={location.pathname} />
            <SidebarFooter />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main area ────────────────────────────────────────────────── */}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
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

      {/* ── Mobile menu ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} />
        )}
      </AnimatePresence>

      {/* ── Command palette ──────────────────────────────────────────── */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette onClose={toggleCommandPalette} />}
      </AnimatePresence>
    </div>
  );
}

// ── SidebarHeader ─────────────────────────────────────────────────────────────
function SidebarHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-[var(--bg-primary)]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-base text-[var(--fg-primary)] leading-tight">InfraGuard</h1>
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide">Digital Twin</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Navigation ────────────────────────────────────────────────────────────────
function Navigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
            ${isActive
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-opacity ${
                isActive ? 'opacity-60 bg-cyan-500/20 text-cyan-400' : 'opacity-0 group-hover:opacity-50 bg-white/5 text-gray-500'
              }`}>
                {item.shortcut}
              </kbd>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// ── SidebarFooter ─────────────────────────────────────────────────────────────
function SidebarFooter() {
  const { developerMode, toggleDeveloperMode } = useUIStore();

  return (
    <div className="p-3 border-t border-[var(--border-primary)] space-y-3">
      <ToggleSwitch
        id="dev-mode"
        checked={developerMode}
        onChange={toggleDeveloperMode}
        label="Developer Mode"
      />
      <div className="text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
        <span className="font-mono">v1.0.0-dev</span>
        <Info className="w-3.5 h-3.5 opacity-40" />
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({
  onMenuClick,
  sidebarOpen,
  onSidebarToggle,
}: { onMenuClick: () => void; sidebarOpen: boolean; onSidebarToggle: () => void }) {
  return (
    <header className="h-12 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-3 gap-3 flex-shrink-0">
      {/* Left: menu + sidebar toggle */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          onClick={onSidebarToggle}
          className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-100 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Center: breadcrumb — vertically centered */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <Breadcrumb />
      </div>

      {/* Right: indicators + theme — all vertically centered */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <DataSourceIndicator />
        <ConnectionStatus />
        <div className="w-px h-5 bg-[var(--border-primary)]" />
        <ThemeToggle />
      </div>
    </header>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb() {
  const location = useLocation();
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
    hardware: 'Hardware',
    settings: 'Settings',
  };

  const segment = location.pathname.split('/').filter(Boolean)[0] ?? '';

  return (
    <ol className="flex items-center gap-1.5 text-sm">
      <li className="text-[var(--fg-muted)] hidden sm:block">InfraGuard</li>
      <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-muted)] hidden sm:block" />
      <li className="text-[var(--fg-primary)] font-medium">{labels[segment] ?? 'Dashboard'}</li>
    </ol>
  );
}

// ── DataSourceIndicator ───────────────────────────────────────────────────────
function DataSourceIndicator() {
  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
      <Database className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
      <span className="text-[11px] font-medium text-[var(--fg-secondary)] uppercase tracking-wide">Simulation</span>
      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded font-mono">DEMO</span>
    </div>
  );
}

// ── ConnectionStatus ──────────────────────────────────────────────────────────
function ConnectionStatus() {
  return (
    <div className="hidden md:flex items-center gap-3">
      {[{ label: 'MQTT' }, { label: 'DB' }].map(({ label }) => (
        <div key={label} className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
          <span className="text-[11px] text-[var(--fg-muted)]">{label}</span>
        </div>
      ))}
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
    <footer className="h-9 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex items-center justify-between px-3 gap-3 flex-shrink-0">
      {/* Minimal playback row */}
      <div className="flex items-center gap-2">
        <button
          onClick={isRunning ? onPause : onPlay}
          aria-label={isRunning ? 'Pause simulation' : 'Play simulation'}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-100 transition-colors"
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          onClick={onReset}
          aria-label="Reset simulation"
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
        <span className="text-xs font-mono tabular-nums text-gray-300">{formatTime(clock.time)}</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-xs text-gray-300 focus:outline-none cursor-pointer"
        >
          {[0.25, 0.5, 1, 2, 5, 10].map((v) => <option key={v} value={v}>{v}x</option>)}
        </select>
      </div>

      {/* Right stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          <span className={onlineCount === totalCount ? 'text-emerald-400' : 'text-amber-400'}>{onlineCount}</span>
          <span>/{totalCount} sensors</span>
        </span>
        {alertCount > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-amber-400"
          >
            <AlertTriangle className="w-3 h-3" />
            {alertCount}
          </motion.span>
        )}
      </div>
    </footer>
  );
}

// ── MobileMenu ────────────────────────────────────────────────────────────────
function MobileMenu({ onClose, currentPath }: { onClose: () => void; currentPath: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="absolute left-0 top-0 h-full w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col"
      >
        <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--bg-primary)]" />
            </div>
            <span className="font-semibold text-[var(--fg-primary)]">InfraGuard</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === item.path
                  ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                  : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>
    </motion.div>
  );
}

// ── CommandPalette ────────────────────────────────────────────────────────────
function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { play, pause, reset } = useSimulationStore();

  const COMMANDS = [
    { label: 'Open Digital Twin',         action: () => navigate('/digital-twin'),   keys: ['2'] },
    { label: 'Open Dashboard',            action: () => navigate('/overview'),        keys: ['1'] },
    { label: 'Open Analytics',            action: () => navigate('/analytics'),       keys: ['5'] },
    { label: 'Open Data Flow Inspector',  action: () => navigate('/data-flow'),       keys: ['9'] },
    { label: 'Import Bridge Model',       action: () => navigate('/bridge-models'),   keys: ['7'] },
    { label: 'Open Alerts',              action: () => navigate('/alerts'),           keys: ['8'] },
    { label: 'Play Simulation',           action: play,                               keys: ['Space'] },
    { label: 'Pause Simulation',          action: pause,                              keys: ['Space'] },
    { label: 'Reset Simulation',          action: reset,                              keys: ['R'] },
    { label: 'Open Settings',            action: () => navigate('/settings'),         keys: ['S'] },
  ];

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.keys.some((k) => k.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-3 border-b border-[var(--border-primary)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands… (⌘K to close)"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-2.5 text-[var(--fg-primary)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] transition"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[var(--fg-muted)]">No commands found</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors border-b border-[var(--border-primary)] last:border-0"
            >
              <span className="text-sm text-[var(--fg-primary)]">{cmd.label}</span>
              <span className="flex items-center gap-1">
                {cmd.keys.map((k, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[10px] text-[var(--fg-muted)] font-mono">
                    {k}
                  </kbd>
                ))}
              </span>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-[var(--border-primary)] flex items-center gap-4 text-[10px] text-[var(--fg-muted)]">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
