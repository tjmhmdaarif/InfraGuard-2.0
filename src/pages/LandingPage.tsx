import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Zap, Radio, BarChart3, Box, ArrowRight, ChevronDown, Cpu, Wind, Layers, GitBranch, TrendingUp, Eye, CheckCircle, type LucideIcon } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Box, title: '3D Digital Twin', description: 'Real-time procedural bridge with interactive sensor overlays, vehicle simulation, and structural stress visualization.', color: '#06b6d4', tag: '3D' },
  { icon: Activity, title: 'Live Telemetry', description: 'Stream vibration, strain, temperature, and displacement data from 9 sensor types at 100Hz.', color: '#10b981', tag: 'LIVE' },
  { icon: BarChart3, title: 'Analytics Engine', description: 'Correlation heatmaps, zone comparisons, and time-series analysis with export to CSV/JSON.', color: '#3b82f6', tag: 'DATA' },
  { icon: Radio, title: 'Sensor Network', description: 'Manage MPU6050, strain gauges, DHT22, rain, and HC-SR04 sensors with calibration profiles.', color: '#f59e0b', tag: 'IoT' },
  { icon: Shield, title: 'Alert Engine', description: 'ML-driven anomaly detection with configurable thresholds and real-time incident escalation.', color: '#ef4444', tag: 'AI' },
  { icon: Wind, title: 'Scenario Engine', description: 'Simulate cyclone, flood, traffic surge, and structural failure scenarios with time control.', color: '#8b5cf6', tag: 'SIM' },
  { icon: Layers, title: 'Bridge Models', description: 'Import custom bridge geometries or use the procedural truss model with zone boundaries.', color: '#06b6d4', tag: '3D' },
  { icon: Cpu, title: 'Hardware Integration', description: 'Connect real Arduino/ESP32 sensors via Serial, MQTT, or replay recorded sessions.', color: '#10b981', tag: 'HW' },
  { icon: GitBranch, title: 'Data Flow', description: 'Visualize the entire signal path from sensor to dashboard with latency and quality metrics.', color: '#f59e0b', tag: 'SYS' },
];

const STATS = [
  { value: 9, suffix: '', label: 'Sensor Types', icon: Radio },
  { value: 100, suffix: 'Hz', label: 'Sample Rate', icon: Zap },
  { value: 11, suffix: '', label: 'Dashboard Panels', icon: Layers },
  { value: 6, suffix: '+', label: 'Sim Scenarios', icon: Wind },
];

const METRICS_PREVIEW = [
  { label: 'Bridge Health', value: '94.2%', delta: '+0.3%', good: true },
  { label: 'Vibration RMS', value: '0.018g', delta: '+2.1%', good: false },
  { label: 'Peak Strain', value: '42µε', delta: '-1.4%', good: true },
  { label: 'Traffic Load', value: '18.2kN', delta: '+5.2%', good: false },
  { label: 'Temperature', value: '24.1°C', delta: '+0.8°C', good: true },
  { label: 'Water Level', value: '2.1m', delta: 'normal', good: true },
];

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCounter(to: number, duration = 2.0, delay = 0) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
      const ctrl = animate(count, to, { duration, ease: [0.16, 1, 0.3, 1] });
      return ctrl.stop;
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [to, duration, delay]);

  return started ? rounded : count;
}

// ─── Background Canvas ─────────────────────────────────────────────────────────
function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number };
    const nodes: Node[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.8 + 0.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.018;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        const pulse = Math.sin(n.pulse) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${0.4 * pulse})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── Scrolling Metrics Ticker ──────────────────────────────────────────────────
function MetricsTicker() {
  const doubled = [...METRICS_PREVIEW, ...METRICS_PREVIEW];
  return (
    <div className="relative overflow-hidden py-3 border-y border-white/5 bg-black/20 backdrop-blur-sm">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((m, i) => (
          <div key={i} className="flex items-center gap-2 px-4">
            <span className="text-white/40 text-xs uppercase tracking-wider font-mono">{m.label}</span>
            <span className="text-white font-mono font-semibold text-sm">{m.value}</span>
            <span className={`text-xs font-mono ${m.good ? 'text-emerald-400' : 'text-amber-400'}`}>
              {m.delta}
            </span>
            <span className="text-white/20 mx-2">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, suffix, label, icon: Icon, delay }: { value: number; suffix: string; label: string; icon: LucideIcon; delay: number }) {
  const display = useCounter(value, 1.8, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-1 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 transition-colors"
    >
      <Icon className="w-5 h-5 text-cyan-400 mb-1" />
      <div className="text-3xl font-bold tabular-nums text-white">
        <motion.span>{display}</motion.span>
        <span className="text-cyan-400">{suffix}</span>
      </div>
      <p className="text-xs text-white/50 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/20 transition-all cursor-default overflow-hidden"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${feature.color}12, transparent 60%)` }}
      />
      {/* Tag */}
      <div className="absolute top-4 right-4">
        <span
          className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ color: feature.color, background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
        >
          {feature.tag}
        </span>
      </div>
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${feature.color}18` }}
      >
        <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
      </div>
      <h3 className="font-semibold text-white mb-2 text-sm">{feature.title}</h3>
      <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

// ─── Live Status Indicator ─────────────────────────────────────────────────────
function LiveStatusBar() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: 'Simulation Engine', status: 'ONLINE' },
    { label: 'Telemetry Stream', status: 'LIVE' },
    { label: 'Sensor Network', status: `${9} Active` },
    { label: 'Alert Engine', status: 'ARMED' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: `pulse 1.4s ${i * 0.35}s ease-in-out infinite` }}
          />
          <span className="text-white/40">{item.label}</span>
          <span className="text-emerald-400 font-mono font-semibold">{item.status}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Progress bar scroll indicator ────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 origin-left z-[200]"
      style={{ scaleX }}
    />
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#080b10] text-white overflow-x-hidden">
      <ScrollProgress />

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#080b10]/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.5)]">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">InfraGuard</span>
          <span className="hidden sm:inline text-white/20 text-xs">Bridge Digital Twin</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
          <button
            onClick={() => navigate('/overview')}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_16px_rgba(6,182,212,0.3)]"
          >
            Launch App
          </button>
        </motion.div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        <NeuralBackground />

        {/* Deep radial gradient overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.3) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 text-xs text-cyan-300 font-medium mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Structural Health Monitoring · Digital Twin Platform
            <span className="text-cyan-500/60 ml-1">v2.0</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[0.95]"
          >
            <span className="block text-white">Infra</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              Guard
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-white/50 font-light mb-3 max-w-2xl mx-auto leading-relaxed"
          >
            Real-time bridge structural health monitoring with 3D digital twin visualization,
            AI-driven anomaly detection, and live environmental simulation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 justify-center mt-10 mb-14"
          >
            <motion.button
              onClick={() => navigate('/overview')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl text-sm shadow-[0_0_32px_rgba(6,182,212,0.4)] hover:shadow-[0_0_48px_rgba(6,182,212,0.6)] transition-all"
            >
              <Zap className="w-4 h-4" />
              Launch Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
            <motion.button
              onClick={() => navigate('/digital-twin')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-7 py-3.5 border border-white/10 text-white/80 font-medium rounded-xl text-sm hover:bg-white/5 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <Box className="w-4 h-4" />
              Open Digital Twin
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12"
          >
            {STATS.map((s, i) => (
              <StatCard key={s.label} {...s} delay={0.6 + i * 0.1} />
            ))}
          </motion.div>

          {/* Live status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <LiveStatusBar />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to explore</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Metrics Ticker ─────────────────────────── */}
      <MetricsTicker />

      {/* ── Features ───────────────────────────────── */}
      <section className="relative px-6 py-28">
        {/* Section glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs text-cyan-400 uppercase tracking-[0.2em] font-semibold mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to monitor a bridge
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              A complete toolkit — from raw IoT telemetry to 3D structural visualization and ML anomaly detection.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section className="relative px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs text-emerald-400 uppercase tracking-[0.2em] font-semibold mb-3">Architecture</p>
            <h2 className="text-3xl font-bold text-white">How InfraGuard works</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Radio, title: 'Sensor Ingestion', desc: 'IoT sensors stream data via MQTT, Serial, or synthetic simulation engine at configurable Hz rates.', color: '#06b6d4' },
              { step: '02', icon: Cpu, title: 'Health Engine', desc: 'Real-time signal processing with calibration, anomaly detection, and zone-based health scoring.', color: '#3b82f6' },
              { step: '03', icon: Eye, title: '3D Visualization', desc: 'Live 3D digital twin renders structural stress, sensor readings, and environmental conditions.', color: '#8b5cf6' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
              >
                <div className="text-4xl font-black text-white/5 absolute top-4 right-5">{item.step}</div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${item.color}18` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="relative px-6 py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.4), transparent 70%)' }} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-xs text-emerald-400 mb-6">
            <CheckCircle className="w-3 h-3" />
            No setup required · Runs entirely in browser
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Ready to explore?
          </h2>
          <p className="text-white/40 mb-10 text-base leading-relaxed">
            The simulation starts automatically. Interact with the 3D bridge, trigger scenarios, analyze telemetry — all in real time.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <motion.button
              onClick={() => navigate('/overview')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2.5 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              Enter InfraGuard
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              onClick={() => navigate('/scenarios')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-7 py-4 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/5 transition-all"
            >
              <Wind className="w-4 h-4" />
              Try Scenarios
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" />
            </div>
            <span className="text-sm font-semibold text-white">InfraGuard</span>
            <span className="text-white/30 text-xs">Bridge Health Monitoring Digital Twin</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Simulation active · Synthetic data only · No real infrastructure
          </div>
        </div>
      </footer>
    </div>
  );
}
