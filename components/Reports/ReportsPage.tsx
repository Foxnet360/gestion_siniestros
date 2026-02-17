import React, { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Clock,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import type { User } from '../../types';
import { REPORT_TYPES } from '../../constants/reports';
import DashboardGerencial from './DashboardGerencial/DashboardGerencial';
import ReportePrescripcion from './ReportePrescripcion/ReportePrescripcion';
import DashboardOperativo from './DashboardOperativo/DashboardOperativo';
import MetricasTiempo from './MetricasTiempo/MetricasTiempo';
import AnalisisComparativo from './AnalisisComparativo/AnalisisComparativo';

interface ReportsPageProps {
  currentUser: User;
}

type ReportView = 'selector' | 'dashboard-gerencial' | 'reporte-prescripcion' | 'dashboard-operativo' | 'metricas-tiempo' | 'analisis-comparativo';

const iconMap = {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Clock,
  BarChart3,
};

const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser }) => {
  const [currentReport, setCurrentReport] = useState<ReportView>('selector');

  // Guard: Only ADMIN can access
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 dark:text-slate-400">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-8 text-center max-w-md">
          <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">Acceso Restringido</h3>
          <p className="text-slate-600 dark:text-slate-400">
            El módulo de Reportes está disponible únicamente para usuarios con rol de Administrador.
          </p>
        </div>
      </div>
    );
  }

  const handleBackToSelector = () => {
    setCurrentReport('selector');
  };

  const renderReport = () => {
    switch (currentReport) {
      case 'dashboard-gerencial':
        return <DashboardGerencial onBack={handleBackToSelector} />;
      case 'reporte-prescripcion':
        return <ReportePrescripcion onBack={handleBackToSelector} />;
      case 'dashboard-operativo':
        return <DashboardOperativo onBack={handleBackToSelector} />;
      case 'metricas-tiempo':
        return <MetricasTiempo onBack={handleBackToSelector} />;
      case 'analisis-comparativo':
        return <AnalisisComparativo onBack={handleBackToSelector} />;
      default:
        return null;
    }
  };

  if (currentReport !== 'selector') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {renderReport()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Módulo de Reportes y Análisis</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Seleccione un reporte para visualizar métricas, análisis comparativos y
          herramientas de toma de decisiones estratégicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => {
          const Icon = iconMap[report.icon as keyof typeof iconMap];
          return (
            <button
              key={report.id}
              onClick={() => setCurrentReport(report.id as ReportView)}
              className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-left
                         hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500/50 
                         transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                {report.label}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{report.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsPage;
