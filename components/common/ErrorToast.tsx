import React from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AppError } from '../../context/ClaimsContext';

interface ErrorToastProps {
  errors: AppError[];
  onDismiss: (index: number) => void;
}

/**
 * Componente de notificación de errores
 * Muestra errores de la aplicación con opción de cerrar
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({ errors, onDismiss }) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {errors.map((error, index) => (
        <ErrorItem key={index} error={error} onDismiss={() => onDismiss(index)} />
      ))}
    </div>
  );
};

const ErrorItem: React.FC<{
  error: AppError;
  onDismiss: () => void;
}> = ({ error, onDismiss }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'update':
      case 'state_change':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'fetch':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (error.type) {
      case 'update':
      case 'state_change':
        return 'bg-amber-900/90 border-amber-700 text-amber-100';
      case 'fetch':
        return 'bg-rose-900/90 border-rose-700 text-rose-100';
      default:
        return 'bg-blue-900/90 border-blue-700 text-blue-100';
    }
  };

  return (
    <div
      className={`${getColors()} border px-4 py-3 rounded-lg shadow-xl max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{error.message}</p>
          <p className="text-xs opacity-70 mt-1">
            {error.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
