import { supabase } from '../lib/supabase';
import { InternalState } from '../types';

/**
 * Servicio para gestionar actualizaciones de seguimiento y bitácora
 * Proporciona funciones para formatear entradas de bitácora y guardar actualizaciones
 */

export interface TrackingUpdateData {
  claimId: string;
  proximoSeguimiento: Date;
  estado: InternalState;
  descripcion: string;
  author: string;
}

export interface TrackingUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Formatea una entrada de bitácora según el formato estricto requerido:
 * "Fecha: DD/MM/YYYY - Funcionario: [Nombre] - Seg: "[Estado]" [Descripción]"
 *
 * @param date - Fecha del evento
 * @param userName - Nombre del funcionario
 * @param status - Estado seleccionado
 * @param description - Descripción ingresada
 * @returns String formateado para la bitácora
 */
export function formatBitacoraEntry(
  date: Date,
  userName: string,
  status: string,
  description: string
): string {
  const formattedDate = date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `Fecha: ${formattedDate} - Funcionario: ${userName} - Seg: "${status}"${description ? ` ${description}` : ''}`;
}

/**
 * Guarda una actualización de seguimiento y crea entrada en bitácora
 * Realiza ambas operaciones en una transacción atómica mediante RPC
 *
 * @param data - Datos de la actualización
 * @returns Resultado de la operación
 */
export async function saveTrackingUpdate(data: TrackingUpdateData): Promise<TrackingUpdateResult> {
  try {
    // Formatear el texto de la bitácora
    const timelineText = formatBitacoraEntry(
      new Date(),
      data.author,
      data.estado,
      data.descripcion
    );

    // Llamar a la función RPC para transacción atómica
    const { error } = await supabase.rpc('update_tracking_with_bitacora', {
      p_claim_id: data.claimId,
      p_proximo_seguimiento: data.proximoSeguimiento.toISOString(),
      p_estado_interno: data.estado,
      p_author: data.author,
      p_timeline_text: timelineText,
    });

    if (error) {
      console.error('Error en saveTrackingUpdate:', error);
      return {
        success: false,
        error: `Error al guardar: ${error.message}`,
      };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error inesperado en saveTrackingUpdate:', err);
    return {
      success: false,
      error: `Error inesperado: ${errorMessage}`,
    };
  }
}

/**
 * Valida que una fecha no sea anterior al día actual
 *
 * @param date - Fecha a validar
 * @returns true si la fecha es válida (hoy o futura)
 */
export function isValidFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today;
}

/**
 * Obtiene todos los estados disponibles del workflow
 * Útil para poblar dropdowns
 *
 * @returns Array de estados únicos
 */
export function getAllWorkflowStates(): string[] {
  // Importación dinámica para evitar dependencias circulares
  const { WORKFLOW_PHASES } = require('../constants');

  const states: string[] = [];
  WORKFLOW_PHASES.forEach((phase: { states: string[] }) => {
    states.push(...phase.states);
  });

  return states;
}
