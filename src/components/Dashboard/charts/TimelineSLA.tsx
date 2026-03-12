import React from 'react';
import { Check, AlertTriangle, Clock } from 'lucide-react';

interface TimelineSLAProps {
  stages: Array<{
    etapa: number;
    nombre: string;
    estado: 'completado' | 'en_progreso' | 'alerta' | 'excedido' | 'pendiente';
    count?: number;
  }>;
}

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'completado':
      return <Check size={14} className="text-white" />;
    case 'alerta':
      return <AlertTriangle size={14} className="text-white" />;
    case 'excedido':
      return <AlertTriangle size={14} className="text-white" />;
    default:
      return <Clock size={14} className="text-slate-500 dark:text-slate-400" />;
  }
};

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'completado':
      return '#22c55e';
    case 'en_progreso':
      return '#3b82f6';
    case 'alerta':
      return '#f97316';
    case 'excedido':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

export const TimelineSLA: React.FC<TimelineSLAProps> = ({ stages }) => {
  const nodeRadius = 16;
  const lineY = 40;
  const startX = 40;
  const endX = 920;
  const totalWidth = endX - startX;
  const stepWidth = totalWidth / (stages.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={endX + 40}
        height={100}
        viewBox={`0 0 ${endX + 40} 100`}
        className="min-w-[960px]"
      >
        {/* Base line */}
        <line x1={startX} y1={lineY} x2={endX} y2={lineY} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={2} />

        {/* Stage nodes */}
        {stages.map((stage, index) => {
          const x = startX + index * stepWidth;
          const isLast = index === stages.length - 1;

          return (
            <g key={stage.etapa}>
              {/* Connection line from previous */}
              {!isLast && (
                <line
                  x1={x + nodeRadius}
                  y1={lineY}
                  x2={x + stepWidth - nodeRadius}
                  y2={lineY}
                  stroke={getStatusColor(stage.estado)}
                  strokeWidth={3}
                />
              )}

              {/* Node circle */}
              <circle
                cx={x}
                cy={lineY}
                r={nodeRadius}
                fill={getStatusColor(stage.estado)}
                className="transition-all duration-300"
              />

              {/* Node icon */}
              <foreignObject x={x - 8} y={lineY - 8} width={16} height={16}>
                <div className="flex items-center justify-center w-full h-full">
                  {getStatusIcon(stage.estado)}
                </div>
              </foreignObject>

              {/* Stage number */}
              <text x={x} y={lineY - 25} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs font-medium">
                {stage.etapa}
              </text>

              {/* Stage count badge if > 0 */}
              {(stage.count ?? 0) > 0 && (
                <g>
                  <circle cx={x + 10} cy={lineY - 10} r={8} fill="#ef4444" stroke="white" strokeWidth={1} />
                  <text x={x + 10} y={lineY - 7} textAnchor="middle" className="fill-white text-[9px] font-bold">
                    {stage.count}
                  </text>
                </g>
              )}

              {/* Stage name */}
              <text x={x} y={lineY + 35} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-medium">
                {stage.nombre.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
