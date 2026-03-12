import React from 'react';
import { Line } from 'react-chartjs-2';
import type { Claim } from '../../../types';
import { useComparativos } from '../../../hooks/reports/useComparativos';
import { CHART_COLORS } from '../../../utils/chartConfig';

interface TiemposTendenciaLineChartProps {
    claims: Claim[];
}

const TiemposTendenciaLineChart: React.FC<TiemposTendenciaLineChartProps> = ({ claims }) => {
    const { historicoMensual } = useComparativos(claims);

    // Reverse data to show oldest to newest (historicoMensual is usually computed last 12 months, but order implies we pushed them in reverse?
    // In useComparativos: for (let i = 11; i >= 0; i--) { ... push }
    // i=11 (11 months ago) -> pushed first.
    // i=0 (this month) -> pushed last.
    // So order is Correct (Oldest to Newest).

    const data = {
        labels: historicoMensual.map(d => d.mes),
        datasets: [
            {
                label: 'Tiempo Promedio (Días)',
                data: historicoMensual.map(d => d.tiempoPromedio),
                borderColor: CHART_COLORS.primary,
                backgroundColor: CHART_COLORS.primary,
                tension: 0.3,
                fill: false,
                pointBackgroundColor: '#fff',
                pointBorderColor: CHART_COLORS.primary,
                pointBorderWidth: 2,
                pointRadius: 4,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#64748b' // slate-500
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e2e8f0' // slate-200
                },
                ticks: {
                    color: '#64748b'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            }
        }
    };

    return (
        <div id="chart-tiempos-tendencia" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tendencia Mensual de Tiempos</h3>
            <div className="h-64">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default TiemposTendenciaLineChart;
