import React from 'react';
import { Claim } from '../types';
import { useKpiData } from '../hooks/useFilters';
import { usePrescriptionRisks } from '../hooks/usePrescription';
import FilterBar from './FilterBar';
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

  return (
    <div className="space-y-6">
      <FilterBar />

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
    </div>
  );
};

export default Dashboard;
