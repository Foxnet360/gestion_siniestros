import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// LOGIC COPIED FROM MetricasEtapasService.ts
// ============================================================================

const FERIADOS_2024 = ['2024-01-01','2024-01-08','2024-03-25','2024-03-28','2024-03-29','2024-05-01','2024-05-13','2024-06-03','2024-06-10','2024-07-01','2024-07-20','2024-08-07','2024-08-19','2024-10-14','2024-11-04','2024-11-11','2024-12-08','2024-12-25'];
const FERIADOS_2025 = ['2025-01-01','2025-01-06','2025-03-24','2025-04-17','2025-04-18','2025-05-01','2025-06-02','2025-06-23','2025-06-30','2025-07-20','2025-08-07','2025-08-18','2025-10-13','2025-11-03','2025-11-17','2025-12-08','2025-12-25'];
const feriadosCache = new Set([...FERIADOS_2024, ...FERIADOS_2025]);

function esDiaHabil(date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const fechaStr = date.toISOString().split('T')[0];
    return !feriadosCache.has(fechaStr);
}

function calcularDiasHabiles(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.toDateString() === end.toDateString()) return esDiaHabil(start) ? 1 : 0;
    let businessDays = 0;
    const current = new Date(start);
    while (current <= end) {
        if (esDiaHabil(current)) businessDays++;
        current.setDate(current.getDate() + 1);
    }
    return businessDays;
}

function calcularDiasCalendario(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function convertirEtapasAArray(etapas: any): any[] {
    const etapasArray: any[] = [];
    for (let i = 1; i <= 16; i++) {
        const fecha = etapas[`etapa_${i}_fecha`];
        if (fecha) {
            etapasArray.push({ etapaNum: i, fecha: fecha });
        }
    }
    return etapasArray.sort((a, b) => a.etapaNum - b.etapaNum);
}

function validarCompletitud(etapas: any[]): { esCompleto: boolean; razon?: string } {
    const nums = etapas.map(e => e.etapaNum);
    const tiene1 = nums.includes(1);
    const tiene16 = nums.includes(16);
    if (tiene1 && tiene16) return { esCompleto: true };
    if (!tiene1 && !tiene16) return { esCompleto: false, razon: 'sin_etapa_1_y_16' };
    if (!tiene1) return { esCompleto: false, razon: 'sin_etapa_1' };
    return { esCompleto: false, razon: 'sin_etapa_16' };
}

function calcularRangoValor(valor: number | null | undefined): string {
    if (!valor) return 'sin_valor';
    if (valor <= 5000000) return '0-5M';
    if (valor <= 20000000) return '5M-20M';
    return '>20M';
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function start() {
    console.log('🚀 STANDALONE POPULATION START (v2)');

    const { data: claims, error: claimsErr } = await supabase.from('claims').select('id_softseguros, aseguradora, ramo, tecnico_id, valor_indemnizacion');
    if (claimsErr) { console.error('Claims error:', claimsErr); return; }
    
    const { data: allEtapas, error: etapasErr } = await supabase.from('siniestro_etapas').select('*');
    if (etapasErr) { console.error('Etapas error:', etapasErr); return; }

    console.log(`📊 Processing ${allEtapas.length} stages records...`);

    const claimDataMap = new Map(claims.map(c => [c.id_softseguros, c]));
    let ok = 0, skip = 0, errCount = 0;

    for (const record of allEtapas) {
        const claimId = record.claim_id;
        const claim = claimDataMap.get(claimId);
        if (!claim) { skip++; continue; }

        const etapasArray = convertirEtapasAArray(record);
        const validacion = validarCompletitud(etapasArray);
        const rangoValor = calcularRangoValor(claim.valor_indemnizacion);

        const metricas: any[] = [];
        let leadTimeTotal = 0;

        for (let i = 0; i < etapasArray.length - 1; i++) {
            const e1 = etapasArray[i];
            const e2 = etapasArray[i + 1];
            
            const dh = calcularDiasHabiles(e1.fecha, e2.fecha);
            const dc = calcularDiasCalendario(e1.fecha, e2.fecha);
            leadTimeTotal += dh;

            metricas.push({
                claim_id: claimId,
                etapa_num: e1.etapaNum,
                fecha_entrada: e1.fecha,
                fecha_salida: e2.fecha,
                dias_habiles: dh,
                dias_calendario: dc,
                paso_a_siguiente_etapa: true,
                etapa_siguiente: e2.etapaNum,
                datos_completos: validacion.esCompleto,
                razon_incompleto: validacion.esCompleto ? null : validacion.razon,
                aseguradora_id: claim.aseguradora,
                ramo_id: claim.ramo,
                tecnico_id: claim.tecnico_id,
                tipo_proceso: 'normal',
                rango_valor: rangoValor
            });
        }

        const tipoProceso = leadTimeTotal < 365 ? 'normal' : (leadTimeTotal < 1095 ? 'prescripcion_ordinaria' : 'prescripcion_extraordinaria');
        metricas.forEach(m => m.tipo_proceso = tipoProceso);

        if (metricas.length > 0) {
            const { error: upsertErr } = await supabase.from('metricas_etapas').upsert(metricas, { onConflict: 'claim_id,etapa_num' });
            if (!upsertErr) ok++; else {
                console.error(`Error saving ${claimId}:`, upsertErr);
                errCount++;
            }
        } else {
            skip++;
        }

        if ((ok + skip + errCount) % 100 === 0 || (ok+skip+errCount) === allEtapas.length) {
            console.log(`Progress: ${ok + skip + errCount}/${allEtapas.length} (OK: ${ok}, Skip: ${skip}, Err: ${errCount})`);
        }
    }

    console.log('✅ DONE.');
}

start().catch(console.error);
