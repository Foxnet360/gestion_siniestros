import React, { useEffect, useState } from 'react';
import { Claim, Amparo } from '../../types';
import { supabase } from '../../lib/supabase';
import { Shield, User, FileText, Calendar, Building, Car, Phone, Mail, CreditCard, CheckCircle } from 'lucide-react';

interface SoftSegurosPanelProps {
  claim: Claim;
}

/**
 * Formatea un número como moneda colombiana
 */
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$ 0.00';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea una fecha ISO a formato local
 */
const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Componente reutilizable para campo de solo lectura
 */
const ReadOnlyField: React.FC<{
  label: string;
  value: string | number | undefined | null;
  icon?: React.ReactNode;
  isCurrency?: boolean;
  isDate?: boolean;
}> = ({ label, value, icon, isCurrency, isDate }) => {
  const displayValue = isCurrency
    ? formatCurrency(value as number)
    : isDate
      ? formatDate(value as string)
      : value || '-';

  return (
    <div className="group">
      <label className="text-xs text-slate-500 block mb-1 font-medium">{label}</label>
      <div className="flex items-center text-slate-200 bg-slate-800/50 p-2.5 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
        {icon && <span className="mr-2 text-slate-500">{icon}</span>}
        <span className={`text-sm truncate ${isCurrency ? 'font-mono' : ''}`}>{displayValue}</span>
      </div>
    </div>
  );
};

/**
 * Panel de datos de SoftSeguros (solo lectura)
 * Muestra información proveniente del sistema externo
 */
export const SoftSegurosPanel: React.FC<SoftSegurosPanelProps> = ({ claim }) => {
  const [amparos, setAmparos] = useState<Amparo[]>([]);
  const [loadingAmparos, setLoadingAmparos] = useState(true);

  // Fetch amparos for this claim
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

  // Calculate total amparos value
  const totalAmparos = amparos.reduce((sum, a) => sum + (a.valor || 0), 0);

  return (
    <div className="w-1/3 bg-slate-900/50 border-r border-slate-800 p-4 overflow-y-auto">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
        <img
          src="https://ui-avatars.com/api/?name=S+S&background=0f172a&color=64748b"
          className="w-4 h-4 mr-2 rounded"
          alt="SS"
        />
        Datos Softseguros
      </h3>

      <div className="space-y-4">
        {/* Sección: Información Principal */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Información Principal</h4>

          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField
              label="Número Siniestro"
              value={claim.numero_siniestro}
              icon={<FileText className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Número Siniestro Compañía"
              value={claim.numero_siniestro_compania}
              icon={<Building className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="mt-3">
            <ReadOnlyField
              label="Tipo de Siniestro"
              value={claim.tipo_siniestro}
              icon={<Car className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Sección: Fechas */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Fechas</h4>

          <div className="space-y-3">
            <ReadOnlyField
              label="Fecha del Siniestro"
              value={claim.fecha_ocurrencia}
              icon={<Calendar className="w-3.5 h-3.5" />}
              isDate
            />
            <ReadOnlyField
              label="Fecha de Aviso"
              value={claim.fecha_aviso}
              icon={<Calendar className="w-3.5 h-3.5" />}
              isDate
            />
            <ReadOnlyField
              label="Fecha Notificación Aseguradora"
              value={claim.fecha_notificacion_aseguradora}
              icon={<Calendar className="w-3.5 h-3.5" />}
              isDate
            />
          </div>
        </div>

        {/* Sección: Proveedor y Descripción */}
        <div className="pb-3 border-b border-slate-800">
          <ReadOnlyField
            label="Proveedor Asignado"
            value={claim.proveedor_asignado}
            icon={<Building className="w-3.5 h-3.5" />}
          />

          <div className="mt-3 group">
            <label className="text-xs text-slate-500 block mb-1 font-medium">Descripción (Hechos)</label>
            <div className="text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-800 group-hover:border-slate-600 transition-colors min-h-[80px]">
              <p className="text-sm leading-relaxed">{claim.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
        </div>

        {/* Sección: Póliza y Aseguradora */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Póliza y Aseguradora</h4>

          <div className="space-y-3">
            <ReadOnlyField
              label="Póliza"
              value={claim.poliza}
              icon={<Shield className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Aseguradora"
              value={claim.aseguradora}
              icon={<Building className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Ramo"
              value={claim.ramo}
              icon={<Car className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Sección: Asegurado */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Asegurado</h4>

          <div className="space-y-3">
            <ReadOnlyField
              label="Nombre del Asegurado"
              value={claim.asegurado}
              icon={<User className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Documento del Asegurado"
              value={claim.documento_asegurado}
              icon={<CreditCard className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Email Principal"
              value={claim.email_principal}
              icon={<Mail className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Celular Principal"
              value={claim.celular_principal}
              icon={<Phone className="w-3.5 h-3.5" />}
            />
            <ReadOnlyField
              label="Bien Asegurado (Placa/Riesgo)"
              value={claim.placa_bien}
              icon={<Car className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Sección: Valores */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Valores</h4>

          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField
              label="Monto Reclamo"
              value={claim.monto_reclamo}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              isCurrency
            />
            <ReadOnlyField
              label="Valor Indemnización"
              value={claim.valor_indemnizacion}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              isCurrency
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <ReadOnlyField
              label="Deducible"
              value={claim.valor_deducible}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              isCurrency
            />
            <ReadOnlyField
              label="Coaseguros"
              value={claim.coaseguros}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              isCurrency
            />
          </div>
        </div>

        {/* Sección: Estado y Finalizado */}
        <div className="pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Estado</h4>

          <div className="space-y-3">
            <div className="group">
              <label className="text-xs text-slate-500 block mb-1 font-medium">Estado Origen (SoftSeguros)</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                {claim.estado_softseguros}
              </span>
            </div>

            <ReadOnlyField
              label="Registrado Por"
              value={claim.usuario_registro}
              icon={<User className="w-3.5 h-3.5" />}
            />

            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-500 font-medium">Finalizado</span>
              <div className={`flex items-center ${claim.finalizado ? 'text-emerald-400' : 'text-slate-500'}`}>
                {claim.finalizado ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Sí</span>
                  </>
                ) : (
                  <span className="text-sm">No</span>
                )}
              </div>
            </div>

            {claim.finalizado && claim.fecha_finalizacion && (
              <ReadOnlyField
                label="Fecha Finalización"
                value={claim.fecha_finalizacion}
                icon={<Calendar className="w-3.5 h-3.5" />}
                isDate
              />
            )}
          </div>
        </div>

        {/* Sección: Última Novedad */}
        <div className="pt-2">
          <label className="text-xs text-slate-500 block mb-2 font-medium">Última Novedad (Origen)</label>
          <p className="text-sm text-slate-400 italic bg-slate-800/30 p-3 rounded border border-slate-800">
            &ldquo;{claim.ultimo_seguimiento_raw || 'Sin novedades'}&rdquo;
          </p>
        </div>

        {/* Sección: Amparos Afectados */}
        {!loadingAmparos && amparos.length > 0 && (
          <div className="pt-4 border-t border-slate-700 mt-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Amparos Afectados ({amparos.length})
            </h4>

            <div className="bg-slate-800/30 rounded border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-400 p-2">Nombre Reclamante</th>
                    <th className="text-left text-xs font-medium text-slate-400 p-2">Amparo</th>
                    <th className="text-right text-xs font-medium text-slate-400 p-2">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {amparos.map((amparo) => (
                    <tr key={amparo.id} className="hover:bg-slate-800/30">
                      <td className="p-2 text-slate-300 truncate max-w-[120px]">{amparo.nombre_reclamante}</td>
                      <td className="p-2 text-slate-300">{amparo.amparo}</td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {formatCurrency(amparo.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/50 border-t border-slate-700">
                  <tr>
                    <td colSpan={2} className="p-2 text-xs font-medium text-slate-400">Total:</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(totalAmparos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
