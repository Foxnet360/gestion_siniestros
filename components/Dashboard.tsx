import React, { useMemo, useState } from 'react';
import { Claim, KpiData } from '../types';
import { WORKFLOW_PHASES, getPhaseColor } from '../constants';
import FilterBar from './FilterBar';
import {
  DollarSign, Activity, AlertCircle, Clock,
  Briefcase, Building, User, Users, FileBarChart2,
  ChevronDown, ChevronRight, ExternalLink, Shield, AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onChangeView: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ claims, onSelectClaim, onChangeView }) => {
  // KPI Calculation
  const kpis: KpiData = useMemo(() => {
    const totalReclamado = claims.reduce((acc, curr) => acc + (curr.estado_interno !== 'PAGADO' && curr.estado_interno !== 'FINALIZADO' ? curr.monto_reclamo : 0), 0);

    const closedClaims = claims.filter(c => c.estado_interno === 'PAGADO' || c.estado_interno === 'FINALIZADO');
    const successClaims = closedClaims.filter(c => c.valor_indemnizacion > 0);
    const tasaExito = closedClaims.length > 0 ? (successClaims.length / closedClaims.length) * 100 : 0;

    const today = new Date();
    const casosQuietos = claims.filter(c => {
      // Use lastStateChangeDate if available, otherwise fallback to updatedAt (for older records)
      const lastChange = c.lastStateChangeDate ? new Date(c.lastStateChangeDate) : new Date(c.updatedAt);
      const diffTime = Math.abs(today.getTime() - lastChange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Alert threshold: 30 Days
      return diffDays > 30 && c.estado_interno !== 'PAGADO' && c.estado_interno !== 'FINALIZADO';
    }).length;

    return { totalReclamado, tasaExito, casosQuietos };
  }, [claims]);

  // Prescription Risk Calculation
  const prescriptionRisks = useMemo(() => {
    return claims.filter(c => {
      if (!c.fecha_ocurrencia) return false;
      const ocurrencia = new Date(c.fecha_ocurrencia);
      if (isNaN(ocurrencia.getTime())) return false;

      const now = new Date();
      const ordinaria = new Date(ocurrencia);
      ordinaria.setFullYear(ordinaria.getFullYear() + 2);

      const daysToOrd = Math.ceil((ordinaria.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // Risk if < 90 days to Ordinary and not closed
      return daysToOrd < 90 && daysToOrd > 0 && c.estado_interno !== 'PAGADO' && c.estado_interno !== 'FINALIZADO';
    });
  }, [claims]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  // Generic Grouper
  const groupData = (key: keyof Claim) => {
    const grouped: Record<string, Claim[]> = {};
    claims.forEach(claim => {
      const val = String(claim[key]);
      if (!grouped[val]) grouped[val] = [];
      grouped[val].push(claim);
    });

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  };

  const Widget = ({ title, icon: Icon, dataKey, color }: { title: string, icon: any, dataKey: keyof Claim, color: string }) => {
    const groupedData = groupData(dataKey);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    const toggleGroup = (groupKey: string) => {
      if (expandedGroup === groupKey) setExpandedGroup(null);
      else setExpandedGroup(groupKey);
    };

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
        <div className={`p-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg bg-${color}-900/30 text-${color}-400`}>
              <Icon className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wide">{title}</h4>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
            {groupedData.length} Grupos
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
          {groupedData.map(([groupName, groupClaims]) => {
            const isExpanded = expandedGroup === groupName;
            const totalAmount = groupClaims.reduce((sum, c) => sum + c.monto_reclamo, 0);

            // Check if group has any alerts
            const hasAlerts = groupClaims.some(c => {
              const lastChange = c.lastStateChangeDate ? new Date(c.lastStateChangeDate) : new Date(c.updatedAt);
              const days = Math.ceil(Math.abs(Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
              return days > 30 && c.estado_interno !== 'PAGADO' && c.estado_interno !== 'FINALIZADO';
            });

            return (
              <div key={groupName} className={`rounded-lg bg-slate-900/50 border overflow-hidden ${hasAlerts && !isExpanded ? 'border-rose-900/50' : 'border-slate-800'}`}>
                <button
                  onClick={() => toggleGroup(groupName)}
                  className={`w-full flex items-center justify-between p-3 hover:bg-slate-800/80 transition-colors ${isExpanded ? 'bg-slate-800' : ''}`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-medium text-slate-300 truncate text-left">{groupName}</span>
                    {hasAlerts && !isExpanded && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse ml-2" />}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500 hidden sm:block">{formatCurrency(totalAmount)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md min-w-[2rem] text-center ${isExpanded ? `bg-${color}-900/50 text-${color}-200` : 'bg-slate-700 text-slate-300'}`}>
                      {groupClaims.length}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700 bg-slate-950/30">
                    {groupClaims.map(claim => {
                      const phaseColor = getPhaseColor(claim.estado_interno);

                      // Calculate Alert per row
                      const lastChange = claim.lastStateChangeDate ? new Date(claim.lastStateChangeDate) : new Date(claim.updatedAt);
                      const daysInState = Math.ceil(Math.abs(Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
                      const isStagnant = daysInState > 30 && claim.estado_interno !== 'PAGADO' && claim.estado_interno !== 'FINALIZADO';

                      return (
                        <div
                          key={claim.id_softseguros}
                          onClick={() => onSelectClaim(claim)}
                          className={`flex items-center justify-between p-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 cursor-pointer group pl-8 
                            ${isStagnant ? 'bg-rose-900/10' : ''}`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              {isStagnant && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                              <span className={`text-xs font-mono transition-colors ${isStagnant ? 'text-rose-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                                {claim.numero_siniestro}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{claim.asegurado}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border border-${phaseColor}-900/30 bg-${phaseColor}-900/10 text-${phaseColor}-300 mb-1`}>
                              {claim.estado_interno}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{formatCurrency(claim.monto_reclamo)}</span>
                            {isStagnant && <span className="text-[9px] text-rose-500 font-bold">{daysInState} días</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <FilterBar />

      {/* Prescription Risk Alert */}
      {prescriptionRisks.length > 0 && (
        <div className="bg-rose-900/10 border border-rose-900/50 rounded-xl p-4 flex items-start space-x-3 animate-fade-in">
          <div className="bg-rose-900/20 p-2 rounded-full">
            <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 font-bold mb-1 text-sm">Riesgo de Prescripción detectado</h3>
            <p className="text-xs text-rose-200/70 mb-2">Hay <span className="font-bold text-rose-100">{prescriptionRisks.length} casos</span> próximos a cumplir 2 años desde la fecha del siniestro.</p>
          </div>
          <button
            onClick={() => onChangeView('prescription-risk')}
            className="text-xs text-rose-400 hover:text-rose-300 underline mt-1"
          >
            Ver casos
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <DollarSign className="w-16 h-16 text-blue-400" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Reclamado (Abierto)</h3>
          <p className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(kpis.totalReclamado)}</p>
          <div className="mt-2 flex items-center text-xs text-blue-400">
            <Activity className="w-3 h-3 mr-1" />
            <span>En gestión activa</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Tasa de Éxito</h3>
          <p className="text-2xl font-bold text-slate-100 mt-2">{kpis.tasaExito.toFixed(1)}%</p>
          <div className="mt-2 text-xs text-emerald-400">
            Indemnizados vs. Cerrados
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <AlertCircle className="w-16 h-16 text-rose-400" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider text-rose-400">Alertas Activas</h3>
          <p className="text-2xl font-bold text-slate-100 mt-2">{kpis.casosQuietos}</p>
          <div className="mt-2 flex items-center text-xs text-rose-400">
            <Clock className="w-3 h-3 mr-1" />
            <span>&gt; 30 días en mismo estado</span>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {/* 1. Compañía (Cliente) */}
        <Widget
          title="Por Cliente (Compañía)"
          icon={Building}
          dataKey="asegurado"
          color="blue"
        />

        {/* 2. Ramo */}
        <Widget
          title="Por Ramo"
          icon={FileBarChart2}
          dataKey="ramo"
          color="indigo"
        />

        {/* 3. Aseguradora */}
        <Widget
          title="Por Aseguradora"
          icon={Shield}
          dataKey="aseguradora"
          color="amber"
        />

        {/* 4. Estado */}
        <Widget
          title="Por Estado"
          icon={Activity}
          dataKey="estado_interno"
          color="emerald"
        />

        {/* 5. Técnico Encargado */}
        <Widget
          title="Por Técnico"
          icon={Users}
          dataKey="tecnico_asignado"
          color="purple"
        />

        {/* 6. Vendedor */}
        <Widget
          title="Por Vendedor"
          icon={User}
          dataKey="vendedor"
          color="rose"
        />
      </div>
    </div>
  );
};

export default Dashboard;