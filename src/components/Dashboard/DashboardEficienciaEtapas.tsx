import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Filter, Download } from 'lucide-react';
import { useEficienciaEtapas, FiltrosEficiencia } from '../../hooks/useEficienciaEtapas';
import { useFiltrosEficiencia } from '../../hooks/useFiltrosEficiencia';
import { IndicadorCalidadDatos } from './components/IndicadorCalidadDatos';
import { FiltrosEficiencia as FiltrosComponent } from './components/FiltrosEficiencia';
import { FunnelEtapas } from './components/FunnelEtapas';
import { TiemposPorEtapa } from './components/TiemposPorEtapa';
import { CuellosDeBotella } from './components/CuellosDeBotella';
import { LeadTimePorTipoProceso } from './components/LeadTimePorTipoProceso';
import { ResumenEficiencia } from './components/ResumenEficiencia';

export const DashboardEficienciaEtapas: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosEficiencia>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data, funnel, calidad, loading, error, refetch } = useEficienciaEtapas(filtros, true);

  const {
    filtros: filtrosState,
    options,
    loading: loadingFiltros,
    updateFiltro,
    limpiarFiltros,
    aplicarFiltros,
    filtrosActivos,
  } = useFiltrosEficiencia(nuevosFiltros => {
    setFiltros(nuevosFiltros);
  });

  const handleAplicarFiltros = () => {
    aplicarFiltros();
    setMostrarFiltros(false);
  };

  const handleLimpiarFiltros = () => {
    limpiarFiltros();
    setFiltros({});
  };

  const handleExportar = () => {
    // TODO: Implementar exportacion
    console.log('Exportando datos...');
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando métricas de eficiencia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Error al cargar datos</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard de Eficiencia por Etapas
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Análisis de tiempos y eficiencia en cada etapa del proceso
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mostrarFiltros
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {filtrosActivos.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {filtrosActivos.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleExportar}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Filtros activos */}
          {filtrosActivos.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-sm">Filtros activos:</span>
              {filtrosActivos.map(filtro => (
                <span
                  key={filtro.key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm"
                >
                  <span className="font-medium">{filtro.label}:</span> {filtro.value}
                  <button
                    onClick={() => {
                      updateFiltro(filtro.key as keyof FiltrosEficiencia, undefined);
                      aplicarFiltros();
                    }}
                    className="ml-1 hover:text-blue-800 dark:hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={handleLimpiarFiltros}
                className="text-slate-500 dark:text-slate-400 text-sm hover:text-blue-600 dark:hover:text-white underline"
              >
                Limpiar todos
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar de filtros */}
      {mostrarFiltros && (
        <FiltrosComponent
          filtros={filtrosState}
          options={options}
          loading={loadingFiltros}
          onUpdateFiltro={updateFiltro}
          onAplicar={handleAplicarFiltros}
          onLimpiar={handleLimpiarFiltros}
          onCerrar={() => setMostrarFiltros(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6">
        {/* Indicador de calidad */}
        {calidad && (
          <IndicadorCalidadDatos
            totalAnalizados={calidad.totalAnalizados}
            incluidosEnKPI={calidad.incluidosEnKPI}
            excluidos={calidad.excluidos}
            alerta={calidad.alerta}
          />
        )}

        {/* Resumen */}
        {data?.resumen && <ResumenEficiencia resumen={data.resumen} />}

        {/* Lead Time por tipo de proceso */}
        {data?.segmentacion?.byTipoProceso && (
          <LeadTimePorTipoProceso segmentos={data.segmentacion.byTipoProceso} />
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Funnel */}
          {funnel && (
            <FunnelEtapas etapas={funnel.etapas} conversionGeneral={funnel.conversionGeneral} />
          )}

          {/* Tiempos por etapa */}
          {data?.metricasPorEtapa && <TiemposPorEtapa metricas={data.metricasPorEtapa} />}
        </div>

        {/* Cuellos de botella */}
        {data?.cuellosDeBotella && data.cuellosDeBotella.length > 0 && (
          <CuellosDeBotella cuellos={data.cuellosDeBotella} />
        )}
      </main>
    </div>
  );
};
