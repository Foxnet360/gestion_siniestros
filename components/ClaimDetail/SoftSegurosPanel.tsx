import React, { useEffect, useState } from 'react';
import { Claim, Amparo } from '../../types';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  User,
  FileText,
  Calendar,
  Building,
  Car,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  MapPin,
  DollarSign,
  Tag,
  Info,
} from 'lucide-react';

interface SoftSegurosPanelProps {
  claim: Claim;
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const Field: React.FC<{
  label: string;
  value: string | number | undefined | null;
  icon?: React.ReactNode;
  isCurrency?: boolean;
  isDate?: boolean;
  className?: string;
}> = ({ label, value, icon, isCurrency, isDate, className = '' }) => {
  const displayValue = isCurrency
    ? formatCurrency(value as number)
    : isDate
      ? formatDate(value as string)
      : value || '-';

  const isEmpty = !value || (typeof value === 'number' && value === 0);

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
          {label}
        </span>
      </div>
      <div
        className={`text-sm ${isEmpty ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200 font-medium'}`}
      >
        {displayValue}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({
  title,
  children,
  icon,
}) => (
  <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
      {icon && <span className="text-blue-500">{icon}</span>}
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
        {title}
      </h4>
    </div>
    {children}
  </div>
);

export const SoftSegurosPanel: React.FC<SoftSegurosPanelProps> = ({ claim }) => {
  const [amparos, setAmparos] = useState<Amparo[]>([]);
  const [loadingAmparos, setLoadingAmparos] = useState(true);

  useEffect(() => {
    const fetchAmparos = async () => {
      try {
        const { data, error } = await supabase
          .from('amparos')
          .select('*')
          .eq('claim_id', claim.id_softseguros);

        if (error) throw error;
        setAmparos(data || []);
      } catch (err) {
        console.error('Error fetching amparos:', err);
      } finally {
        setLoadingAmparos(false);
      }
    };

    fetchAmparos();
  }, [claim.id_softseguros]);

  const totalAmparos = amparos.reduce((sum, a) => sum + (a.valor || 0), 0);

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto">
      {/* Header del panel */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Datos del Siniestro
          </h3>
          <p className="text-xs text-slate-500">Origen: Softseguros</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Columna 1: Información Principal y Asegurado */}
        <div className="space-y-4">
          <Section title="Información Principal" icon={<FileText className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Número Siniestro"
                value={claim.numero_siniestro}
                icon={<Tag className="w-3.5 h-3.5" />}
              />
              <Field
                label="Número Compañía"
                value={claim.numero_siniestro_compania}
                icon={<Building className="w-3.5 h-3.5" />}
              />
              <Field
                label="Tipo"
                value={claim.tipo_siniestro}
                icon={<Car className="w-3.5 h-3.5" />}
              />
              <Field
                label="Estado Origen"
                value={claim.estado_softseguros}
                icon={<Info className="w-3.5 h-3.5" />}
              />
            </div>
          </Section>

          <Section title="Asegurado" icon={<User className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Nombre"
                value={claim.asegurado}
                icon={<User className="w-3.5 h-3.5" />}
              />
              <Field
                label="Documento"
                value={claim.documento_asegurado}
                icon={<CreditCard className="w-3.5 h-3.5" />}
              />
              <Field
                label="Email"
                value={claim.email_principal}
                icon={<Mail className="w-3.5 h-3.5" />}
              />
              <Field
                label="Teléfono"
                value={claim.celular_principal}
                icon={<Phone className="w-3.5 h-3.5" />}
              />
              <Field
                label="Bien Asegurado"
                value={claim.placa_bien}
                icon={<MapPin className="w-3.5 h-3.5" />}
              />
            </div>
          </Section>
        </div>

        {/* Columna 2: Fechas y Póliza */}
        <div className="space-y-4">
          <Section title="Fechas Importantes" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Fecha Siniestro"
                value={claim.fecha_ocurrencia}
                icon={<Calendar className="w-3.5 h-3.5" />}
                isDate
              />
              <Field
                label="Fecha Aviso"
                value={claim.fecha_aviso}
                icon={<Calendar className="w-3.5 h-3.5" />}
                isDate
              />
              <Field
                label="Fecha Notificación"
                value={claim.fecha_notificacion_aseguradora}
                icon={<Calendar className="w-3.5 h-3.5" />}
                isDate
              />
              {claim.finalizado && (
                <Field
                  label="Fecha Finalización"
                  value={claim.fecha_finalizacion}
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  isDate
                />
              )}
            </div>
          </Section>

          <Section title="Póliza y Aseguradora" icon={<Shield className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Póliza"
                value={claim.poliza}
                icon={<Shield className="w-3.5 h-3.5" />}
              />
              <Field
                label="Aseguradora"
                value={claim.aseguradora}
                icon={<Building className="w-3.5 h-3.5" />}
              />
              <Field label="Ramo" value={claim.ramo} icon={<Tag className="w-3.5 h-3.5" />} />
              <Field
                label="Registrado Por"
                value={claim.usuario_registro}
                icon={<User className="w-3.5 h-3.5" />}
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Finalizado
                </span>
                <span
                  className={`text-sm font-medium ${claim.finalizado ? 'text-emerald-600' : 'text-slate-500'}`}
                >
                  {claim.finalizado ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </Section>
        </div>

        {/* Columna 3: Valores, Proveedor y Descripción */}
        <div className="space-y-4">
          <Section title="Valores del Siniestro" icon={<DollarSign className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Monto Reclamo"
                value={claim.monto_reclamo}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                isCurrency
              />
              <Field
                label="Valor Indemnización"
                value={claim.valor_indemnizacion}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                isCurrency
              />
              <Field
                label="Deducible"
                value={claim.valor_deducible}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                isCurrency
              />
              <Field
                label="Coaseguros"
                value={claim.coaseguros}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                isCurrency
              />
            </div>
          </Section>

          <Section title="Proveedor y Descripción" icon={<Info className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field
                label="Proveedor Asignado"
                value={claim.proveedor_asignado}
                icon={<Building className="w-3.5 h-3.5" />}
              />
              <div>
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Descripción (Hechos)
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2 rounded">
                  {claim.descripcion || 'Sin descripción disponible'}
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Amparos Afectados - Sección completa */}
      {!loadingAmparos && amparos.length > 0 && (
        <div className="mt-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Shield className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Amparos Afectados ({amparos.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2">Reclamante</th>
                  <th className="pb-2">Amparo</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {amparos.map(amparo => (
                  <tr key={amparo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 text-slate-700 dark:text-slate-300">
                      {amparo.nombre_reclamante}
                    </td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{amparo.amparo}</td>
                    <td className="py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(amparo.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="py-2 text-xs font-semibold text-slate-500">
                    Total:
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-600">
                    {formatCurrency(totalAmparos)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
