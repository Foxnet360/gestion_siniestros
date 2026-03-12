import React from 'react';
import { formatCOP } from '../../utils/formatCurrency';

interface CurrencyDisplayProps {
  value: number;
  className?: string;
  showDecimals?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  className = '',
  showDecimals = false,
}) => {
  const formattedValue = showDecimals
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    : formatCOP(value);

  return <span className={`font-mono ${className}`}>{formattedValue}</span>;
};
