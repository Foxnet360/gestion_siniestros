import React, { useMemo } from 'react';

interface GaugeChartProps {
  value: number;
  max: number;
  title: string;
  subtitle?: string;
  target?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Semicircle gauge chart.
 * Uses a single SVG path for the track and fill, controlled via strokeDasharray
 * to guarantee perfect arc alignment.
 */
const GaugeChartComponent: React.FC<GaugeChartProps> = ({
  value,
  max,
  title,
  subtitle,
  target,
  unit = '',
  size = 'md',
}) => {
  const gauge = useMemo(() => {
    const pct = Math.min(Math.max((value / max) * 100, 0), 100);
    const r = size === 'sm' ? 44 : size === 'md' ? 56 : 72;
    const sw = size === 'sm' ? 10 : size === 'md' ? 12 : 14;

    // ViewBox: full diameter width, radius height + stroke room
    const W = r * 2 + sw;
    const H = r + sw;

    // Arc center sits at the bottom so it curves upward
    const cx = W / 2;
    const cy = H - sw / 2;

    // Semicircle endpoints (left → right)
    const lx = cx - r;
    const rx = cx + r;

    // Single arc path used by BOTH track and fill
    const arcPath = `M ${lx},${cy} A ${r},${r} 0 0,1 ${rx},${cy}`;

    // Arc length = π * r (half circumference)
    const arcLen = Math.PI * r;

    // strokeDasharray for the fill: show pct% of arcLen, then gap
    const fillLen = (pct / 100) * arcLen;

    // Color by target
    let color = '#3b82f6';
    if (target !== undefined) {
      if (value <= target) color = '#22c55e';
      else if (value <= target * 1.2) color = '#eab308';
      else color = '#ef4444';
    }

    return { W, H, sw, arcPath, arcLen, fillLen, color };
  }, [value, max, target, size]);

  const displayValue = Math.round(value * 100) / 100;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex justify-center" style={{ maxWidth: 200 }}>
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${gauge.W} ${gauge.H}`}
            className="w-full h-auto block"
          >
            {/* Track (gray background) — full semicircle */}
            <path
              d={gauge.arcPath}
              fill="none"
              stroke="#f1f5f9"
              className="dark:stroke-slate-700"
              strokeWidth={gauge.sw}
              strokeLinecap="round"
            />
            {/* Fill (colored value) — same path, clipped via dasharray */}
            <path
              d={gauge.arcPath}
              fill="none"
              stroke={gauge.color}
              strokeWidth={gauge.sw}
              strokeLinecap="round"
              strokeDasharray={`${gauge.fillLen} ${gauge.arcLen}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Value label at the bottom center of the arc */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              {displayValue}
            </span>
          </div>
        </div>
      </div>

      {/* Text labels */}
      <div className="text-center mt-3">
        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {target !== undefined && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            META: &lt;{target} {unit}
          </p>
        )}
      </div>
    </div>
  );
};

export const GaugeChart = React.memo(GaugeChartComponent);
