import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HorizontalBarChartProps {
  data: Array<{
    label: string;
    value: number;
    sla?: number;
  }>;
  title: string;
  unit?: string;
  height?: number;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  title,
  unit = '',
  height = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  const getColor = (value: number, sla?: number) => {
    if (sla === undefined) return '#3b82f6';
    return value <= sla ? '#22c55e' : '#ef4444';
  };

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
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4 uppercase tracking-wider">{title}</h3>
        <div
          style={{ height: height, minHeight: 150 }}
          className="flex items-center justify-center text-slate-400 dark:text-slate-500"
        >
          No hay datos disponibles
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: height }}>
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4 uppercase tracking-wider">{title}</h3>
      <div style={{ width: '100%', height: height, minHeight: 150 }}>
        {isReady && dimensions.width > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                width={90}
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
                formatter={(value: number) => [`${value}${unit}`, 'Días']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.value, entry.sla)} />
                ))}
              </Bar>
            </BarChart>
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
