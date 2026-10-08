import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  status: 'normal' | 'warning' | 'critical' | 'info';
  icon: ReactNode;
  trend: ReactNode;
  trendLabel: string;
  subtitle: string;
}

export function KpiCard({ title, value, status, icon, trend, trendLabel, subtitle }: KpiCardProps) {
  const bg = status === 'normal' ? 'var(--accent-green)' : status === 'warning' ? 'var(--accent-amber)' : status === 'critical' ? 'var(--accent-red)' : 'var(--accent-blue)';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel">
      <div className="panel-content">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg`} style={{ backgroundColor: bg + '20' }}>{icon}</div>
          <div>
            <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-[var(--fg-primary)]">{value}</p>
            <div className="flex items-center gap-2 text-sm">{trend}<span className="text-[var(--fg-muted)]">{trendLabel}</span></div>
            <p className="text-sm text-[var(--fg-secondary)] mt-1">{subtitle}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}