import React, { useMemo } from 'react';

interface DonutChartProps {
  percentage: number;
  title: string;
  subtitle?: string;
  target?: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

const DonutChartComponent: React.FC<DonutChartProps> = ({
  percentage,
  title,
  subtitle,
  target,
  size = 'md',
  showPercentage = true,
}) => {
  const { radius, strokeWidth, circumference, strokeDashoffset, color } = useMemo(() => {
    const r = size === 'sm' ? 30 : size === 'md' ? 50 : 70;
    const sw = size === 'sm' ? 6 : size === 'md' ? 10 : 14;
    const c = 2 * Math.PI * r;
    const sdo = c - (percentage / 100) * c;

    let col = '#3b82f6';
    if (target !== undefined) {
      if (percentage <= target) col = '#22c55e';
      else if (percentage <= target * 1.5) col = '#eab308';
      else col = '#ef4444';
    }

    return { radius: r, strokeWidth: sw, circumference: c, strokeDashoffset: sdo, color: col };
  }, [percentage, target, size]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: radius * 2 + strokeWidth, height: radius * 2 + strokeWidth }}
      >
        <svg
          width={radius * 2 + strokeWidth}
          height={radius * 2 + strokeWidth}
          viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            className="dark:stroke-slate-800"
            strokeWidth={strokeWidth}
          />
          {/* Value circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{percentage}%</span>
          </div>
        )}
      </div>
      <div className="text-center mt-2">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {target !== undefined && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">META: &lt;{target}%</p>}
      </div>
    </div>
  );
};

export const DonutChart = React.memo(DonutChartComponent);
