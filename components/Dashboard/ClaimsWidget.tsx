import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { Claim } from '../../types';
import { getPhaseColor } from '../../constants';
import { useGroupedClaims } from '../../hooks/useFilters';
import { isStagnant, getDaysSinceLastChange } from '../../utils/claimUtils';
import { formatCurrency } from '../../utils/formatters';

interface ClaimsWidgetProps {
  title: string;
  dataKey: keyof Claim;
  icon: React.ElementType;
  color: string;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

/**
 * Widget de agrupación de claims
 * Muestra claims agrupados por una clave específica con expansión
 */
export const ClaimsWidget: React.FC<ClaimsWidgetProps> = ({
  title,
  dataKey,
  icon: Icon,
  color,
  claims,
  onSelectClaim,
}) => {
  const groupedData = useGroupedClaims(claims, dataKey);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroup(expandedGroup === groupKey ? null : groupKey);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <WidgetHeader title={title} icon={Icon} color={color} groupCount={groupedData.length} />

      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {groupedData.map(([groupName, groupClaims]) => (
          <GroupSection
            key={groupName}
            groupName={groupName}
            groupClaims={groupClaims}
            color={color}
            isExpanded={expandedGroup === groupName}
            onToggle={() => toggleGroup(groupName)}
            onSelectClaim={onSelectClaim}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Header del widget
 */
const WidgetHeader: React.FC<{
  title: string;
  icon: React.ElementType;
  color: string;
  groupCount: number;
}> = ({ title, icon: Icon, color, groupCount }) => {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">{title}</h4>
      </div>
      <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
        {groupCount} Grupos
      </span>
    </div>
  );
};

/**
 * Sección de grupo expandible
 */
const GroupSection: React.FC<{
  groupName: string;
  groupClaims: Claim[];
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectClaim: (claim: Claim) => void;
}> = ({ groupName, groupClaims, color, isExpanded, onToggle, onSelectClaim }) => {
  const totalAmount = useMemo(
    () => groupClaims.reduce((sum, c) => sum + c.monto_reclamo, 0),
    [groupClaims]
  );

  const hasAlerts = useMemo(() => groupClaims.some(isStagnant), [groupClaims]);

  return (
    <div
      className={`rounded-lg bg-slate-50 dark:bg-slate-900/50 border overflow-hidden ${hasAlerts && !isExpanded ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-800'
        }`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${isExpanded ? 'bg-slate-100 dark:bg-slate-800' : ''
          }`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate text-left">{groupName}</span>
          {hasAlerts && !isExpanded && (
            <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse ml-2" />
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-slate-500 hidden sm:block">{formatCurrency(totalAmount)}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md min-w-[2rem] text-center ${isExpanded
              ? `bg-${color}-100 dark:bg-${color}-900/50 text-${color}-700 dark:text-${color}-200`
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            {groupClaims.length}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30">
          {groupClaims.map(claim => (
            <ClaimItem key={claim.id_softseguros} claim={claim} onSelect={onSelectClaim} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Item individual de claim
 */
const ClaimItem: React.FC<{
  claim: Claim;
  onSelect: (claim: Claim) => void;
}> = ({ claim, onSelect }) => {
  const phaseColor = getPhaseColor(claim.estado_interno);
  const daysInState = getDaysSinceLastChange(claim);
  const stagnant = isStagnant(claim);

  return (
    <div
      onClick={() => onSelect(claim)}
      className={`flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer group pl-8 ${stagnant ? 'bg-rose-50 dark:bg-rose-900/10' : ''
        }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          {stagnant && <AlertTriangle className="w-3 h-3 text-rose-500" />}
          <span
            className={`text-xs font-mono transition-colors ${stagnant ? 'text-rose-400' : 'text-slate-400 group-hover:text-blue-400'
              }`}
          >
            {claim.numero_siniestro}
          </span>
          <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{claim.asegurado}</span>
      </div>
      <div className="flex flex-col items-end">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded border border-${phaseColor}-200 bg-${phaseColor}-100 text-${phaseColor}-800 dark:border-${phaseColor}-700/50 dark:bg-${phaseColor}-900/50 dark:text-${phaseColor}-200 mb-1`}
        >
          {claim.estado_interno}
        </span>
        <span className="text-[10px] font-mono text-slate-400">{formatCurrency(claim.monto_reclamo)}</span>
        {stagnant && <span className="text-[9px] text-rose-500 font-bold">{daysInState} días</span>}
      </div>
    </div>
  );
};
