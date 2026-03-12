import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TimelineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  title: string;
  color?: string;
  showGrid?: boolean;
  height?: number;
  suffix?: string;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  title,
  color = '#3b82f6',
  showGrid = true,
  height = 200,
  suffix = '%',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const maxValue = Math.max(...data.map(d => d.value));
  const currentValue = data[data.length - 1]?.value || 0;

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          setIsReady(true);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Validate data
  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: height }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
        <span className="text-2xl font-bold" style={{ color }}>
          {currentValue}{suffix}
        </span>
      </div>
      <div style={{ width: '100%', height: height, minHeight: 150 }}>
        {isReady && dimensions.width > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />}
              <XAxis dataKey="label" stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={12} tickLine={false} />
              <YAxis
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
                fontSize={12}
                tickLine={false}
                domain={[0, Math.ceil(maxValue * 1.2)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #ffffff)',
                  border: '1px solid var(--tooltip-border, #e2e8f0)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: 'var(--tooltip-text, #1e293b)' }}
                labelStyle={{ color: 'var(--tooltip-label, #64748b)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="animate-pulse">Cargando gráfico...</div>
          </div>
        )}
      </div>
    </div>
  );
};
