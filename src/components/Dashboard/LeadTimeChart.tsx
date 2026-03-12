import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { LeadTimeMetrics } from '../../types/sla-kpi';

interface LeadTimeChartProps {
  data: LeadTimeMetrics | null;
  loading?: boolean;
  target?: number;
}

/**
 * Lead Time Bar Chart with percentiles
 */
export const LeadTimeChart: React.FC<LeadTimeChartProps> = ({
  data,
  loading = false,
  target = 30,
}) => {
  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-80 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-slate-700 rounded mt-8"></div>
      </div>
    );
  }

  if (!data || data.average === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-80 flex items-center justify-center">
        <p className="text-slate-500">No hay datos de lead time disponibles</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = [
    { name: 'Promedio', value: data.average, fill: '#3b82f6' },
    ...(data.percentiles
      ? [
          { name: 'P50', value: data.percentiles.p50, fill: '#10b981' },
          { name: 'P75', value: data.percentiles.p75, fill: '#f59e0b' },
          { name: 'P90', value: data.percentiles.p90, fill: '#ef4444' },
          { name: 'P95', value: data.percentiles.p95, fill: '#dc2626' },
        ]
      : []),
  ];

  const maxValue = Math.max(...chartData.map(d => d.value), target);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Distribución de Lead Time</h3>
          <p className="text-sm text-slate-400 mt-1">Tiempo de resolución en días hábiles</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-400">{data.average.toFixed(1)}</p>
          <p className="text-sm text-slate-500">días promedio</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, maxValue * 1.1]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
              formatter={(value: number) => [`${value} días`, 'Tiempo']}
            />
            <ReferenceLine
              y={target}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{
                value: `Meta: ${target} días`,
                fill: '#10b981',
                fontSize: 12,
                position: 'right',
              }}
            />

            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-slate-400">Promedio</span>
        </div>
        {data.percentiles && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-slate-400">P50 (Mediana)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-slate-400">P75</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-slate-400">P90-P95</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-emerald-500 border-dashed"></div>
          <span className="text-slate-400">Meta ({target} días)</span>
        </div>
      </div>
    </div>
  );
};

export default LeadTimeChart;
