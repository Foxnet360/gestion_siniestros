import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Claim, InternalState } from '../types';
import { WORKFLOW_PHASES } from '../constants';
import { useClaims } from '../context/ClaimsContext';
import { formatBitacoraEntry, isValidFutureDate } from '../services/trackingService';
import { logAction, AuditActions } from '../services/auditService';
import {
  calculateNextFollowUp,
  validateFollowUpDate,
  getMaxDaysForState,
  getMinDaysForState,
} from '../services/followUpCalculationService';
import { getApplicablePrescriptionDate } from '../services/prescriptionService';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calculator,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface EditTrackingTabProps {
  claim: Claim;
  onUpdate?: (updatedClaim: Claim) => void;
}

/**
 * Pestaña de edición para actualizar seguimiento de siniestros
 * Permite modificar estado, próxima fecha de seguimiento y descripción
 * Genera automáticamente entrada en bitácora al guardar
 *
 * MEJORAS:
 * - Cálculo automático de fechas basado en reglas de negocio
 * - Indicador visual de fecha calculada vs manual
 * - Advertencias de prescripción
 * - Recálculo automático al cambiar estado
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

  // Estados para el nuevo sistema de cálculo automático
  const [calculatedDate, setCalculatedDate] = useState<Date | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);
  const [prescriptionDate, setPrescriptionDate] = useState<Date | null>(null);
  const [prescriptionWarning, setPrescriptionWarning] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Extraer todos los estados disponibles del workflow
  const allStates: InternalState[] = WORKFLOW_PHASES.flatMap(phase => phase.states);

  // Calcular fechas de prescripción
  useEffect(() => {
    const prescription = getApplicablePrescriptionDate(claim);
    setPrescriptionDate(prescription);
  }, [claim]);

  /**
   * Calcular fecha sugerida automáticamente
   */
  const calculateSuggestedDate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const suggestedDate = await calculateNextFollowUp(claim);
      setCalculatedDate(suggestedDate);
      return suggestedDate;
    } catch (err) {
      console.error('Error calculando fecha:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [claim]);

  /**
   * Pre-diligenciar formulario cuando cambia el claim
   */
  useEffect(() => {
    setEstado(claim.estado_interno);

    // Calcular fecha sugerida automáticamente
    calculateSuggestedDate().then(suggestedDate => {
      // Formatear fecha para input date (YYYY-MM-DD)
      if (claim.proximo_seguimiento) {
        const date = new Date(claim.proximo_seguimiento);
        setProximaFecha(date.toISOString().split('T')[0]);

        // Verificar si la fecha actual es diferente de la calculada
        if (suggestedDate) {
          const suggestedStr = suggestedDate.toISOString().split('T')[0];
          const currentStr = date.toISOString().split('T')[0];
          setIsOverridden(suggestedStr !== currentStr);
        }
      } else if (suggestedDate) {
        // Usar fecha calculada como default
        setProximaFecha(suggestedDate.toISOString().split('T')[0]);
        setIsOverridden(false);
      } else {
        // Fallback: fecha actual + 7 días
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setProximaFecha(defaultDate.toISOString().split('T')[0]);
      }
    });

    setDescripcion('');
    setError(null);
    setSuccess(null);
    setFechaError(null);
    setPrescriptionWarning(null);
    setDateRangeError(null);
  }, [
    claim.id_softseguros,
    claim.estado_interno,
    claim.proximo_seguimiento,
    calculateSuggestedDate,
  ]);

  /**
   * Recalcular fecha cuando cambia el estado
   */
  useEffect(() => {
    if (estado !== claim.estado_interno) {
      // Crear un objeto claim temporal con el nuevo estado
      const tempClaim = { ...claim, estado_interno: estado };

      calculateNextFollowUp(tempClaim).then(newDate => {
        if (newDate && !isOverridden) {
          setCalculatedDate(newDate);
          setProximaFecha(newDate.toISOString().split('T')[0]);
          setIsOverridden(false);
        }
      });
    }
  }, [estado, claim, isOverridden]);

  /**
   * Validar fecha cuando cambia
   */
  const handleFechaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setProximaFecha(selectedDate);

    if (selectedDate) {
      const date = new Date(selectedDate);

      // Validación básica
      if (!isValidFutureDate(date)) {
        setFechaError('La fecha no puede ser anterior a hoy');
      } else {
        setFechaError(null);
      }

      // Validación de rango según el estado
      const validation = await validateFollowUpDate(estado, date);
      if (!validation.valid) {
        setDateRangeError(validation.error || null);
      } else {
        setDateRangeError(null);
      }

      // Verificar si es diferente de la calculada
      if (calculatedDate) {
        const calculatedStr = calculatedDate.toISOString().split('T')[0];
        setIsOverridden(selectedDate !== calculatedStr);
      }

      // Verificar advertencia de prescripción
      if (prescriptionDate) {
        const daysToPrescription = differenceInDays(prescriptionDate, date);
        if (daysToPrescription < 0) {
          setPrescriptionWarning(
            '⚠️ La fecha seleccionada está después de la fecha de prescripción. El siniestro podría vencer antes del próximo seguimiento.'
          );
        } else if (daysToPrescription <= 7) {
          setPrescriptionWarning(
            `⚠️ La prescripción vence en ${daysToPrescription} días. Considere cerrar el siniestro antes.`
          );
        } else {
          setPrescriptionWarning(null);
        }
      }
    } else {
      setFechaError('La fecha es requerida');
      setPrescriptionWarning(null);
    }
  };

  /**
   * Restaurar fecha calculada
   */
  const handleRestoreCalculatedDate = async () => {
    const suggestedDate = await calculateNextFollowUp(claim);
    if (suggestedDate) {
      setCalculatedDate(suggestedDate);
      setProximaFecha(suggestedDate.toISOString().split('T')[0]);
      setIsOverridden(false);
      setPrescriptionWarning(null);
      setFechaError(null);
      setDateRangeError(null);
    }
  };

  /**
   * Formatear fecha de prescripción para mostrar
   */
  const formatPrescriptionDate = (date: Date | null): string => {
    if (!date) return 'No calculada';
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  /**
   * Obtener días restantes hasta prescripción
   */
  const getDaysToPrescription = (): number | null => {
    if (!prescriptionDate) return null;
    const today = new Date();
    return differenceInDays(prescriptionDate, today);
  };

  const daysToPrescription = getDaysToPrescription();

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
        isOverridden,
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
        is_date_overridden: isOverridden,
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
  }, [
    claim,
    estado,
    proximaFecha,
    descripcion,
    currentUser,
    onUpdate,
    updateClaim,
    addClaimNote,
    isOverridden,
  ]);

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

        {/* Información de Prescripción */}
        {prescriptionDate && (
          <div
            className={`mb-4 p-4 rounded-lg border ${
              daysToPrescription !== null && daysToPrescription <= 30
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : daysToPrescription !== null && daysToPrescription <= 90
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <Info
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  daysToPrescription !== null && daysToPrescription <= 30
                    ? 'text-red-600 dark:text-red-400'
                    : daysToPrescription !== null && daysToPrescription <= 90
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                }`}
              />
              <div className="flex-1">
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    daysToPrescription !== null && daysToPrescription <= 30
                      ? 'text-red-800 dark:text-red-300'
                      : daysToPrescription !== null && daysToPrescription <= 90
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-blue-800 dark:text-blue-300'
                  }`}
                >
                  Fecha de Prescripción
                </h4>
                <p
                  className={`text-sm ${
                    daysToPrescription !== null && daysToPrescription <= 30
                      ? 'text-red-700 dark:text-red-300'
                      : daysToPrescription !== null && daysToPrescription <= 90
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {formatPrescriptionDate(prescriptionDate)}
                  {daysToPrescription !== null && (
                    <span className="ml-2 font-medium">
                      (
                      {daysToPrescription <= 0 ? 'VENCIDA' : `${daysToPrescription} días restantes`}
                      )
                    </span>
                  )}
                </p>
                {claim.fecha_prescripcion_extraordinaria && (
                  <p className="text-xs mt-1 opacity-75">
                    Prescripción extraordinaria (Responsabilidad Civil - 5 años)
                  </p>
                )}
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Próxima Fecha de Seguimiento
              </label>
              {isOverridden && (
                <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Fecha modificada manualmente
                </span>
              )}
              {!isOverridden && calculatedDate && (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Calculado automáticamente
                </span>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={proximaFecha}
                onChange={handleFechaChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fechaError || dateRangeError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isOverridden
                      ? 'border-amber-300 dark:border-amber-600'
                      : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isLoading || isCalculating}
              />
              {isCalculating && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>
            {fechaError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fechaError}</p>
            )}
            {dateRangeError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{dateRangeError}</p>
            )}
            {prescriptionWarning && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {prescriptionWarning}
              </p>
            )}

            {/* Botón restaurar fecha calculada */}
            {isOverridden && (
              <button
                onClick={handleRestoreCalculatedDate}
                disabled={isCalculating}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
                {isCalculating ? 'Calculando...' : 'Restaurar fecha calculada'}
              </button>
            )}
          </div>

          {/* Info de fecha calculada */}
          {calculatedDate && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm">
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-medium">Fecha calculada:</span>{' '}
                {format(calculatedDate, 'dd/MM/yyyy', { locale: es })}
                <span className="mx-2">•</span>
                <span className="font-medium">Desde hoy:</span>{' '}
                {differenceInDays(calculatedDate, new Date())} días
              </p>
            </div>
          )}

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
            disabled={isLoading || !!fechaError || !!dateRangeError || !proximaFecha}
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
