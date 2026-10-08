import type { TelemetryPacket } from '../../types/telemetry';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface LiveChartProps {
  title: string;
  unit: string;
  color: string;
  dataPoints: number;
  height: number;
  data: TelemetryPacket[];
  metric: 'vibration' | 'strain' | 'load' | 'displacement' | 'temperature' | 'rainfall';
}

export function LiveChart({ title, unit, color, height, dataPoints, data, metric }: LiveChartProps) {
  const chartData = (data ?? [])
    .slice(-dataPoints)
    .flatMap((packet) => {
      const value = metric === 'vibration'
        ? packet.vibration?.magnitude
        : metric === 'strain'
          ? packet.strain?.strain
          : metric === 'load'
            ? packet.load?.load
            : metric === 'displacement'
              ? packet.displacement ?? packet.distance
              : metric === 'temperature'
                ? packet.temperature
                : packet.rainfall;
      return value === undefined
        ? []
        : [{ time: new Date(packet.timestamp).toLocaleTimeString(), value }];
    });

  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <h3 className="font-medium text-[var(--fg-primary)]">{title}</h3>
        <span className="font-mono text-xs text-[var(--fg-muted)]">{chartData.length} samples · {unit}</span>
      </div>
      <div className="panel-content min-w-0" style={{ height }}>
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--border-primary)] px-4 text-center text-sm text-[var(--fg-muted)]">
            Waiting for the first {title.toLowerCase()} reading.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis
                width={54}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--fg-muted)' }}
                formatter={(value) => [`${Number(value).toFixed(3)} ${unit}`, title]}
              />
              <Line type="monotone" dataKey="value" name={title} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}