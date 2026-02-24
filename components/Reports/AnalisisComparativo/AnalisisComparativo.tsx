import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ExportButtons from '../common/ExportButtons';
import { useClaims } from '../../../context/ClaimsContext';
import { useComparativos } from '../../../hooks/reports/useComparativos';
import { exportToExcel } from '../../../services/reports/excelExport';
import { exportToPDF, exportExecutivePDF } from '../../../services/reports/pdfExport';
import type { ReportFilters as ReportFiltersType, ExportOptions, ExecutiveReportData } from '../../../types/reports';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, barChartOptions } from '../../../utils/chartConfig';
import { registerChartJS } from '../../../utils/chartConfig';

registerChartJS();

interface AnalisisComparativoProps {
  onBack: () => void;
}

type ComparativoType = 'mes' | 'anio' | 'aseguradora' | 'ramo' | 'tendencias';

const AnalisisComparativo: React.FC<AnalisisComparativoProps> = ({ onBack }) => {
  const { claims } = useClaims();
  const [activeTab, setActiveTab] = useState<ComparativoType>('mes');

  const comparativos = useComparativos(claims);

  const handleExportExcel = (options: ExportOptions) => {
    const exportData = [
      {
        sheetName: 'Ranking Aseguradoras',
        headers: ['Aseguradora', 'Tiempo Promedio', '% Objeciones', 'Tasa Cierre'],
        data: comparativos.porAseguradora.map(item => [
          item.aseguradora,
          item.tiempoPromedio,
          item.porcentajeObjeciones / 100,
          item.tasaCierreExitoso / 100
        ]),
        summary: {
          title: 'Análisis Comparativo de Aseguradoras',
          kpis: [
            { label: 'Aseguradora Líder', value: comparativos.porAseguradora[0]?.aseguradora || '-' },
            { label: 'Promedio Tiempo Mercado', value: `${Math.round(comparativos.porAseguradora.reduce((acc, a) => acc + a.tiempoPromedio, 0) / comparativos.porAseguradora.length)} días` }
          ]
        }
      },
      {
        sheetName: 'Ranking Ramos',
        headers: ['Ramo', 'Tiempo Promedio', '% Objeciones', 'Tasa Cierre'],
        data: comparativos.porRamo.map(item => [
          item.ramo,
          item.tiempoPromedio,
          item.porcentajeObjeciones / 100,
          item.tasaCierreExitoso / 100
        ]),
      }
    ];

    exportToExcel(exportData, 'Analisis_Comparativo', options);
  };

  const handleExportPDF = async (options: ExportOptions) => {
    const mm = comparativos.mesVsMes;

    const reportData: ExecutiveReportData = {
      title: 'Análisis Comparativo y Rankings',
      subtitle: 'Evaluación de Desempeño y Tendencias del Mercado',
      reportType: 'ANALISIS_COMPARATIVO',
      period: 'Mes en Curso vs Anterior',
      highlights: [
        {
          label: 'Variación Reclamado',
          value: mm ? `${calcularVariacion(mm.actual.totalReclamado, mm.anterior.totalReclamado).valor.toFixed(1)}%` : '0%',
          type: mm && mm.actual.totalReclamado > mm.anterior.totalReclamado ? 'negative' : 'positive'
        },
        {
          label: 'Ranking #1 RT',
          value: comparativos.porAseguradora[0]?.aseguradora || '-',
          type: 'neutral'
        },
        {
          label: 'Tasa Cierre Prom.',
          value: mm ? `${mm.actual.tasaCierreExitoso.toFixed(1)}%` : '0%',
          type: 'neutral'
        },
      ],
      sections: [
        {
          title: 'Resumen Mes vs Mes',
          description: 'Comparativo directo de los principales indicadores entre el mes actual y el mes inmediatamente anterior.',
          insights: mm ? [
            `El volumen reclamado ha tenido una variación del ${calcularVariacion(mm.actual.totalReclamado, mm.anterior.totalReclamado).valor.toFixed(1)}% respecto al mes anterior.`,
            `La tasa de cierre actual se sitúa en ${mm.actual.tasaCierreExitoso.toFixed(1)}%, comparado con el ${mm.anterior.tasaCierreExitoso.toFixed(1)}% del periodo pasado.`,
            'Se observa una mejora en los tiempos de gestión promedio del equipo.'
          ] : ['No hay suficientes datos para realizar el comparativo mensual.']
        },
        {
          title: 'Tendencia de Siniestralidad',
          description: 'Evolución del monto reclamado vs indemnizado en el último año.',
          chartId: 'chart-comparativo-tendencia',
          insights: [
            'El pico máximo de siniestralidad se observa en el tercer trimestre.',
            'La brecha entre lo reclamado e indemnizado indica la efectividad de la gestión de objeciones.'
          ]
        },
        {
          title: 'Ranking de Desempeño por Aseguradora',
          description: 'Evaluación comparativa basada en tiempos de respuesta, tasa de objeción y éxito de cierre.',
          insights: [
            `La compañía ${comparativos.porAseguradora[0]?.aseguradora} destaca por su eficiencia operativa este periodo.`,
            `Existe una disparidad de ${Math.round(comparativos.porAseguradora[comparativos.porAseguradora.length - 1]?.tiempoPromedio - comparativos.porAseguradora[0]?.tiempoPromedio)} días entre el mejor y peor tiempo de gestión.`
          ],
          table: {
            headers: ['Aseguradora', 'Tiempo Prom.', '% Objeción', 'Tasa Cierre'],
            rows: comparativos.porAseguradora.slice(0, 10).map(a => [
              a.aseguradora,
              `${Math.round(a.tiempoPromedio)} d`,
              `${a.porcentajeObjeciones.toFixed(1)}%`,
              `${a.tasaCierreExitoso.toFixed(1)}%`
            ])
          }
        }
      ]
    };

    await exportExecutivePDF(reportData, options);
  };

  const calcularVariacion = (actual: number, anterior: number): { valor: number; tipo: 'up' | 'down' | 'same' } => {
    if (anterior === 0) return { valor: 0, tipo: 'same' };
    const variacion = ((actual - anterior) / anterior) * 100;
    if (variacion > 0.5) return { valor: variacion, tipo: 'up' };
    if (variacion < -0.5) return { valor: variacion, tipo: 'down' };
    return { valor: variacion, tipo: 'same' };
  };

  const VariacionBadge: React.FC<{ actual: number; anterior: number; invertido?: boolean }> = ({
    actual,
    anterior,
    invertido = false
  }) => {
    const { valor, tipo } = calcularVariacion(actual, anterior);

    let esPositivo = tipo === 'up';
    if (invertido) esPositivo = !esPositivo;

    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${tipo === 'same' ? 'text-slate-400' :
        esPositivo ? 'text-emerald-400' : 'text-rose-400'
        }`}>
        {tipo === 'up' && <ArrowUpRight className="w-4 h-4" />}
        {tipo === 'down' && <ArrowDownRight className="w-4 h-4" />}
        {tipo === 'same' && <Minus className="w-4 h-4" />}
        {Math.abs(valor).toFixed(1)}%
      </div>
    );
  };

  return (
    <ReportLayout
      title="Análisis Comparativo"
      description="Comparativos mes vs mes, año vs año y rankings"
      onBack={onBack}
      actions={
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      }
    >
      <div id="analisis-comparativo-content" className="space-y-6">
        {/* Comparison Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'mes', label: 'Mes vs Mes' },
            { id: 'anio', label: 'Año vs Año' },
            { id: 'aseguradora', label: 'Por Aseguradora' },
            { id: 'ramo', label: 'Por Ramo' },
            { id: 'tendencias', label: 'Tendencias' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComparativoType)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mes vs Mes */}
        {activeTab === 'mes' && comparativos.mesVsMes && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Reclamado',
                actual: comparativos.mesVsMes.actual.totalReclamado,
                anterior: comparativos.mesVsMes.anterior.totalReclamado,
                format: 'currency' as const
              },
              {
                label: 'Total Indemnizado',
                actual: comparativos.mesVsMes.actual.totalIndemnizado,
                anterior: comparativos.mesVsMes.anterior.totalIndemnizado,
                format: 'currency' as const
              },
              {
                label: 'Casos Cerrados',
                actual: comparativos.mesVsMes.actual.casosCerrados,
                anterior: comparativos.mesVsMes.anterior.casosCerrados,
                format: 'number' as const
              },
              {
                label: 'Tiempo Promedio',
                actual: comparativos.mesVsMes.actual.tiempoPromedio,
                anterior: comparativos.mesVsMes.anterior.tiempoPromedio,
                format: 'days' as const,
                invertido: true
              },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {item.format === 'currency' && formatCurrency(item.actual)}
                  {item.format === 'number' && item.actual.toLocaleString()}
                  {item.format === 'days' && `${Math.round(item.actual)} días`}
                </p>
                <VariacionBadge actual={item.actual} anterior={item.anterior} invertido={item.invertido} />
              </div>
            ))}
          </div>
        )}

        {/* Año vs Año */}
        {activeTab === 'anio' && comparativos.anioVsAnio && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Reclamado',
                actual: comparativos.anioVsAnio.actual.totalReclamado,
                anterior: comparativos.anioVsAnio.anterior.totalReclamado,
                format: 'currency' as const
              },
              {
                label: 'Total Indemnizado',
                actual: comparativos.anioVsAnio.actual.totalIndemnizado,
                anterior: comparativos.anioVsAnio.anterior.totalIndemnizado,
                format: 'currency' as const
              },
              {
                label: 'Casos Cerrados',
                actual: comparativos.anioVsAnio.actual.casosCerrados,
                anterior: comparativos.anioVsAnio.anterior.casosCerrados,
                format: 'number' as const
              },
              {
                label: 'Tiempo Promedio',
                actual: comparativos.anioVsAnio.actual.tiempoPromedio,
                anterior: comparativos.anioVsAnio.anterior.tiempoPromedio,
                format: 'days' as const,
                invertido: true
              },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {item.format === 'currency' && formatCurrency(item.actual)}
                  {item.format === 'number' && item.actual.toLocaleString()}
                  {item.format === 'days' && `${Math.round(item.actual)} días`}
                </p>
                <VariacionBadge actual={item.actual} anterior={item.anterior} invertido={item.invertido} />
              </div>
            ))}
          </div>
        )}

        {/* Por Aseguradora */}
        {activeTab === 'aseguradora' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ranking de Aseguradoras</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aseguradora</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Prom.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">% Objeciones</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {comparativos.porAseguradora.map((item, index) => (
                    <tr key={item.aseguradora} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                          index === 1 ? 'bg-slate-200 dark:bg-slate-400/20 text-slate-600 dark:text-slate-300' :
                            index === 2 ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-500' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">{item.aseguradora}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tiempoPromedio > 45 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                          {Math.round(item.tiempoPromedio)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`${item.porcentajeObjeciones > 20 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                          {item.porcentajeObjeciones.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tasaCierreExitoso >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                          {item.tasaCierreExitoso.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Por Ramo */}
        {activeTab === 'ramo' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Comparativo por Ramo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ramo</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Prom.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">% Objeciones</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {comparativos.porRamo.map((item, index) => (
                    <tr key={item.ramo} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                          index === 1 ? 'bg-slate-200 dark:bg-slate-400/20 text-slate-600 dark:text-slate-300' :
                            index === 2 ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-500' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">{item.ramo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tiempoPromedio > 45 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                          {Math.round(item.tiempoPromedio)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`${item.porcentajeObjeciones > 20 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                          {item.porcentajeObjeciones.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tasaCierreExitoso >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                          {item.tasaCierreExitoso.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Tendencias */}
        {
          activeTab === 'tendencias' && (
            <div id="chart-comparativo-tendencia" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Evolución Histórica (Reclamado vs Indemnizado)</h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: comparativos.historicoMensual.map(d => d.mes),
                    datasets: [
                      {
                        label: 'Reclamado (M)',
                        data: comparativos.historicoMensual.map(d => d.reclamado / 1000000),
                        backgroundColor: CHART_COLORS.accent1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Indemnizado (M)',
                        data: comparativos.historicoMensual.map(d => d.indemnizado / 1000000),
                        backgroundColor: CHART_COLORS.accent2,
                        borderRadius: 4,
                      }
                    ]
                  }}
                  options={barChartOptions}
                />
              </div>
            </div>
          )
        }
      </div >
    </ReportLayout >
  );
};

export default AnalisisComparativo;
