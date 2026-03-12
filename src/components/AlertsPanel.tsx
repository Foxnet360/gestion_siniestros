import React, { useState, useMemo } from 'react';
import { Claim } from '../types';
import { AlertBadge, AlertLevel } from './AlertBadge';
import { AlertDetailModal } from './AlertDetailModal';
import {
  Filter,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle,
  Search,
  ArrowUpDown,
  Eye,
} from 'lucide-react';

interface AlertsPanelProps {
  claims: Claim[];
  onClaimClick?: (claim: Claim) => void;
}

type FilterType = 'all' | 'critical' | 'warning' | 'stagnation';
type SortField = 'days' | 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

/**
 * Panel dedicado para visualizar y gestionar todas las alertas de siniestros
 * Incluye filtros, ordenamiento y navegación a detalles
 */
export const AlertsPanel: React.FC<AlertsPanelProps> = ({ claims, onClaimClick }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('days');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrar claims con alertas
  const alerts = useMemo(() => {
    return claims.filter(
      claim =>
        claim.alert_level && claim.alert_level !== 'normal' && claim.alert_level !== 'resolved'
    );
  }, [claims]);

  // Aplicar filtros y ordenamiento
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Filtro por tipo
    if (filter !== 'all') {
      result = result.filter(claim => {
        switch (filter) {
          case 'critical':
            return claim.alert_level === 'critical';
          case 'warning':
            return claim.alert_level === 'warning';
          case 'stagnation':
            return claim.alert_level?.includes('legal_stagnation');
          default:
            return true;
        }
      });
    }

    // Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        claim =>
          claim.numero_siniestro.toLowerCase().includes(term) ||
          claim.asegurado.toLowerCase().includes(term) ||
          claim.poliza.toLowerCase().includes(term)
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'days':
          const daysA = getDaysRemaining(a);
          const daysB = getDaysRemaining(b);
          comparison = daysA - daysB;
          break;
        case 'date':
          comparison =
            new Date(a.proximo_seguimiento || 0).getTime() -
            new Date(b.proximo_seguimiento || 0).getTime();
          break;
        case 'amount':
          comparison = (a.monto_reclamo || 0) - (b.monto_reclamo || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [alerts, filter, searchTerm, sortField, sortOrder]);

  // Calcular días restantes
  const getDaysRemaining = (claim: Claim): number => {
    const prescriptionDate = claim.fecha_prescripcion_extraordinaria
      ? new Date(claim.fecha_prescripcion_extraordinaria)
      : claim.fecha_prescripcion_ordinaria
        ? new Date(claim.fecha_prescripcion_ordinaria)
        : null;

    if (!prescriptionDate) return Infinity;

    return Math.ceil((prescriptionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  // Contar por tipo
  const counts = useMemo(
    () => ({
      critical: alerts.filter(c => c.alert_level === 'critical').length,
      warning: alerts.filter(c => c.alert_level === 'warning').length,
      stagnation: alerts.filter(c => c.alert_level?.includes('legal_stagnation')).length,
      total: alerts.length,
    }),
    [alerts]
  );

  const handleClaimClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Panel de Alertas
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {counts.total} alertas activas
          </span>
        </div>

        {/* Filtros por tipo */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({counts.total})
          </button>

          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Críticas ({counts.critical})
          </button>

          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Advertencias ({counts.warning})
          </button>

          <button
            onClick={() => setFilter('stagnation')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filter === 'stagnation'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            Estancamiento ({counts.stagnation})
          </button>
        </div>

        {/* Búsqueda y ordenamiento */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número, asegurado o póliza..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Ordenar por:</span>
            <button
              onClick={() => toggleSort('days')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                sortField === 'days'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Días
              {sortField === 'days' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                sortField === 'date'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Fecha
              {sortField === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">
              No hay alertas activas
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {filter === 'all'
                ? 'Todos los siniestros están en estado normal.'
                : 'No hay alertas que coincidan con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map(claim => (
            <div
              key={claim.id_softseguros}
              onClick={() => handleClaimClick(claim)}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {claim.numero_siniestro}
                    </span>
                    <AlertBadge
                      level={claim.alert_level as AlertLevel}
                      daysRemaining={getDaysRemaining(claim)}
                      size="sm"
                    />
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {claim.asegurado}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{claim.ramo}</span>
                    <span>•</span>
                    <span>{claim.estado_interno}</span>
                    {claim.monto_reclamo > 0 && (
                      <>
                        <span>•</span>
                        <span>${claim.monto_reclamo.toLocaleString('es-CO')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {getDaysRemaining(claim) <= 0 ? 'Vencido' : `${getDaysRemaining(claim)} días`}
                    </p>
                    {claim.proximo_seguimiento && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Seguimiento:{' '}
                        {new Date(claim.proximo_seguimiento).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                  <Eye className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalle */}
      <AlertDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClaim(null);
        }}
        claim={selectedClaim}
        alertLevel={(selectedClaim?.alert_level as AlertLevel) || 'normal'}
        daysRemaining={selectedClaim ? getDaysRemaining(selectedClaim) : undefined}
      />
    </div>
  );
};

export default AlertsPanel;
