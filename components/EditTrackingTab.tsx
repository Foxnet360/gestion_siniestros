import React, { useState, useEffect, useCallback } from 'react';
import { Claim, InternalState } from '../types';
import { WORKFLOW_PHASES } from '../constants';
import { useClaims } from '../context/ClaimsContext';
import { formatBitacoraEntry, isValidFutureDate } from '../services/trackingService';
import { logAction, AuditActions } from '../services/auditService';
import { Calendar, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface EditTrackingTabProps {
  claim: Claim;
  onUpdate?: (updatedClaim: Claim) => void;
}

/**
 * Pestaña de edición para actualizar seguimiento de siniestros
 * Permite modificar estado, próxima fecha de seguimiento y descripción
 * Genera automáticamente entrada en bitácora al guardar
 */
const EditTrackingTab: React.FC<EditTrackingTabProps> = ({ claim, onUpdate }) => {
  const { currentUser, updateClaim, addClaimNote } = useClaims();

  // Estado del formulario
  const [estado, setEstado] = useState<InternalState>(claim.estado_interno);
  const [proximaFecha, setProximaFecha] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fechaError, setFechaError] = useState<string | null>(null);

  // Extraer todos los estados disponibles del workflow
  const allStates: InternalState[] = WORKFLOW_PHASES.flatMap(phase => phase.states);

  /**
   * Pre-diligenciar formulario cuando cambia el claim
   */
  useEffect(() => {
    setEstado(claim.estado_interno);

    // Formatear fecha para input date (YYYY-MM-DD)
    if (claim.proximo_seguimiento) {
      const date = new Date(claim.proximo_seguimiento);
      setProximaFecha(date.toISOString().split('T')[0]);
    } else {
      // Default: fecha actual + 7 días
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setProximaFecha(defaultDate.toISOString().split('T')[0]);
    }

    setDescripcion('');
    setError(null);
    setSuccess(null);
    setFechaError(null);
  }, [claim.id_softseguros, claim.estado_interno, claim.proximo_seguimiento]);

  /**
   * Validar fecha cuando cambia
   */
  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setProximaFecha(selectedDate);

    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!isValidFutureDate(date)) {
        setFechaError('La fecha no puede ser anterior a hoy');
      } else {
        setFechaError(null);
      }
    } else {
      setFechaError('La fecha es requerida');
    }
  };

  /**
   * Manejar guardado de cambios
   */
  const handleSave = useCallback(async () => {
    // Validaciones
    setError(null);
    setSuccess(null);

    if (!proximaFecha) {
      setError('La fecha de próximo seguimiento es requerida');
      return;
    }

    const fechaDate = new Date(proximaFecha);
    if (!isValidFutureDate(fechaDate)) {
      setError('La fecha de próximo seguimiento no puede ser anterior a hoy');
      return;
    }

    if (!currentUser) {
      setError('Debe estar autenticado para guardar cambios');
      return;
    }

    setIsLoading(true);

    try {
      const author = currentUser.name || currentUser.email || 'Usuario desconocido';
      const timelineText = formatBitacoraEntry(new Date(), author, estado, descripcion.trim());

      console.log('📝 Guardando seguimiento:', {
        claimId: claim.id_softseguros,
        estadoActual: claim.estado_interno,
        estadoNuevo: estado,
        proximo_seguimiento: fechaDate.toISOString(),
        timelineText,
      });

      // 1. Crear el objeto claim actualizado
      const updatedClaim: Claim = {
        ...claim,
        estado_interno: estado,
        proximo_seguimiento: fechaDate.toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            author: author,
            text: timelineText,
            isSystem: true,
          },
          ...(claim.timeline || []),
        ],
      };

      // Si el estado es FINALIZADO o PAGADO, marcar como finalizado
      if (estado === 'FINALIZADO' || estado === 'PAGADO') {
        updatedClaim.finalizado = true;
        updatedClaim.fecha_finalizacion = new Date().toISOString();
        console.log('✅ Estado final detectado, marcando como finalizado');
      }

      // 2. Usar updateClaim del contexto (que ya maneja la lógica de Supabase)
      await updateClaim(updatedClaim);

      // 3. Insertar en timeline usando addClaimNote del contexto
      await addClaimNote(claim.id_softseguros, {
        date: new Date().toISOString(),
        author: author,
        text: timelineText,
        isSystem: true,
      });

      console.log('✅ Seguimiento guardado exitosamente');
      setSuccess('Seguimiento guardado exitosamente');

      // Registrar en auditoría
      await logAction(AuditActions.UPDATE_CLAIM, 'claim', claim.id_softseguros, {
        numero_siniestro: claim.numero_siniestro,
        old_state: claim.estado_interno,
        new_state: estado,
        proximo_seguimiento: fechaDate.toISOString(),
        description: descripcion.trim(),
      });

      // Notificar al componente padre
      if (onUpdate) {
        onUpdate(updatedClaim);
      }

      // Limpiar descripción después de guardar exitosamente
      setDescripcion('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al guardar:', err);
      setError(`Error al guardar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [claim, estado, proximaFecha, descripcion, currentUser, onUpdate, updateClaim, addClaimNote]);

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-4 lg:p-6 overflow-y-auto">
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Actualizar Seguimiento
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Siniestro: <span className="font-medium">{claim.numero_siniestro}</span> | Asegurado:{' '}
            <span className="font-medium">{claim.asegurado}</span>
          </p>
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="space-y-6">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado del Siniestro
            </label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value as InternalState)}
              className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                estado === 'FINALIZADO' || estado === 'PAGADO'
                  ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              disabled={isLoading}
            >
              {allStates.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {(estado === 'FINALIZADO' || estado === 'PAGADO') && (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Este estado marcará el siniestro como finalizado y registrará la fecha de cierre
              </p>
            )}
          </div>

          {/* Próxima Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Próxima Fecha de Seguimiento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={proximaFecha}
                onChange={handleFechaChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fechaError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isLoading}
              />
            </div>
            {fechaError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fechaError}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción del Seguimiento
            </label>
            <textarea
              value={descripcion}
              onChange={e => {
                if (e.target.value.length <= 2000) {
                  setDescripcion(e.target.value);
                }
              }}
              placeholder="Ingrese los detalles del seguimiento..."
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              disabled={isLoading}
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Máximo 2000 caracteres</span>
              <span>{descripcion.length}/2000</span>
            </div>
          </div>

          {/* Preview de bitácora */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Vista previa de la bitácora:
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 font-mono bg-white dark:bg-slate-800 p-3 rounded border border-blue-200 dark:border-blue-700">
              {formatBitacoraEntry(
                new Date(),
                currentUser?.name || currentUser?.email || 'Funcionario',
                estado,
                descripcion.trim()
              )}
            </p>
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={isLoading || !!fechaError || !proximaFecha}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Seguimiento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTrackingTab;
