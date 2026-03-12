import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { TasasMetrics } from '../../types/sla-kpi';

interface TasasChartsProps {
  data: TasasMetrics | null;
  loading?: boolean;
}

/**
 * Charts for Tasas (Desistimiento, Objetados, Prescritos)
 */
export const TasasCharts: React.FC<TasasChartsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-80 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-slate-700 rounded mt-8"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-80 flex items-center justify-center">
        <p className="text-slate-500">No hay datos de tasas disponibles</p>
      </div>
    );
  }

  // Data for pie chart
  const pieData = [
    {
      name: 'Desistimiento',
      value: data.tasaDesistimiento,
      color: '#f59e0b',
      description: 'Casos desistidos por el asegurado',
    },
    {
      name: 'Objetados',
      value: data.tasaObjetados,
      color: '#ef4444',
      description: 'Casos objetados por la compañía',
    },
    {
      name: 'Prescritos',
      value: data.tasaPrescritos,
      color: '#8b5cf6',
      description: 'Casos prescritos legalmente',
    },
    {
      name: 'Otros',
      value: Math.max(0, 100 - data.tasaDesistimiento - data.tasaObjetados - data.tasaPrescritos),
      color: '#64748b',
      description: 'Resto de casos',
    },
  ].filter(item => item.value > 0);

  // Data for bar chart (if counts available)
  const barData = data.counts
    ? [
        { name: 'Desistimiento', value: data.counts.desistimiento, fill: '#f59e0b' },
        { name: 'Objetados', value: data.counts.objetados, fill: '#ef4444' },
        { name: 'Prescritos', value: data.counts.prescritos, fill: '#8b5cf6' },
      ]
    : [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Tasas de Siniestros</h3>
        <p className="text-sm text-slate-400 mt-1">Distribución por tipo de cierre</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Percentages */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                formatter={(value: number, name: string) => {
                  const item = pieData.find(d => d.name === name);
                  return [`${value.toFixed(2)}%`, item?.description || name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Absolute Counts */}
        {barData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value: number) => [`${value} casos`, 'Cantidad']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-amber-400 mb-1">Desistimiento</p>
          <p className="text-2xl font-bold text-amber-300">{data.tasaDesistimiento.toFixed(1)}%</p>
          {data.counts && (
            <p className="text-xs text-amber-400/70 mt-1">{data.counts.desistimiento} casos</p>
          )}
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400 mb-1">Objetados</p>
          <p className="text-2xl font-bold text-red-300">{data.tasaObjetados.toFixed(1)}%</p>
          {data.counts && (
            <p className="text-xs text-red-400/70 mt-1">{data.counts.objetados} casos</p>
          )}
        </div>

        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
          <p className="text-sm text-violet-400 mb-1">Prescritos</p>
          <p className="text-2xl font-bold text-violet-300">{data.tasaPrescritos.toFixed(1)}%</p>
          {data.counts && (
            <p className="text-xs text-violet-400/70 mt-1">{data.counts.prescritos} casos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasasCharts;
