import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';

interface ReportLayoutProps {
  title: string;
  description?: string;
  onBack: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({
  title,
  description,
  onBack,
  children,
  actions,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 
                       transition-colors text-sm mb-2 group font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver a Reportes
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  );
};

export default ReportLayout;