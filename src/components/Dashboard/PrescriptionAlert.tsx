import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PrescriptionAlertProps {
  riskCount: number;
  onViewCases: () => void;
}

/**
 * Alerta de riesgo de prescripción
 * Muestra advertencia cuando hay casos próximos a prescribir
 */
export const PrescriptionAlert: React.FC<PrescriptionAlertProps> = ({
  riskCount,
  onViewCases,
}) => {
  if (riskCount === 0) return null;

  return (
    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4 flex items-start space-x-3 animate-fade-in shadow-sm">
      <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full">
        <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
      </div>
      <div className="flex-1">
        <h3 className="text-rose-900 dark:text-rose-100 font-bold mb-1 text-sm">Riesgo de Prescripción detectado</h3>
        <p className="text-xs text-rose-700 dark:text-rose-200 mb-2 leading-relaxed">
          Hay <span className="font-bold text-rose-950 dark:text-white">{riskCount} casos</span> próximos a cumplir 2 años
          desde la fecha del siniestro.
        </p>
      </div>
      <button
        onClick={onViewCases}
        className="text-xs text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 underline mt-1 font-semibold transition-colors"
      >
        Ver casos
      </button>
    </div>
  );
};
