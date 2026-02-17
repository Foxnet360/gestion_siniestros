import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ExportButtons from '../common/ExportButtons';
import { useClaims } from '../../../context/ClaimsContext';
import { useComparativos } from '../../../hooks/reports/useComparativos';
import type { ExportOptions } from '../../../types/reports';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface AnalisisComparativoProps {
  onBack: () => void;
}

type ComparativoType = 'mes' | 'anio' | 'aseguradora';

const AnalisisComparativo: React.FC<AnalisisComparativoProps> = ({ onBack }) => {
  const { claims } = useClaims();
  const [activeTab, setActiveTab] = useState<ComparativoType>('mes');

  const comparativos = useComparativos(claims);

  const handleExportExcel = (options: ExportOptions) => {
    console.log('Export Excel:', options);
  };

  const handleExportPDF = (options: ExportOptions) => {
    console.log('Export PDF:', options);
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
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'mes', label: 'Mes vs Mes' },
            { id: 'anio', label: 'Año vs Año' },
            { id: 'aseguradora', label: 'Por Aseguradora' },
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
      </div>
    </ReportLayout>
  );
};

export default AnalisisComparativo;
