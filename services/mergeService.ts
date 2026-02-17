import { supabase } from '../lib/supabase';
import { Claim, Amparo, TimelineEvent, InternalState, Priority } from '../types';
import { SOFTSEGUROS_OWNED_FIELDS } from '../constants';
import { addYears, parse } from 'date-fns';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MergeResult {
    action: 'created' | 'updated' | 'unchanged';
    claim: Claim;
    changes?: Partial<Claim>;
}

export interface AmparosMergeResult {
    inserted: number;
    updated: number;
    deleted: number;
}

export interface IngestionReport {
    claims: {
        created: number;
        updated: number;
        unchanged: number;
    };
    amparos: {
        inserted: number;
        updated: number;
        deleted: number;
    };
    duration_ms: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Debug flag - enable to see detailed comparison logs
const DEBUG_AUDIT = true;

/**
 * Normalizes and compares two values for equality
 * Handles type conversions and edge cases that cause false positives
 */
function valuesEqual(excelValue: any, dbValue: any, fieldName: string): boolean {
    // Normalize undefined/null/empty values
    const isEmpty = (v: any): boolean => {
        return v === undefined || v === null || v === '';
    };

    const valA = excelValue;
    const valB = dbValue;

    // Both empty = equal
    if (isEmpty(valA) && isEmpty(valB)) {
        return true;
    }

    // One empty, one not = different
    if (isEmpty(valA) || isEmpty(valB)) {
        if (DEBUG_AUDIT) {
            console.log(`  [AUDIT] ${fieldName}: empty vs non-empty`, { excel: valA, db: valB });
        }
        return false;
    }

    // Date field comparison - normalize to YYYY-MM-DD
    if (fieldName.startsWith('fecha_')) {
        try {
            // Extract date portion only (ignore time and timezone)
            const dateA = new Date(valA).toISOString().split('T')[0];
            const dateB = new Date(valB).toISOString().split('T')[0];
            if (dateA !== dateB && DEBUG_AUDIT) {
                console.log(`  [AUDIT] ${fieldName}: date mismatch`, { excel: dateA, db: dateB });
            }
            return dateA === dateB;
        } catch {
            return false;
        }
    }

    // Currency/numeric field comparison - normalize to number with 2 decimals
    const currencyFields = [
        'monto_reclamo', 'valor_deducible', 'valor_indemnizacion',
        'coaseguros', 'porcentaje_siniestralidad'
    ];
    if (currencyFields.includes(fieldName)) {
        const numA = Number(valA);
        const numB = Number(valB);
        // Compare with tolerance for floating point issues
        const equal = Math.abs(numA - numB) < 0.01;
        if (!equal && DEBUG_AUDIT) {
            console.log(`  [AUDIT] ${fieldName}: number mismatch`, { excel: numA, db: numB, diff: Math.abs(numA - numB) });
        }
        return equal;
    }

    // String comparison - trim and normalize
    if (typeof valA === 'string' || typeof valB === 'string') {
        const strA = String(valA).trim();
        const strB = String(valB).trim();
        if (strA !== strB && DEBUG_AUDIT) {
            console.log(`  [AUDIT] ${fieldName}: string mismatch`, { excel: strA, db: strB });
        }
        return strA === strB;
    }

    // Boolean comparison
    if (typeof valA === 'boolean' || typeof valB === 'boolean') {
        const boolA = Boolean(valA);
        const boolB = Boolean(valB);
        if (boolA !== boolB && DEBUG_AUDIT) {
            console.log(`  [AUDIT] ${fieldName}: boolean mismatch`, { excel: boolA, db: boolB });
        }
        return boolA === boolB;
    }

    // Default strict comparison
    if (valA !== valB && DEBUG_AUDIT) {
        console.log(`  [AUDIT] ${fieldName}: strict mismatch`, { excel: valA, db: valB, types: [typeof valA, typeof valB] });
    }
    return valA === valB;
}

/**
 * Parse "Último Seguimiento" field into structured timeline entry
 * Pattern: Fecha: DD/MM/YYYY - Funcionario: [name] - Seguimiento: "[state]" [notes]
 */
export function parseUltimoSeguimiento(raw: string): TimelineEvent | null {
    if (!raw || raw.trim() === '') return null;

    // Regex pattern for structured format
    const pattern = /Fecha:\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*Funcionario:\s*([^-]+)\s*-\s*Seguimiento:\s*"([^"]+)"\s*(.*)/;
    const match = raw.match(pattern);

    if (match) {
        const [, dateStr, funcionario, seguimiento, notes] = match;

        // Parse DD/MM/YYYY date
        const dateParts = dateStr.split('/');
        const date = new Date(
            parseInt(dateParts[2]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[0]) // day
        );

        return {
            id: `timeline-${Date.now()}-${Math.random()}`,
            date: date.toISOString(),
            author: funcionario.trim(),
            text: `${seguimiento}${notes ? ' ' + notes : ''}`.trim(),
            isSystem: false
        };
    }

    // Fallback: unstructured format
    return {
        id: `timeline-${Date.now()}-${Math.random()}`,
        date: new Date().toISOString(),
        author: 'SoftSeguros',
        text: raw,
        isSystem: false
    };
}

/**
 * Handle state change: close current state_history entry and create new one
 */
export async function handleStateChange(
    claimId: string,
    oldState: string,
    newState: string,
    author: string = 'Sistema (Ingesta)'
): Promise<void> {
    const now = new Date().toISOString();

    // 1. Close current open state_history entry
    const { data: currentHistory } = await supabase
        .from('state_history')
        .select('*')
        .eq('claim_id', claimId)
        .is('end_date', null)
        .maybeSingle();

    if (currentHistory) {
        const startDate = new Date(currentHistory.start_date);
        const endDate = new Date(now);
        const daysDuration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        await supabase
            .from('state_history')
            .update({
                end_date: now,
                days_duration: daysDuration
            })
            .eq('id', currentHistory.id);
    }

    // 2. Create new state_history entry
    await supabase
        .from('state_history')
        .insert({
            claim_id: claimId,
            state: newState,
            start_date: now,
            end_date: null,
            days_duration: null,
            author
        });

    // 3. Create system timeline entry
    await supabase
        .from('timeline')
        .insert({
            claim_id: claimId,
            date: now,
            author: 'Sistema',
            text: `Estado cambió de "${oldState}" a "${newState}"`,
            isSystem: true
        });
}

/**
 * Handle último seguimiento change: parse and insert timeline entry
 */
export async function handleUltimoSeguimientoChange(
    claimId: string,
    newText: string
): Promise<void> {
    const timelineEntry = parseUltimoSeguimiento(newText);

    if (timelineEntry) {
        await supabase
            .from('timeline')
            .insert({
                claim_id: claimId,
                date: timelineEntry.date,
                author: timelineEntry.author,
                text: timelineEntry.text,
                isSystem: timelineEntry.isSystem
            });
    }
}

/**
 * Merge a single claim from Excel data
 */
export async function mergeClaimFromExcel(
    excelRow: Partial<Claim>,
    existingClaim?: Claim
): Promise<MergeResult> {
    const id = excelRow.id_softseguros!;

    // NEW CLAIM CASE
    if (!existingClaim) {
        // Calculate prescription dates
        const fechaSiniestro = excelRow.fecha_ocurrencia ? new Date(excelRow.fecha_ocurrencia) : new Date();
        const prescripcionOrdinaria = addYears(fechaSiniestro, 2).toISOString().split('T')[0];
        const prescripcionExtraordinaria = addYears(fechaSiniestro, 5).toISOString().split('T')[0];

        const newClaim: Partial<Claim> = {
            ...excelRow,
            // Internal defaults
            id_interno: `INT-${id}`,
            estado_interno: 'AVISO SINIESTRO' as InternalState,
            prioridad: Priority.MEDIA,
            tecnico_asignado: excelRow.tecnico_asignado || 'Sin Asignar',
            lastStateChangeDate: new Date().toISOString(),
            // Calculated fields
            prescripcion_ordinaria: prescripcionOrdinaria,
            prescripcion_extraordinaria: prescripcionExtraordinaria,
            updatedAt: new Date().toISOString()
        };

        // Insert into database
        const { data, error } = await supabase
            .from('claims')
            .insert(newClaim)
            .select()
            .single();

        if (error) throw error;

        // Create initial state_history entry
        await supabase
            .from('state_history')
            .insert({
                claim_id: id,
                state: 'AVISO SINIESTRO',
                start_date: new Date().toISOString(),
                author: 'Sistema (Ingesta)'
            });

        // Create initial timeline entry
        await supabase
            .from('timeline')
            .insert({
                claim_id: id,
                date: new Date().toISOString(),
                author: 'Sistema',
                text: 'Claim creado desde ingesta',
                isSystem: true
            });

        return {
            action: 'created',
            claim: data as Claim
        };
    }

    // EXISTING CLAIM CASE - Compare SoftSeguros fields
    const updates: Record<string, any> = {};
    let hasChanges = false;
    const changedFields: string[] = [];

    for (const field of SOFTSEGUROS_OWNED_FIELDS) {
        const excelValue = excelRow[field];
        const dbValue = existingClaim[field];

        // Use normalized comparison instead of simple !==
        if (!valuesEqual(excelValue, dbValue, field as string)) {
            updates[field as string] = excelValue;
            hasChanges = true;
            changedFields.push(field as string);
        }
    }

    // Debug logging for first claim
    if (DEBUG_AUDIT && hasChanges && changedFields.length > 0) {
        console.log(`\n[AUDIT] Claim ${id} - Fields changed:`, changedFields);
        console.log(`  Updated fields:`, Object.keys(updates));
    }

    // No changes detected
    if (!hasChanges) {
        return {
            action: 'unchanged',
            claim: existingClaim
        };
    }

    // Detect state change
    if (updates.estado_softseguros && updates.estado_softseguros !== existingClaim.estado_softseguros) {
        await handleStateChange(
            id,
            existingClaim.estado_softseguros,
            updates.estado_softseguros as string
        );
    }

    // Detect último seguimiento change
    if (updates.ultimo_seguimiento_raw && updates.ultimo_seguimiento_raw !== existingClaim.ultimo_seguimiento_raw) {
        await handleUltimoSeguimientoChange(id, updates.ultimo_seguimiento_raw as string);
    }

    // Apply updates
    updates.updatedAt = new Date().toISOString();

    const { data, error } = await supabase
        .from('claims')
        .update(updates)
        .eq('id_softseguros', id)
        .select()
        .single();

    if (error) throw error;

    return {
        action: 'updated',
        claim: data as Claim,
        changes: updates
    };
}

/**
 * Merge amparos for a claim using composite key matching
 */
export async function mergeAmparos(
    claimId: string,
    excelAmparos: Partial<Amparo>[]
): Promise<AmparosMergeResult> {
    const result: AmparosMergeResult = {
        inserted: 0,
        updated: 0,
        deleted: 0
    };

    console.log(`[AMPAROS] Processing claim ${claimId}: ${excelAmparos.length} amparos from Excel`);

    // Fetch existing amparos from database
    const { data: dbAmparos, error: fetchError } = await supabase
        .from('amparos')
        .select('*')
        .eq('claim_id', claimId);

    if (fetchError) throw fetchError;

    console.log(`[AMPAROS] Found ${dbAmparos?.length || 0} existing amparos in DB for ${claimId}`);

    // Build maps by composite key (amparo + nombre_reclamante)
    const getCompositeKey = (a: Partial<Amparo>) => `${a.amparo}|${a.nombre_reclamante}`;

    const dbMap = new Map<string, Amparo>();
    (dbAmparos || []).forEach(a => dbMap.set(getCompositeKey(a), a));

    const excelMap = new Map<string, Partial<Amparo>>();
    excelAmparos.forEach(a => excelMap.set(getCompositeKey(a), a));

    // Identify new amparos (in Excel, not in DB)
    const toInsert: Partial<Amparo>[] = [];
    for (const [key, excelAmparo] of excelMap.entries()) {
        if (!dbMap.has(key)) {
            toInsert.push({
                ...excelAmparo,
                claim_id: claimId
            });
        }
    }

    // Identify updated amparos (different valor)
    const toUpdate: { id: string; valor: number }[] = [];
    for (const [key, excelAmparo] of excelMap.entries()) {
        const dbAmparo = dbMap.get(key);
        if (dbAmparo && dbAmparo.valor !== excelAmparo.valor) {
            toUpdate.push({
                id: dbAmparo.id,
                valor: excelAmparo.valor!
            });
        }
    }

    // Identify deleted amparos (in DB, not in Excel)
    const toDelete: string[] = [];
    for (const [key, dbAmparo] of dbMap.entries()) {
        if (!excelMap.has(key)) {
            toDelete.push(dbAmparo.id);
        }
    }

    // Execute operations
    if (toInsert.length > 0) {
        const { error } = await supabase.from('amparos').insert(toInsert);
        if (error) throw error;
        result.inserted = toInsert.length;
    }

    for (const update of toUpdate) {
        const { error } = await supabase
            .from('amparos')
            .update({ valor: update.valor })
            .eq('id', update.id);
        if (error) throw error;
        result.updated++;
    }

    if (toDelete.length > 0) {
        const { error } = await supabase
            .from('amparos')
            .delete()
            .in('id', toDelete);
        if (error) throw error;
        result.deleted = toDelete.length;
    }

    console.log(`[AMPAROS] Claim ${claimId} completed: +${result.inserted} inserted, ~${result.updated} updated, -${result.deleted} deleted`);

    return result;
}

/**
 * Main ingestion function - batch process claims and amparos
 */
export async function ingestClaims(
    claims: Partial<Claim>[],
    amparos: Partial<Amparo>[]
): Promise<IngestionReport> {
    const startTime = Date.now();

    const report: IngestionReport = {
        claims: { created: 0, updated: 0, unchanged: 0 },
        amparos: { inserted: 0, updated: 0, deleted: 0 },
        duration_ms: 0
    };

    const BATCH_SIZE = 100;

    // Debug: Check amparos data
    console.log(`[INGEST] Total amparos received: ${amparos.length}`);
    if (amparos.length > 0) {
        console.log(`[INGEST] Sample amparo:`, amparos[0]);
        console.log(`[INGEST] Unique claim_ids in amparos:`, [...new Set(amparos.map(a => a.claim_id))].slice(0, 5));
    }

    // Debug: Check claims data
    console.log(`[INGEST] Total claims received: ${claims.length}`);
    if (claims.length > 0) {
        console.log(`[INGEST] Sample claim id_softseguros:`, claims[0].id_softseguros);
    }

    // Process claims in batches
    for (let i = 0; i < claims.length; i += BATCH_SIZE) {
        const batch = claims.slice(i, i + BATCH_SIZE);

        await Promise.all(
            batch.map(async (claim) => {
                const id = claim.id_softseguros!;

                // Fetch existing claim
                const { data: existing } = await supabase
                    .from('claims')
                    .select('*')
                    .eq('id_softseguros', id)
                    .maybeSingle();

                // Merge claim
                const result = await mergeClaimFromExcel(claim, existing as Claim | undefined);
                report.claims[result.action]++;

                // Merge amparos for this claim
                const claimAmparos = amparos.filter(a => a.claim_id === id);

                // Debug: Log first few claims
                if (i === 0 && (claims.indexOf(claim) < 3)) {
                    console.log(`[INGEST] Claim ${id}: Found ${claimAmparos.length} amparos`);
                }

                if (claimAmparos.length > 0) {
                    console.log(`[INGEST] Processing ${claimAmparos.length} amparos for claim ${id}`);
                    const amparoResult = await mergeAmparos(id, claimAmparos);
                    report.amparos.inserted += amparoResult.inserted;
                    report.amparos.updated += amparoResult.updated;
                    report.amparos.deleted += amparoResult.deleted;
                }
            })
        );
    }

    report.duration_ms = Date.now() - startTime;

    console.log('[INGESTION COMPLETE] Final Report:');
    console.log(`  Claims: ${report.claims.created} created, ${report.claims.updated} updated, ${report.claims.unchanged} unchanged`);
    console.log(`  Amparos: ${report.amparos.inserted} inserted, ${report.amparos.updated} updated, ${report.amparos.deleted} deleted`);
    console.log(`  Duration: ${report.duration_ms}ms`);

    // Log global ingestion event to timeline
    await supabase.from('timeline').insert({
        claim_id: null, // System-wide event
        date: new Date().toISOString(),
        author: 'Sistema (Ingesta)',
        text: `Ingesta finalizada: ${report.claims.created} nuevos, ${report.claims.updated} actualizados. (${report.duration_ms}ms)`,
        isSystem: true
    });

    return report;
}
