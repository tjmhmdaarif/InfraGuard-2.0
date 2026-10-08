import { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface CorrelationChartProps {
  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;
  color: string;
  data: { x: number; y: number }[];
}

export function CorrelationChart({ title, subtitle, xLabel, yLabel, color, data }: CorrelationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (data.length === 0) return [{ x: 0, y: 0 }];
    return data.filter(d => !isNaN(d.x) && !isNaN(d.y));
  }, [data]);

  const trendLine = useMemo(() => {
    if (chartData.length < 2) return [];
    const n = chartData.length;
    const sumX = chartData.reduce((a, b) => a + b.x, 0);
    const sumY = chartData.reduce((a, b) => a + b.y, 0);
    const sumXY = chartData.reduce((a, b) => a + b.x * b.y, 0);
    const sumX2 = chartData.reduce((a, b) => a + b.x * b.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...chartData.map(d => d.x));
    const maxX = Math.max(...chartData.map(d => d.x));
    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel h-[400px]"
    >
      <div className="panel-header">
        <div>
          <h3 className="font-medium text-[var(--fg-primary)]">{title}</h3>
          <p className="text-sm text-[var(--fg-secondary)]">{subtitle}</p>
        </div>
      </div>
      <div className="panel-content h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-primary)' }}
              tickLine={{ stroke: 'var(--border-primary)' }}
              nameStyle={{ fill: 'var(--fg-secondary)', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              orientation="left"
              tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-primary)' }}
              tickLine={{ stroke: 'var(--border-primary)' }}
              nameStyle={{ fill: 'var(--fg-secondary)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--fg-primary)' }}
              formatter={(value: number) => [value.toFixed(3), '']}
            />
            <Legend />
            <Scatter
              name="Data Points"
              data={chartData}
              fill={color}
              stroke={color}
              shape="circle"
              size={6}
              opacity={0.6}
            />
            {trendLine.length === 2 && (
              <Scatter
                name="Trend"
                data={trendLine}
                fill="transparent"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 5"
                shape="circle"
                size={0}
                customLine={({ points }: any) => points && <path d={`M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`} stroke={color} strokeWidth={2} strokeDasharray="5 5" />}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}