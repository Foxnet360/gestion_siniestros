import { useState, useCallback, useEffect } from 'react';
import type { FiltrosEficiencia } from './useEficienciaEtapas';

interface FiltrosOptions {
  aseguradoras: Array<{ id: string; nombre: string }>;
  ramos: Array<{ id: string; nombre: string }>;
  tecnicos: Array<{ id: string; nombre: string }>;
}

interface UseFiltrosEficienciaReturn {
  filtros: FiltrosEficiencia;
  options: FiltrosOptions;
  loading: boolean;
  updateFiltro: <K extends keyof FiltrosEficiencia>(key: K, value: FiltrosEficiencia[K]) => void;
  limpiarFiltros: () => void;
  aplicarFiltros: () => void;
  filtrosActivos: Array<{ key: string; label: string; value: string }>;
}

const STORAGE_KEY = 'kpi_eficiencia_filtros';

export function useFiltrosEficiencia(
  onFiltrosChange?: (filtros: FiltrosEficiencia) => void
): UseFiltrosEficienciaReturn {
  const [filtros, setFiltros] = useState<FiltrosEficiencia>(() => {
    // Cargar filtros guardados
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorar errores de localStorage
    }
    return {};
  });

  const [options, setOptions] = useState<FiltrosOptions>({
    aseguradoras: [],
    ramos: [],
    tecnicos: [],
  });

  const [loading, setLoading] = useState(true);

  // Cargar opciones de filtros
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        // Cargar aseguradoras
        const { data: aseguradoras } = await supabase
          .from('claims')
          .select('aseguradora')
          .not('aseguradora', 'is', null)
          .order('aseguradora');

        // Cargar ramos
        const { data: ramos } = await supabase
          .from('claims')
          .select('ramo')
          .not('ramo', 'is', null)
          .order('ramo');

        // Cargar tecnicos
        const { data: tecnicos } = await supabase
          .from('claims')
          .select('tecnico_asignado')
          .not('tecnico_asignado', 'is', null)
          .order('tecnico_asignado');

        setOptions({
          aseguradoras: [
            ...new Set(aseguradoras?.map(a => a.aseguradora))
          ].map(a => ({
            id: a,
            nombre: a,
          })),
          ramos: [
            ...new Set(ramos?.map(r => r.ramo))
          ].map(r => ({
            id: r,
            nombre: r,
          })),
          tecnicos: [...new Set(tecnicos?.map(t => t.tecnico_asignado))].map(t => ({
            id: t,
            nombre: t,
          })),
        });
      } catch (error) {
        console.error('Error cargando opciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarOpciones();
  }, []);

  // Guardar filtros en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
    } catch {
      // Ignorar errores
    }
  }, [filtros]);

  const updateFiltro = useCallback(
    <K extends keyof FiltrosEficiencia>(key: K, value: FiltrosEficiencia[K]) => {
      setFiltros(prev => {
        const nuevos = { ...prev, [key]: value };
        // Si el valor es undefined o vacío, eliminar la clave
        if (value === undefined || value === '' || value === null) {
          delete (nuevos as any)[key];
        }
        return nuevos;
      });
    },
    []
  );

  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);

  const aplicarFiltros = useCallback(() => {
    onFiltrosChange?.(filtros);
  }, [filtros, onFiltrosChange]);

  // Calcular filtros activos para mostrar
  const filtrosActivos = Object.entries(filtros)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null)
    .map(([key, value]) => {
      let label = key;
      let valueStr = String(value);

      switch (key) {
        case 'aseguradoraId':
          label = 'Aseguradora';
          valueStr = options.aseguradoras.find(a => a.id === value)?.nombre || valueStr;
          break;
        case 'ramoId':
          label = 'Ramo';
          valueStr = options.ramos.find(r => r.id === value)?.nombre || valueStr;
          break;
        case 'tecnicoId':
          label = 'Tecnico';
          valueStr = options.tecnicos.find(t => t.id === value)?.nombre || valueStr;
          break;
        case 'tipoProceso':
          label = 'Tipo Proceso';
          valueStr =
            valueStr === 'normal'
              ? 'Normal'
              : valueStr === 'prescripcion_ordinaria'
                ? 'Prescripcion Ord'
                : valueStr === 'prescripcion_extraordinaria'
                  ? 'Prescripcion Ext'
                  : valueStr;
          break;
        case 'fechaDesde':
          label = 'Desde';
          break;
        case 'fechaHasta':
          label = 'Hasta';
          break;
        case 'valorMin':
          label = 'Valor Min';
          valueStr = `$${Number(value).toLocaleString()}`;
          break;
        case 'valorMax':
          label = 'Valor Max';
          valueStr = `$${Number(value).toLocaleString()}`;
          break;
      }

      return { key, label, value: valueStr };
    });

  return {
    filtros,
    options,
    loading,
    updateFiltro,
    limpiarFiltros,
    aplicarFiltros,
    filtrosActivos,
  };
}

// Import necesario
import { supabase } from '../lib/supabase';
