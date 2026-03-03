import React from 'react';
import { Claim } from '../types';
import { useKpiData } from '../hooks/useFilters';
import { usePrescriptionRisks } from '../hooks/usePrescription';
import { useClaims } from '../context/ClaimsContext';
import { usePagination } from '../hooks/usePagination';
import FilterBar from './FilterBar';
import ClaimsTable from './ClaimsTable';
import Pagination from './common/Pagination';
import { KpiCard } from './Dashboard/KpiCard';
import { ClaimsWidget } from './Dashboard/ClaimsWidget';
import { PrescriptionAlert } from './Dashboard/PrescriptionAlert';
import {
  DollarSign,
  Activity,
  AlertCircle,
  Clock,
  Building,
  FileBarChart2,
  Shield,
  Users,
  User,
  Search,
  Loader2,
} from 'lucide-react';

interface DashboardProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onChangeView: (view: string) => void;
}

/**
 * Dashboard principal refactorizado
 * Utiliza componentes especializados y hooks memoizados
 */
const Dashboard: React.FC<DashboardProps> = ({ claims, onSelectClaim, onChangeView }) => {
  // KPIs calculados con useMemo
  const kpis = useKpiData(claims);

  // Riesgos de prescripción
  const prescriptionRisks = usePrescriptionRisks(claims);

  // Obtener el término de búsqueda actual y estado de búsqueda
  const { filters, isSearching, users } = useClaims();
  const hasSearchTerm = filters.searchTerm && filters.searchTerm.trim().length > 0;
  const searchTermLength = filters.searchTerm?.trim().length || 0;

  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    setPageSize,
  } = usePagination(claims, 50);

  return (
    <div className="space-y-6">
      <FilterBar />

      {/* Resultados de búsqueda */}
      {hasSearchTerm && (
        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                Resultados de búsqueda: "{filters.searchTerm}"
              </h3>
            </div>
            <div className="flex items-center space-x-4">
              {isSearching && (
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Buscando...</span>
                </div>
              )}
              {searchTermLength < 3 ? (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Ingrese al menos 3 caracteres para buscar
                </span>
              ) : (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {claims.length}{' '}
                  {claims.length === 1 ? 'siniestro encontrado' : 'siniestros encontrados'}
                </span>
              )}
            </div>
          </div>
          {searchTermLength >= 3 && claims.length > 0 ? (
            <>
              <ClaimsTable claims={paginatedItems} onSelectClaim={onSelectClaim} users={users} />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          ) : searchTermLength >= 3 && claims.length === 0 && !isSearching ? (
            <div className="p-8 text-center text-slate-500">
              <p>No se encontraron siniestros que coincidan con la búsqueda.</p>
            </div>
          ) : searchTermLength < 3 ? (
            <div className="p-8 text-center text-slate-500">
              <p>Ingrese al menos 3 caracteres para buscar en toda la base de datos.</p>
            </div>
          ) : null}
        </div>
      )}

      <PrescriptionAlert
        riskCount={prescriptionRisks.length}
        onViewCases={() => onChangeView('prescription-risk')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Reclamado (Abierto)"
          value={kpis.totalReclamado}
          icon={DollarSign}
          iconColor="blue"
          subtitle="En gestión activa"
          format="currency"
        />

        <KpiCard
          title="Tasa de Éxito"
          value={kpis.tasaExito}
          icon={Activity}
          iconColor="emerald"
          subtitle="Indemnizados vs. Cerrados"
          format="percentage"
        />

        <KpiCard
          title="Alertas Activas"
          value={kpis.casosQuietos}
          icon={AlertCircle}
          iconColor="rose"
          subtitle="> 30 días en mismo estado"
          format="number"
          alert
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        <ClaimsWidget
          title="Por Cliente (Compañía)"
          icon={Building}
          dataKey="asegurado"
          color="blue"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />

        <ClaimsWidget
          title="Por Ramo"
          icon={FileBarChart2}
          dataKey="ramo"
          color="indigo"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />

        <ClaimsWidget
          title="Por Aseguradora"
          icon={Shield}
          dataKey="aseguradora"
          color="amber"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />

        <ClaimsWidget
          title="Por Estado"
          icon={Activity}
          dataKey="estado_interno"
          color="emerald"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />

        <ClaimsWidget
          title="Por Técnico"
          icon={Users}
          dataKey="tecnico_asignado"
          color="purple"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />

        <ClaimsWidget
          title="Por Vendedor"
          icon={User}
          dataKey="vendedor"
          color="rose"
          claims={claims}
          onSelectClaim={onSelectClaim}
        />
      </div>

      {/* Listado Maestro con Paginación - Solo cuando no hay búsqueda */}
      {!hasSearchTerm && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Listado Maestro</h3>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {totalItems} siniestros en total
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <ClaimsTable claims={paginatedItems} onSelectClaim={onSelectClaim} users={users} />
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
